#include "state.h"
#include <fstream>
#include <sstream>
#include <iostream>
#include <shlobj.h>

namespace PairPulse {

StateManager& StateManager::Instance() {
    static StateManager instance;
    return instance;
}

StateManager::StateManager() {
    QueryPerformanceFrequency(&m_qpcFrequency);
    m_configFilePath = GetDefaultConfigPath();
}

std::string StateManager::RoleToString(Role role) {
    switch (role) {
        case Role::Controller: return "controller";
        case Role::Receiver:   return "receiver";
        default:               return "unknown";
    }
}

Role StateManager::StringToRole(const std::string& str) {
    if (str == "controller") return Role::Controller;
    if (str == "receiver") return Role::Receiver;
    return Role::Unknown;
}

std::string StateManager::GetDefaultConfigPath() {
    char appDataPath[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathA(NULL, CSIDL_APPDATA, NULL, 0, appDataPath))) {
        std::string dir = std::string(appDataPath) + "\\PairPulse";
        CreateDirectoryA(dir.c_str(), NULL);
        return dir + "\\config.json";
    }
    return "pairpulse_config.json";
}

uint64_t StateManager::GetEpochMilliseconds() {
    FILETIME ft;
    GetSystemTimeAsFileTime(&ft);
    ULARGE_INTEGER uli;
    uli.LowPart = ft.dwLowDateTime;
    uli.HighPart = ft.dwHighDateTime;
    // Difference between 1601 and 1970 in 100-nanosecond intervals: 116444736000000000ULL
    uint64_t unixTime100Ns = uli.QuadPart - 116444736000000000ULL;
    return unixTime100Ns / 10000ULL;
}

uint64_t StateManager::GetMonotonicMicroseconds() {
    LARGE_INTEGER counter;
    QueryPerformanceCounter(&counter);
    LARGE_INTEGER freq = StateManager::Instance().m_qpcFrequency;
    if (freq.QuadPart == 0) return 0;
    return static_cast<uint64_t>((counter.QuadPart * 1000000LL) / freq.QuadPart);
}

// Lightweight JSON value extractor to avoid external JSON parser library dependencies
static std::string ExtractJsonString(const std::string& json, const std::string& key) {
    std::string needle = "\"" + key + "\":";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return "";
    size_t start = json.find('"', pos + needle.length());
    if (start == std::string::npos) return "";
    size_t end = json.find('"', start + 1);
    if (end == std::string::npos) return "";
    return json.substr(start + 1, end - start - 1);
}

bool StateManager::LoadConfig(const std::string& customPath) {
    std::string path = customPath.empty() ? m_configFilePath : customPath;
    std::ifstream file(path);
    if (!file.is_open()) return false;

    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string content = buffer.str();

    std::string url = ExtractJsonString(content, "serverUrl");
    if (!url.empty()) m_config.serverUrl = url;

    std::string roleStr = ExtractJsonString(content, "role");
    if (!roleStr.empty()) m_config.role = StringToRole(roleStr);

    std::string pairId = ExtractJsonString(content, "pairId");
    if (!pairId.empty()) m_config.pairId = pairId;

    std::string token = ExtractJsonString(content, "token");
    if (!token.empty()) m_config.token = token;

    return true;
}

bool StateManager::SaveConfig(const std::string& customPath) {
    std::string path = customPath.empty() ? m_configFilePath : customPath;
    std::ofstream file(path);
    if (!file.is_open()) return false;

    file << "{\n";
    file << "  \"serverUrl\": \"" << m_config.serverUrl << "\",\n";
    file << "  \"role\": \"" << RoleToString(m_config.role) << "\",\n";
    file << "  \"pairId\": \"" << m_config.pairId << "\",\n";
    file << "  \"token\": \"" << m_config.token << "\",\n";
    file << "  \"debugLogging\": " << (m_config.debugLogging ? "true" : "false") << "\n";
    file << "}\n";

    return true;
}

bool StateManager::ResetConfig(const std::string& customPath) {
    std::string path = customPath.empty() ? m_configFilePath : customPath;
    DeleteFileA(path.c_str());
    m_config.pairId.clear();
    m_config.token.clear();
    return true;
}

} // namespace PairPulse
