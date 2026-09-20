#include "startup.h"
#include <windows.h>
#include <iostream>

namespace PairPulse {

const wchar_t* StartupManager::RUN_KEY_PATH = L"Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const wchar_t* StartupManager::APP_VALUE_NAME = L"PairPulse";

std::string StartupManager::GetExecutablePath() {
    char buffer[MAX_PATH];
    GetModuleFileNameA(NULL, buffer, MAX_PATH);
    return std::string(buffer);
}

bool StartupManager::InstallAutostart(Role role) {
    HKEY hKey;
    LONG result = RegOpenKeyExW(HKEY_CURRENT_USER, RUN_KEY_PATH, 0, KEY_SET_VALUE, &hKey);
    if (result != ERROR_SUCCESS) {
        std::cerr << "[Startup] Failed to open Run registry key. Error: " << result << std::endl;
        return false;
    }

    std::string exePath = GetExecutablePath();
    std::string roleArg = (role == Role::Controller) ? "--role controller" : "--role receiver";
    std::string command = "\"" + exePath + "\" " + roleArg;

    std::wstring wcommand(command.begin(), command.end());

    result = RegSetValueExW(
        hKey,
        APP_VALUE_NAME,
        0,
        REG_SZ,
        reinterpret_cast<const BYTE*>(wcommand.c_str()),
        static_cast<DWORD>((wcommand.length() + 1) * sizeof(wchar_t))
    );

    RegCloseKey(hKey);

    if (result == ERROR_SUCCESS) {
        std::cout << "[Startup] Successfully configured Windows autostart: " << command << std::endl;
        return true;
    } else {
        std::cerr << "[Startup] Failed to set registry value. Error: " << result << std::endl;
        return false;
    }
}

bool StartupManager::UninstallAutostart() {
    HKEY hKey;
    LONG result = RegOpenKeyExW(HKEY_CURRENT_USER, RUN_KEY_PATH, 0, KEY_SET_VALUE, &hKey);
    if (result != ERROR_SUCCESS) {
        return false;
    }

    result = RegDeleteValueW(hKey, APP_VALUE_NAME);
    RegCloseKey(hKey);

    if (result == ERROR_SUCCESS || result == ERROR_FILE_NOT_FOUND) {
        std::cout << "[Startup] Successfully removed Windows autostart." << std::endl;
        return true;
    } else {
        std::cerr << "[Startup] Failed to remove registry value. Error: " << result << std::endl;
        return false;
    }
}

bool StartupManager::IsAutostartEnabled() {
    HKEY hKey;
    LONG result = RegOpenKeyExW(HKEY_CURRENT_USER, RUN_KEY_PATH, 0, KEY_QUERY_VALUE, &hKey);
    if (result != ERROR_SUCCESS) {
        return false;
    }

    result = RegQueryValueExW(hKey, APP_VALUE_NAME, NULL, NULL, NULL, NULL);
    RegCloseKey(hKey);
    return (result == ERROR_SUCCESS);
}

} // namespace PairPulse
