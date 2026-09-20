# PairPulse

**PairPulse** is an ultra-low-latency, cross-device desktop signaling system built for Windows. It allows a background agent on **Laptop A** (Controller) to trigger an instant fullscreen borderless privacy shield / overlay on **Laptop B** (Receiver) across the Internet, even through restrictive college and corporate Wi-Fi networks.

---

## Architecture Overview

```
Laptop A (Controller)                     Cloud Relay (Node.js/TS)                   Laptop B (Receiver)
+---------------------+                   +----------------------+                   +---------------------+
| Win32 Message Loop  |                   | WebSocket Server     |                   | Pre-created Win32   |
| Global Hotkey (QPC) |                   | Port 443 / TLS (WSS) |                   | Borderless Overlay  |
|      (T0)           |                   |                      |                   | (Hidden in memory)  |
|         v           |                   | In-Memory Route Map  |                   |         ^           |
| Non-blocking Queue  |                   | [PairID -> Sockets]  |                   |         | (T5)      |
|         v           |                   |                      |                   | ShowWindow(SW_SHOW) |
| Persistent WSS (T1) |====(Outbound)====>| (T2) Recv -> Fwd(T3) |====(Outbound)====>| (T4) Recv Event     |
+---------------------+                   +----------------------+                   +---------------------+
```

---

## Core Technical Explanations

### 1. How Laptop A Communicates with Laptop B Over the Internet
Direct peer-to-peer inbound connections between two standard consumer laptops on arbitrary Internet connections are almost always impossible due to Carrier-Grade NAT (CGNAT), symmetric firewalls, and institutional filtering.

PairPulse resolves this by introducing a **Cloud Relay Server**. Both Laptop A and Laptop B establish and maintain an **outbound persistent WebSocket Secure (WSS)** connection to the relay. When Laptop A sends an overlay signal, it flows outbound to the relay over its existing socket. The relay matches the session in an in-memory route table and immediately transmits the packet down the existing outbound socket already open with Laptop B.

### 2. Why It Works Behind NAT and Restrictive College/Corporate Wi-Fi
Corporate and university campus networks strictly restrict inbound traffic:
- Inbound ports cannot be opened.
- UPnP and NAT-PMP are disabled.
- Direct P2P protocols (STUN/TURN/UDP) are often throttled or blocked.
- Port forwarding is impossible.

However, almost all networks permit standard **outbound HTTPS (TCP port 443)** web browsing. PairPulse utilizes persistent WebSocket connections over standard TLS (port 443 in production). From the perspective of firewalls and middleboxes, the traffic appears as standard outbound HTTPS traffic. Because the TCP session is initiated by the laptop outbound to the cloud, the firewall state table permits the bidirectional streaming of frames without requiring inbound port mapping.

### 3. How Persistent WSS Reduces Latency
Traditional request-response architectures (like HTTP REST or Webhooks) suffer from crippling per-event overhead:
1. DNS resolution: ~10–50 ms
2. TCP 3-way handshake: ~20–80 ms
3. TLS 1.3 cryptographic handshake: ~30–100 ms
4. HTTP header serialization & parsing: ~5–10 ms
Total per-event penalty: **65–240 ms**.

PairPulse establishes the TLS connection **once** during startup and keeps it alive continuously using lightweight WebSocket ping/pong frames. When a hotkey is pressed:
- Zero DNS lookups are performed.
- Zero TCP handshakes occur.
- Zero TLS handshakes occur.
- The event is already framed and queued immediately.
Per-event network transit overhead is reduced to **pure raw network packet latency** (typically 5–30 ms over standard broadband).

### 4. Where Latency Exists (Latency Budget Breakdown)

| Stage | Name | Typical Duration | Optimization in PairPulse |
|---|---|---|---|
| **$T_0 \to T_1$** | Local Controller Dispatch | `< 0.1 ms` | `RegisterHotKey` in native Win32 loop pushes immediately to async socket thread with sub-microsecond QPC timestamps. No disk or UI blocking. |
| **$T_1 \to T_2$** | Controller $\to$ Relay Transit | `5 – 25 ms` | Outbound persistent TCP/TLS stream with `TCP_NODELAY` (Nagle disabled). |
| **$T_2 \to T_3$** | Relay Server In-Memory Hop | `0.1 – 0.5 ms` | Zero database reads/writes on event path; O(1) Map lookup in Node.js relay memory. |
| **$T_3 \to T_4$** | Relay $\to$ Receiver Transit | `5 – 25 ms` | Pre-established downstream WebSocket pipe. |
| **$T_4 \to T_5$** | Receiver Overlay Activation | `< 0.2 ms` | **Window is pre-created in memory during process startup.** Pre-allocated GDI brushes & fonts. Only invokes `ShowWindow(hwnd, SW_SHOW)`. Zero asset or window creation delay. |
| **$T_0 \to T_5$** | **Total End-to-End Latency** | **12 – 50 ms** | **Virtually imperceptible to human reaction time.** |

### 5. How to Measure Actual End-to-End Latency
PairPulse attaches high-resolution microsecond-level timing metadata to every event payload:
- **`T0`**: Timestamp when `WM_HOTKEY` is processed on Laptop A.
- **`T1`**: Timestamp when packet is written to the socket buffer on Laptop A.
- **`T2`**: Server timestamp upon receiving packet.
- **`T3`**: Server timestamp immediately before forwarding to Laptop B.
- **`T4`**: Timestamp when socket receives packet on Laptop B.
- **`T5`**: Timestamp immediately after `ShowWindow(hwnd, SW_SHOW)` returns on Laptop B.

The receiver console and overlay automatically calculate and display the live breakdown:
- **Local Dispatch Latency**: $T_1 - T_0$
- **Relay Processing Latency**: $T_3 - T_2$
- **Receiver Display Latency**: $T_5 - T_4$
- **End-to-End Latency**: $T_5 - T_0$ (exact when clocks are NTP-synchronized, with round-trip ping time compensation).

---

## Quickstart: Running Locally

### Step 1: Start the Relay Server
```powershell
cd pairpulse/server
npm install
npm run dev
```
The server will start listening on `ws://0.0.0.0:8080`.

### Step 2: Run End-to-End Latency Simulator (Instant Verification)
In a separate terminal:
```powershell
cd pairpulse/server
npm run simulate
```
This runs 5 automated signaling trials simulating Laptop A (Controller) and Laptop B (Receiver), proving the in-memory routing and measuring exact sub-millisecond latencies.

---

## Native Windows Client Build Instructions

### Prerequisites
- Windows 10/11
- CMake 3.20+
- MSVC (Visual Studio 2019/2022) or MinGW-w64 with C++17 support

### Build with CMake
```powershell
cd pairpulse/client
mkdir build
cd build
cmake ..
cmake --build . --config Release
```
This builds `pairpulse.exe` in `pairpulse/client/build/Release/` (or `build/`).

---

## Running Laptop A and Laptop B

### 1. Launch Laptop A (Controller)
```powershell
pairpulse.exe --role controller --server ws://localhost:8080
```
- Registers global hotkeys:
  - `CTRL + SHIFT + F12`: Toggle Remote Overlay
  - `CTRL + SHIFT + F11`: Force Remote Overlay OFF
- Connects to relay and displays an ephemeral 6-digit pairing code (e.g. `123456`).

### 2. Launch Laptop B (Receiver)
```powershell
pairpulse.exe --role receiver --server ws://localhost:8080 --pair 123456
```
- Pre-creates the borderless fullscreen overlay in memory (hidden).
- Submits the 6-digit pairing code.
- Both laptops receive persistent cryptographic credentials saved to `%APPDATA%\PairPulse\config.json`.
- Subsequent runs do not require re-pairing!

### 3. Triggering Signals
- On Laptop A: Press `CTRL + SHIFT + F12`.
- On Laptop B: The overlay immediately covers the screen.
- On Laptop A: Press `CTRL + SHIFT + F11` or `CTRL + SHIFT + F12` to dismiss.
- **Local Emergency Escape**: If physical access to Laptop B is needed, the user on Laptop B can press `ESC` or `CTRL + SHIFT + F10` at any time to instantly dismiss the overlay.

---

## Windows Autostart Configuration

To configure the client to start automatically when Windows logs in:
```powershell
# On Controller
pairpulse.exe --role controller --install-autostart

# On Receiver
pairpulse.exe --role receiver --install-autostart

# To remove autostart
pairpulse.exe --uninstall-autostart
```

---

## Production Cloud Deployment

### Docker Deployment
The relay is fully containerized. To deploy on any cloud provider (Render, Railway, Fly.io, DigitalOcean, AWS ECS):

```bash
cd pairpulse/server
docker build -t pairpulse-relay .
docker run -d -p 8080:8080 -e PORT=8080 -e NODE_ENV=production pairpulse-relay
```

### Production NGINX Reverse Proxy Configuration (WSS on Port 443)
```nginx
server {
    listen 443 ssl http2;
    server_name relay.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/relay.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/relay.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Low latency tuning: disable proxy buffering
        proxy_buffering off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

### Desktop Client in Production
Simply point clients to your secure domain:
```powershell
pairpulse.exe --role controller --server wss://relay.yourdomain.com
pairpulse.exe --role receiver --server wss://relay.yourdomain.com --pair <code>
```

---

## Security Architecture

1. **TLS / WSS Encryption**: All traffic is encrypted in transit.
2. **Permanent Authenticated Tokens**: Ephemeral 6-digit pairing codes expire after 5 minutes and are destroyed upon first use. Long-term connections use 192-bit cryptographic tokens.
3. **Pair-Isolated Channels**: Devices can only send signals to their strictly paired partner.
4. **Rate Limiting**: Controller signaling is rate-limited via a token-bucket algorithm (20 events/sec) to block spamming.
5. **Replay Protection**: Every event contains a strictly monotonic sequence number; stale or duplicated packets are discarded.
6. **No Remote Execution**: The protocol only supports defined state enums (`OVERLAY_ON`, `OVERLAY_OFF`, `OVERLAY_TOGGLE`). Arbitrary commands, shell execution, and file transfers are fundamentally impossible.
7. **Local Safety**: The overlay respects Windows OS security (`CTRL+ALT+DEL` works uninterrupted) and provides an uninhibited local escape key (`ESC`).
