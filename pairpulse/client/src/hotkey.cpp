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

    // Open Hotkey (Alt + Shift + O)
    BOOL okOpen = RegisterHotKey(hwnd, HOTKEY_ID_OPEN, cfg.openHotkeyMod | MOD_NOREPEAT, cfg.openHotkeyKey);
    if (!okOpen) {
        okOpen = RegisterHotKey(hwnd, HOTKEY_ID_OPEN, cfg.openHotkeyMod, cfg.openHotkeyKey);
    }

    // Close Hotkey (Alt + Shift + C)
    BOOL okClose = RegisterHotKey(hwnd, HOTKEY_ID_CLOSE, cfg.closeHotkeyMod | MOD_NOREPEAT, cfg.closeHotkeyKey);
    if (!okClose) {
        okClose = RegisterHotKey(hwnd, HOTKEY_ID_CLOSE, cfg.closeHotkeyMod, cfg.closeHotkeyKey);
    }

    // Emergency Local Escape Hotkey (Ctrl + Shift + F10)
    BOOL okEsc = RegisterHotKey(hwnd, HOTKEY_ID_ESCAPE, MOD_CONTROL | MOD_SHIFT | MOD_NOREPEAT, VK_F10);
    if (!okEsc) {
        okEsc = RegisterHotKey(hwnd, HOTKEY_ID_ESCAPE, MOD_CONTROL | MOD_SHIFT, VK_F10);
    }

    m_registered = okOpen && okClose;

    std::cout << "[Hotkeys] Registered Global Hotkeys:" << std::endl;
    std::cout << "  - ALT + SHIFT + O : Open Remote Overlay" << std::endl;
    std::cout << "  - ALT + SHIFT + C : Close Remote Overlay" << std::endl;
    std::cout << "  - CTRL + SHIFT + F10 / ESC : Emergency Local Escape" << std::endl;

    return m_registered;
}

void HotkeyManager::UnregisterHotkeys(HWND hwnd) {
    if (m_registered) {
        UnregisterHotKey(hwnd, HOTKEY_ID_OPEN);
        UnregisterHotKey(hwnd, HOTKEY_ID_CLOSE);
        UnregisterHotKey(hwnd, HOTKEY_ID_ESCAPE);
        m_registered = false;
    }
}

bool HotkeyManager::HandleHotkeyMessage(WPARAM wParam, LPARAM /*lParam*/) {
    // T0: Monotonic epoch millisecond timestamp taken at the earliest possible instant
    uint64_t t0 = StateManager::GetEpochMilliseconds();

    int hotkeyId = static_cast<int>(wParam);
    if (hotkeyId == HOTKEY_ID_OPEN) {
        if (onHotkeyTriggered) onHotkeyTriggered(HotkeyAction::Open, t0);
        return true;
    } else if (hotkeyId == HOTKEY_ID_CLOSE) {
        if (onHotkeyTriggered) onHotkeyTriggered(HotkeyAction::Close, t0);
        return true;
    } else if (hotkeyId == HOTKEY_ID_ESCAPE) {
        if (onHotkeyTriggered) onHotkeyTriggered(HotkeyAction::EmergencyEscape, t0);
        return true;
    }

    return false;
}

} // namespace PairPulse
