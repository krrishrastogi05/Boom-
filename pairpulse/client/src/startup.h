#pragma once

#include <string>
#include "state.h"

namespace PairPulse {

class StartupManager {
public:
    static bool InstallAutostart(Role role);
    static bool UninstallAutostart();
    static bool IsAutostartEnabled();
    static std::string GetExecutablePath();

private:
    static const wchar_t* RUN_KEY_PATH;
    static const wchar_t* APP_VALUE_NAME;
};

} // namespace PairPulse
