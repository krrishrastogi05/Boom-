#pragma once

#include <string>
#include <cstdint>
#include <windows.h>

namespace PairPulse {

enum class Role {
    Unknown,
    Controller,
    Receiver
};

struct Config {
    std::string serverUrl = "wss://boom-ba63.onrender.com";
    Role role = Role::Unknown;
    std::string pairId;
    std::string token;
    uint32_t toggleHotkeyMod = MOD_CONTROL | MOD_SHIFT;
    uint32_t toggleHotkeyKey = VK_F12;
    uint32_t offHotkeyMod = MOD_CONTROL | MOD_SHIFT;
    uint32_t offHotkeyKey = VK_F11;
    bool debugLogging = true;
};

class StateManager {
public:
    static StateManager& Instance();

    bool LoadConfig(const std::string& customPath = "");
    bool SaveConfig(const std::string& customPath = "");
    bool ResetConfig(const std::string& customPath = "");

    Config& GetConfig() { return m_config; }
    const Config& GetConfig() const { return m_config; }

    static std::string GetDefaultConfigPath();
    static uint64_t GetEpochMilliseconds();
    static uint64_t GetMonotonicMicroseconds();

    static std::string RoleToString(Role role);
    static Role StringToRole(const std::string& str);

private:
    StateManager();
    Config m_config;
    std::string m_configFilePath;
    LARGE_INTEGER m_qpcFrequency;
};

} // namespace PairPulse
