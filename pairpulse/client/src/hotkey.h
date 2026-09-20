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

    bool InstallKeyboardHook(bool isReceiver = false);
    void UninstallKeyboardHook();

    // Call this inside WM_HOTKEY handler
    bool HandleHotkeyMessage(WPARAM wParam, LPARAM lParam);

    std::function<void(HotkeyAction action, uint64_t t0)> onHotkeyTriggered;
    std::function<void()> onLocalDismiss;

    static const int HOTKEY_ID_OPEN = 1001;
    static const int HOTKEY_ID_CLOSE = 1002;
    static const int HOTKEY_ID_ESCAPE = 1003;
    static const int HOTKEY_ID_CLOSE_FALLBACK = 1004;

    static HotkeyManager* s_instance;

private:
    bool m_registered = false;
    HHOOK m_hook = NULL;
    bool m_isReceiver = false;
    uint64_t m_lastTriggerTime = 0;

    static LRESULT CALLBACK LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam);
};

} // namespace PairPulse
