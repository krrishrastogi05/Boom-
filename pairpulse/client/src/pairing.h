#pragma once

#include <string>
#include <functional>
#include "websocket_client.h"

namespace PairPulse {

class PairingManager {
public:
    PairingManager(WebSocketClient& wsClient);
    ~PairingManager();

    void Initialize();
    void StartPairingFlow(const std::string& inputCode = "");
    bool IsPaired() const;

    std::function<void(const std::string& code, int expiresInSec)> onPairCodeDisplay;
    std::function<void(bool success, const std::string& message)> onPairingCompleted;

private:
    WebSocketClient& m_wsClient;
    bool m_isAwaitingConfirmation = false;
};

} // namespace PairPulse
