#include "websocket_client.h"
#include "state.h"
#include <ixwebsocket/IXWebSocket.h>
#include <iostream>
#include <sstream>

namespace PairPulse {

// Helper parser for simple key-value JSON responses
static std::string ParseStringKey(const std::string& json, const std::string& key) {
    std::string needle = "\"" + key + "\":";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return "";
    size_t start = json.find('"', pos + needle.length());
    if (start == std::string::npos) return "";
    size_t end = json.find('"', start + 1);
    if (end == std::string::npos) return "";
    return json.substr(start + 1, end - start - 1);
}

static uint64_t ParseUInt64Key(const std::string& json, const std::string& key) {
    std::string needle = "\"" + key + "\":";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return 0;
    size_t start = pos + needle.length();
    while (start < json.size() && (json[start] == ' ' || json[start] == '\t' || json[start] == '\r' || json[start] == '\n')) {
        start++;
    }
    size_t end = start;
    while (end < json.size() && (isdigit(static_cast<unsigned char>(json[end])))) {
        end++;
    }
    if (end > start) {
        try {
            return std::stoull(json.substr(start, end - start));
        } catch (...) {
            return 0;
        }
    }
    return 0;
}

static bool ParseBoolKey(const std::string& json, const std::string& key) {
    std::string needle = "\"" + key + "\":";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return false;
    return json.find("true", pos) < json.find("false", pos);
}

WebSocketClient::WebSocketClient() {
    m_ws = std::make_unique<ix::WebSocket>();
}

WebSocketClient::~WebSocketClient() {
    Disconnect();
}

void WebSocketClient::Connect(const std::string& url) {
    m_ws->setUrl(url);

    // Exponential backoff reconnect settings
    m_ws->enableAutomaticReconnection();
    m_ws->setMinWaitBetweenReconnectionRetries(500);
    m_ws->setMaxWaitBetweenReconnectionRetries(15000);
    m_ws->setPingInterval(25);

    m_ws->setOnMessageCallback([this](const ix::WebSocketMessagePtr& msg) {
        if (msg->type == ix::WebSocketMessageType::Open) {
            m_isConnected = true;
            if (onConnectionStateChanged) onConnectionStateChanged(true);
        } else if (msg->type == ix::WebSocketMessageType::Close) {
            m_isConnected = false;
            if (onConnectionStateChanged) onConnectionStateChanged(false);
        } else if (msg->type == ix::WebSocketMessageType::Error) {
            std::cerr << "[WebSocket] Error: " << msg->errorInfo.reason << std::endl;
        } else if (msg->type == ix::WebSocketMessageType::Message) {
            uint64_t t4 = StateManager::GetEpochMilliseconds();
            HandleIncomingMessage(msg->str, t4);
        }
    });

    m_ws->start();
}

void WebSocketClient::Disconnect() {
    if (m_ws) {
        m_ws->stop();
    }
    m_isConnected = false;
}

void WebSocketClient::SendOverlaySignal(const std::string& type, uint64_t seq, uint64_t t0, uint64_t t1) {
    if (!m_isConnected) return;
    std::string payload = "{\"type\":\"" + type + "\",\"seq\":" + std::to_string(seq) +
                          ",\"t0\":" + std::to_string(t0) +
                          ",\"t1\":" + std::to_string(t1) +
                          ",\"timestamp\":" + std::to_string(t0) + "}";
    m_ws->sendText(payload);
}

void WebSocketClient::RequestPairCode() {
    if (!m_isConnected) return;
    m_ws->sendText("{\"type\":\"PAIR_REQUEST\"}");
}

void WebSocketClient::ConfirmPairCode(const std::string& code, const std::string& role) {
    if (!m_isConnected) return;
    std::string payload = "{\"type\":\"PAIR_CONFIRM\",\"code\":\"" + code + "\",\"role\":\"" + role + "\"}";
    m_ws->sendText(payload);
}

void WebSocketClient::Authenticate(const std::string& token, const std::string& role, const std::string& pairId) {
    if (!m_isConnected) return;
    std::string payload = "{\"type\":\"AUTH\",\"token\":\"" + token + "\",\"role\":\"" + role + "\",\"pairId\":\"" + pairId + "\"}";
    m_ws->sendText(payload);
}

void WebSocketClient::SendStateSyncRequest() {
    if (!m_isConnected) return;
    m_ws->sendText("{\"type\":\"STATE_SYNC\"}");
}

void WebSocketClient::SendPing() {
    if (!m_isConnected) return;
    uint64_t now = StateManager::GetEpochMilliseconds();
    m_ws->sendText("{\"type\":\"PING\",\"clientTimestamp\":" + std::to_string(now) + "}");
}

void WebSocketClient::HandleIncomingMessage(const std::string& text, uint64_t t4) {
    std::string msgType = ParseStringKey(text, "type");
    if (msgType.empty()) return;

    if (msgType == "PAIR_CODE") {
        std::string code = ParseStringKey(text, "code");
        uint64_t exp = ParseUInt64Key(text, "expiresInSeconds");
        if (onPairCodeReceived) onPairCodeReceived(code, static_cast<int>(exp));
    } else if (msgType == "PAIR_OK") {
        std::string pairId = ParseStringKey(text, "pairId");
        std::string token = ParseStringKey(text, "token");
        std::string role = ParseStringKey(text, "role");
        if (onPairOk) onPairOk(pairId, token, role);
    } else if (msgType == "PAIR_FAIL") {
        std::string reason = ParseStringKey(text, "reason");
        if (onPairFail) onPairFail(reason);
    } else if (msgType == "AUTH_OK") {
        std::string pairId = ParseStringKey(text, "pairId");
        std::string role = ParseStringKey(text, "role");
        std::string state = ParseStringKey(text, "currentOverlayState");
        bool pairedOnline = ParseBoolKey(text, "pairedOnline");
        if (onAuthOk) onAuthOk(pairId, role, state, pairedOnline);
    } else if (msgType == "AUTH_FAIL") {
        std::string reason = ParseStringKey(text, "reason");
        if (onAuthFail) onAuthFail(reason);
    } else if (msgType == "OVERLAY_ON" || msgType == "OVERLAY_OFF" || msgType == "OVERLAY_TOGGLE") {
        SignalTimestamps ts;
        ts.seq = ParseUInt64Key(text, "seq");
        ts.t0 = ParseUInt64Key(text, "t0");
        ts.t1 = ParseUInt64Key(text, "t1");
        ts.t2 = ParseUInt64Key(text, "t2");
        ts.t3 = ParseUInt64Key(text, "t3");
        ts.t4 = t4;
        if (onOverlaySignal) onOverlaySignal(msgType, ts);
    } else if (msgType == "STATE_SYNC") {
        std::string state = ParseStringKey(text, "state");
        uint64_t seq = ParseUInt64Key(text, "seq");
        bool pairedOnline = ParseBoolKey(text, "pairedOnline");
        if (onStateSync) onStateSync(state, seq, pairedOnline);
    }
}

} // namespace PairPulse
