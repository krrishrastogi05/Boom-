import * as http from 'http';
import { WebSocketServer } from 'ws';
import * as dotenv from 'dotenv';
import { RelayServer } from './relay';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PairPulse Cloud Relay - Operational</title>
  <style>
    :root {
      --bg: #090d16;
      --card: #111827;
      --border: #1e293b;
      --cyan: #38bdf8;
      --green: #22c55e;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 32px; max-width: 600px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
    .title { font-size: 24px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 10px; }
    .badge { background: rgba(34, 197, 94, 0.15); color: var(--green); border: 1px solid rgba(34, 197, 94, 0.3); padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .meta-item { background: rgba(15, 23, 42, 0.6); padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border); }
    .meta-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-value { font-size: 16px; font-weight: 600; color: var(--cyan); margin-top: 4px; word-break: break-all; }
    .btn { background: var(--cyan); color: #000; border: none; padding: 12px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; width: 100%; transition: all 0.2s; font-size: 14px; }
    .btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
    .btn-open { background: #22c55e; color: #000; }
    .btn-close { background: #ef4444; color: #fff; }
    .log-box { background: #000; border: 1px solid var(--border); border-radius: 8px; padding: 14px; font-family: monospace; font-size: 13px; color: #a3e635; margin-top: 16px; min-height: 80px; max-height: 150px; overflow-y: auto; line-height: 1.5; }
    .notice { font-size: 13px; color: var(--muted); line-height: 1.6; margin-top: 20px; padding: 12px; background: rgba(56, 189, 248, 0.05); border-left: 3px solid var(--cyan); border-radius: 4px; }
    .shortcut-badge { background: rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title">⚡ PairPulse Relay</div>
      <div class="badge"><span class="dot"></span> Online</div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">WebSocket Protocol</div>
        <div class="meta-value">WSS (Port 443)</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Routing Engine</div>
        <div class="meta-value">In-Memory (0.0ms)</div>
      </div>
      <div class="meta-item" style="grid-column: span 2;">
        <div class="meta-label">Relay Target URL</div>
        <div class="meta-value" id="urlDisplay">Connecting...</div>
      </div>
    </div>

    <button class="btn" onclick="testLiveWebSocket()">▶ Test Live Browser WebSocket Handshake</button>

    <div class="btn-row">
      <button class="btn btn-open" id="btnOpen" onclick="sendSignalAction('OVERLAY_ON')">
        🟢 Open <span class="shortcut-badge">Alt+Shift+O</span>
      </button>
      <button class="btn btn-close" id="btnClose" onclick="sendSignalAction('OVERLAY_OFF')">
        🔴 Close <span class="shortcut-badge">Alt+Shift+C</span>
      </button>
    </div>

    <div class="log-box" id="log">Ready. Use the buttons above or global hotkeys [Alt+Shift+O] and [Alt+Shift+C].</div>

    <div class="notice">
      <strong>Hotkeys Configured:</strong><br>
      • <strong>ALT + SHIFT + O</strong>: Open Remote Overlay<br>
      • <strong>ALT + SHIFT + C</strong>: Close Remote Overlay<br>
      • <strong>ESC / CTRL + SHIFT + F10</strong>: Emergency Local Escape
    </div>
  </div>

  <script>
    const wssUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
    document.getElementById('urlDisplay').textContent = wssUrl;

    let liveWs = null;

    function getOrCreateWs(onReady) {
      if (liveWs && liveWs.readyState === WebSocket.OPEN) {
        onReady(liveWs);
        return;
      }
      const log = document.getElementById('log');
      log.textContent += 'Connecting persistent WebSocket...\\n';
      liveWs = new WebSocket(wssUrl);
      liveWs.onopen = () => {
        log.textContent += '✓ WebSocket connection established.\\n';
        onReady(liveWs);
      };
      liveWs.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        log.textContent += '← [' + msg.type + '] ' + JSON.stringify(msg) + '\\n';
        log.scrollTop = log.scrollHeight;
      };
      liveWs.onerror = (err) => {
        log.textContent += '✗ WebSocket Error: ' + err.message + '\\n';
      };
    }

    function sendSignalAction(type) {
      const log = document.getElementById('log');
      const t0 = Date.now();
      getOrCreateWs((ws) => {
        const payload = {
          type: type,
          seq: Math.floor(Math.random() * 100000),
          t0: t0,
          t1: Date.now()
        };
        ws.send(JSON.stringify(payload));
        log.textContent += '→ Triggered ' + type + ' (' + (type === 'OVERLAY_ON' ? 'Alt+Shift+O' : 'Alt+Shift+C') + ')\\n';
        log.scrollTop = log.scrollHeight;
      });
    }

    function testLiveWebSocket() {
      const log = document.getElementById('log');
      log.textContent = 'Initiating WSS connection to: ' + wssUrl + '...\\n';
      const t0 = performance.now();
      
      const ws = new WebSocket(wssUrl);
      ws.onopen = () => {
        const time = (performance.now() - t0).toFixed(1);
        log.textContent += '✓ [CONNECTED] Persistent WSS open in ' + time + ' ms\\n';
        log.textContent += '→ Sending test PAIR_REQUEST...\\n';
        ws.send(JSON.stringify({ type: 'PAIR_REQUEST' }));
      };
      
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        log.textContent += '✓ [REPLY] Received ' + msg.type + ' with code: ' + (msg.code || 'N/A') + '\\n';
        log.textContent += '★ Live Relay handshake 100% verified!\\n';
        ws.close();
      };

      ws.onerror = (err) => {
        log.textContent += '✗ [ERROR] Could not connect: ' + err.message + '\\n';
      };
    }

    // Keyboard shortcut listeners on dashboard
    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'O' || e.key === 'o')) {
        e.preventDefault();
        sendSignalAction('OVERLAY_ON');
      } else if (e.altKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        sendSignalAction('OVERLAY_OFF');
      }
    });
  </script>
</body>
</html>`;

// HTTP server for health checks, web dashboard, and WebSocket upgrade
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'PairPulse Relay Server',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
      })
    );
    return;
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '')) {
    const accept = req.headers['accept'] || '';
    if (accept.includes('text/html') || !accept.includes('application/json')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(DASHBOARD_HTML);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'PairPulse Relay Server',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// WebSocket Server attached to HTTP server
const wss = new WebSocketServer({ server });
const relay = new RelayServer();

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[Relay] Inbound WebSocket connection from ${clientIp}`);
  relay.handleConnection(ws);
});

server.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(` PairPulse Cloud Relay is running!`);
  console.log(` Listening on: ws://${HOST}:${PORT}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});

const handleShutdown = () => {
  console.log('\n[Relay] Shutting down gracefully...');
  relay.stop();
  wss.close(() => {
    server.close(() => {
      console.log('[Relay] Server stopped.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
