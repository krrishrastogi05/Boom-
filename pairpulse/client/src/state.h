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
    uint32_t openHotkeyMod = MOD_ALT | MOD_SHIFT;
    uint32_t openHotkeyKey = 'O';
    uint32_t closeHotkeyMod = MOD_ALT | MOD_SHIFT;
    uint32_t closeHotkeyKey = 'C';
    bool debugLogging = true;
};

class StateManager {
public:
    static StateManager& Instance();

    bool LoadConfig(const std::string& customPath = "", Role role = Role::Unknown);
    bool SaveConfig(const std::string& customPath = "");
    bool ResetConfig(const std::string& customPath = "");

    Config& GetConfig() { return m_config; }
    const Config& GetConfig() const { return m_config; }

    static std::string GetDefaultConfigPath(Role role = Role::Unknown);
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
