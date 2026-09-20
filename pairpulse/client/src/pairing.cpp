#include "pairing.h"
#include "state.h"
#include <iostream>

namespace PairPulse {

PairingManager::PairingManager(WebSocketClient& wsClient)
    : m_wsClient(wsClient) {}

PairingManager::~PairingManager() {}

void PairingManager::Initialize() {
    m_wsClient.onPairCodeReceived = [this](const std::string& code, int expiresInSec) {
        std::cout << "\n========================================================" << std::endl;
        std::cout << "  PairPulse PAIRING CODE: [ " << code << " ]" << std::endl;
        std::cout << "  Enter this code on Laptop B to complete pairing." << std::endl;
        std::cout << "  Expires in: " << expiresInSec << " seconds" << std::endl;
        std::cout << "========================================================\n" << std::endl;
        if (onPairCodeDisplay) onPairCodeDisplay(code, expiresInSec);
    };

    m_wsClient.onPairOk = [this](const std::string& pairId, const std::string& token, const std::string& role) {
        auto& cfg = StateManager::Instance().GetConfig();
        cfg.pairId = pairId;
        cfg.token = token;
        cfg.role = StateManager::StringToRole(role);
        StateManager::Instance().SaveConfig();

        std::cout << "\n[Pairing] Successfully paired and authenticated!" << std::endl;
        std::cout << "  Pair ID: " << pairId << std::endl;
        std::cout << "  Role:    " << role << std::endl;
        std::cout << "  Credentials saved securely to local config.\n" << std::endl;

        if (onPairingCompleted) onPairingCompleted(true, "Pairing successful");
    };

    m_wsClient.onPairFail = [this](const std::string& reason) {
        std::cerr << "[Pairing] Failed: " << reason << std::endl;
        if (onPairingCompleted) onPairingCompleted(false, reason);
    };

    m_wsClient.onAuthOk = [](const std::string& pairId, const std::string& role, const std::string& overlayState, bool pairedOnline) {
        std::cout << "[Auth] Authenticated as " << role << " for pair " << pairId << std::endl;
        std::cout << "  Current Remote State: " << overlayState
                  << " | Partner Online: " << (pairedOnline ? "YES" : "NO") << std::endl;
    };

    m_wsClient.onAuthFail = [](const std::string& reason) {
        std::cerr << "[Auth] Authentication failed: " << reason << std::endl;
        std::cout << "[Auth] Resetting stale credentials. Please pair again." << std::endl;
        StateManager::Instance().ResetConfig();
    };

    m_wsClient.AddConnectionListener([this](bool isConnected) {
        if (isConnected) {
            std::cout << "[Connection] Connected to relay server successfully." << std::endl;
            auto& cfg = StateManager::Instance().GetConfig();
            if (IsPaired()) {
                std::cout << "[Auth] Authenticating with stored credentials..." << std::endl;
                m_wsClient.Authenticate(cfg.token, StateManager::RoleToString(cfg.role), cfg.pairId);
            }
        } else {
            std::cout << "[Connection] Disconnected from relay server. Reconnecting automatically..." << std::endl;
        }
    });
}

bool PairingManager::IsPaired() const {
    const auto& cfg = StateManager::Instance().GetConfig();
    return !cfg.pairId.empty() && !cfg.token.empty() && cfg.role != Role::Unknown;
}

void PairingManager::StartPairingFlow(const std::string& inputCode) {
    auto& cfg = StateManager::Instance().GetConfig();

    if (cfg.role == Role::Controller) {
        std::cout << "[Pairing] Requesting new pairing code from relay server..." << std::endl;
        m_wsClient.RequestPairCode();
    } else if (cfg.role == Role::Receiver) {
        if (!inputCode.empty()) {
            std::cout << "[Pairing] Submitting pairing code: " << inputCode << std::endl;
            m_wsClient.ConfirmPairCode(inputCode, "receiver");
        } else {
            std::cout << "[Pairing] Please supply pairing code via --pair <code> command line argument." << std::endl;
        }
    }
}

} // namespace PairPulse
