#pragma once

#include <windows.h>
#include <functional>
#include <cstdint>

namespace PairPulse {

enum class HotkeyAction {
    Open,
    Close,
    Toggle,
    EmergencyEscape
};

class HotkeyManager {
public:
    HotkeyManager();
    ~HotkeyManager();

    bool RegisterHotkeys(HWND hwnd);
    void UnregisterHotkeys(HWND hwnd);

    // Call this inside WM_HOTKEY handler
    bool HandleHotkeyMessage(WPARAM wParam, LPARAM lParam);

    std::function<void(HotkeyAction action, uint64_t t0)> onHotkeyTriggered;

    static const int HOTKEY_ID_OPEN = 1001;
    static const int HOTKEY_ID_CLOSE = 1002;
    static const int HOTKEY_ID_ESCAPE = 1003;

private:
    bool m_registered = false;
};

} // namespace PairPulse
