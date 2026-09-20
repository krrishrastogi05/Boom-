#pragma once

#include <string>
#include <functional>
#include <memory>
#include <atomic>
#include <cstdint>

// Forward declaration of IXWebSocket internals to keep header minimal
namespace ix {
    class WebSocket;
}

namespace PairPulse {

struct SignalTimestamps {
    uint64_t seq = 0;
    uint64_t t0 = 0; // Hotkey detection
    uint64_t t1 = 0; // Client socket send
    uint64_t t2 = 0; // Relay received
    uint64_t t3 = 0; // Relay forwarded
    uint64_t t4 = 0; // Receiver received
    uint64_t t5 = 0; // Overlay displayed
};

class WebSocketClient {
public:
    WebSocketClient();
    ~WebSocketClient();

    void Connect(const std::string& url);
    void Disconnect();
    bool IsConnected() const { return m_isConnected; }

    // Fast Hot Path Sending
    void SendOverlaySignal(const std::string& type, uint64_t seq, uint64_t t0, uint64_t t1);
    void RequestPairCode();
    void ConfirmPairCode(const std::string& code, const std::string& role);
    void Authenticate(const std::string& token, const std::string& role, const std::string& pairId);
    void SendStateSyncRequest();
    void SendPing();

    // Callbacks
    std::function<void(bool isConnected)> onConnectionStateChanged;
    std::function<void(const std::string& code, int expiresInSec)> onPairCodeReceived;
    std::function<void(const std::string& pairId, const std::string& token, const std::string& role)> onPairOk;
    std::function<void(const std::string& reason)> onPairFail;
    std::function<void(const std::string& pairId, const std::string& role, const std::string& overlayState, bool pairedOnline)> onAuthOk;
    std::function<void(const std::string& reason)> onAuthFail;
    std::function<void(const std::string& type, const SignalTimestamps& ts)> onOverlaySignal;
    std::function<void(const std::string& state, uint64_t seq, bool pairedOnline)> onStateSync;

private:
    void HandleIncomingMessage(const std::string& text, uint64_t t4);
    std::unique_ptr<ix::WebSocket> m_ws;
    std::atomic<bool> m_isConnected{false};
};

} // namespace PairPulse
