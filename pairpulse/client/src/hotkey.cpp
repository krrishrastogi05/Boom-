#include "hotkey.h"
#include "state.h"
#include <iostream>

#ifndef MOD_NOREPEAT
#define MOD_NOREPEAT 0x4000
#endif

namespace PairPulse {

HotkeyManager::HotkeyManager() {}

HotkeyManager::~HotkeyManager() {}

bool HotkeyManager::RegisterHotkeys(HWND hwnd) {
    auto& cfg = StateManager::Instance().GetConfig();

    // Toggle Hotkey (Default: Ctrl + Shift + F12)
    BOOL okToggle = RegisterHotKey(hwnd, HOTKEY_ID_TOGGLE, cfg.toggleHotkeyMod | MOD_NOREPEAT, cfg.toggleHotkeyKey);
    if (!okToggle) {
        okToggle = RegisterHotKey(hwnd, HOTKEY_ID_TOGGLE, cfg.toggleHotkeyMod, cfg.toggleHotkeyKey);
    }

    // Force OFF Hotkey (Default: Ctrl + Shift + F11)
    BOOL okOff = RegisterHotKey(hwnd, HOTKEY_ID_FORCE_OFF, cfg.offHotkeyMod | MOD_NOREPEAT, cfg.offHotkeyKey);
    if (!okOff) {
        okOff = RegisterHotKey(hwnd, HOTKEY_ID_FORCE_OFF, cfg.offHotkeyMod, cfg.offHotkeyKey);
    }

    // Emergency Local Escape Hotkey (Ctrl + Shift + F10)
    BOOL okEsc = RegisterHotKey(hwnd, HOTKEY_ID_ESCAPE, MOD_CONTROL | MOD_SHIFT | MOD_NOREPEAT, VK_F10);
    if (!okEsc) {
        okEsc = RegisterHotKey(hwnd, HOTKEY_ID_ESCAPE, MOD_CONTROL | MOD_SHIFT, VK_F10);
    }

    m_registered = okToggle && okOff;

    std::cout << "[Hotkeys] Registered Global Hotkeys:" << std::endl;
    std::cout << "  - CTRL + SHIFT + F12 : Toggle Overlay" << std::endl;
    std::cout << "  - CTRL + SHIFT + F11 : Force OFF Overlay" << std::endl;
    std::cout << "  - CTRL + SHIFT + F10 : Emergency Local Escape" << std::endl;

    return m_registered;
}

void HotkeyManager::UnregisterHotkeys(HWND hwnd) {
    if (m_registered) {
        UnregisterHotKey(hwnd, HOTKEY_ID_TOGGLE);
        UnregisterHotKey(hwnd, HOTKEY_ID_FORCE_OFF);
        UnregisterHotKey(hwnd, HOTKEY_ID_ESCAPE);
        m_registered = false;
    }
}

bool HotkeyManager::HandleHotkeyMessage(WPARAM wParam, LPARAM /*lParam*/) {
    // T0: Monotonic epoch millisecond timestamp taken at the earliest possible instant
    uint64_t t0 = StateManager::GetEpochMilliseconds();

    int hotkeyId = static_cast<int>(wParam);
    if (hotkeyId == HOTKEY_ID_TOGGLE) {
        if (onHotkeyTriggered) onHotkeyTriggered(HotkeyAction::Toggle, t0);
        return true;
    } else if (hotkeyId == HOTKEY_ID_FORCE_OFF) {
        if (onHotkeyTriggered) onHotkeyTriggered(HotkeyAction::ForceOff, t0);
        return true;
    } else if (hotkeyId == HOTKEY_ID_ESCAPE) {
        if (onHotkeyTriggered) onHotkeyTriggered(HotkeyAction::EmergencyEscape, t0);
        return true;
    }

    return false;
}

} // namespace PairPulse
