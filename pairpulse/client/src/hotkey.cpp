#include "hotkey.h"
#include "state.h"
#include "overlay.h"
#include <iostream>

#ifndef MOD_NOREPEAT
#define MOD_NOREPEAT 0x4000
#endif

namespace PairPulse {

HotkeyManager* HotkeyManager::s_instance = nullptr;

HotkeyManager::HotkeyManager() {
    s_instance = this;
}

HotkeyManager::~HotkeyManager() {
    UninstallKeyboardHook();
    if (s_instance == this) s_instance = nullptr;
}

bool HotkeyManager::InstallKeyboardHook(bool isReceiver) {
    m_isReceiver = isReceiver;
    if (m_hook) return true;

    m_hook = SetWindowsHookExW(
        WH_KEYBOARD_LL,
        HotkeyManager::LowLevelKeyboardProc,
        GetModuleHandle(NULL),
        0
    );

    if (m_hook) {
        std::cout << "[Keyboard Hook] Low-level system keyboard hook installed ("
                  << (isReceiver ? "Receiver Dismiss Hook" : "Controller Hotkey Hook")
                  << ")." << std::endl;
        return true;
    } else {
        std::cerr << "[Keyboard Hook] Failed to install low-level hook. Error: " << GetLastError() << std::endl;
        return false;
    }
}

void HotkeyManager::UninstallKeyboardHook() {
    if (m_hook) {
        UnhookWindowsHookEx(m_hook);
        m_hook = NULL;
        std::cout << "[Keyboard Hook] Low-level system keyboard hook uninstalled." << std::endl;
    }
}

LRESULT CALLBACK HotkeyManager::LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode == HC_ACTION && s_instance) {
        KBDLLHOOKSTRUCT* kbd = reinterpret_cast<KBDLLHOOKSTRUCT*>(lParam);
        DWORD vk = kbd->vkCode;

        if (wParam == WM_KEYUP || wParam == WM_SYSKEYUP) {
            if (vk == 'O' || vk == 'o') s_instance->m_oDown = false;
            else if (vk == 'C' || vk == 'c') s_instance->m_cDown = false;
            else if (vk == 'X' || vk == 'x') s_instance->m_xDown = false;
            else if (vk == VK_MENU || vk == VK_LMENU || vk == VK_RMENU ||
                     vk == VK_SHIFT || vk == VK_LSHIFT || vk == VK_RSHIFT) {
                s_instance->m_oDown = false;
                s_instance->m_cDown = false;
                s_instance->m_xDown = false;
            }
        } else if (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) {
            uint64_t now = StateManager::GetEpochMilliseconds();

            bool isAlt = (kbd->flags & LLKHF_ALTDOWN) || ((GetAsyncKeyState(VK_MENU) & 0x8000) != 0);
            bool isShift = (GetAsyncKeyState(VK_SHIFT) & 0x8000) != 0;
            bool isCtrl = (GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0;

            if (s_instance->m_isReceiver) {
                bool overlayVisible = OverlayWindow::Instance().IsVisible();
                if (overlayVisible) {
                    // Receiver local emergency dismiss when overlay is active:
                    // ESC, C, X, Alt+Shift+C, Alt+Shift+X, Ctrl+Shift+F10
                    if (vk == VK_ESCAPE || vk == 'C' || vk == 'c' || vk == 'X' || vk == 'x' ||
                        (isAlt && isShift && (vk == 'C' || vk == 'c' || vk == 'X' || vk == 'x')) ||
                        (isCtrl && isShift && vk == VK_F10)) {
                        s_instance->m_lastTriggerTime = now;
                        std::cout << "\n[Keyboard Hook] Local dismiss triggered via keyboard (" << vk << ")" << std::endl;
                        if (s_instance->onLocalDismiss) s_instance->onLocalDismiss();
                    }
                } else {
                    // Overlay is not visible: only explicit Alt+Shift+C / Alt+Shift+X
                    if ((isAlt && isShift && (vk == 'C' || vk == 'c' || vk == 'X' || vk == 'x')) ||
                        (isCtrl && isShift && vk == VK_F10)) {
                        s_instance->m_lastTriggerTime = now;
                        if (s_instance->onLocalDismiss) s_instance->onLocalDismiss();
                    }
                }
            } else {
                // Controller global triggers:
                if (isAlt && isShift && (vk == 'O' || vk == 'o')) {
                    if (!s_instance->m_oDown && now >= s_instance->m_lastTriggerTime + 200) {
                        s_instance->m_oDown = true;
                        s_instance->m_lastTriggerTime = now;
                        std::cout << "\n[Keyboard Hook] ALT + SHIFT + O (Open Triggered)" << std::endl;
                        if (s_instance->onHotkeyTriggered) s_instance->onHotkeyTriggered(HotkeyAction::Open, now);
                    }
                } else if (isAlt && isShift && (vk == 'C' || vk == 'c')) {
                    if (!s_instance->m_cDown && now >= s_instance->m_lastTriggerTime + 200) {
                        s_instance->m_cDown = true;
                        s_instance->m_lastTriggerTime = now;
                        std::cout << "\n[Keyboard Hook] ALT + SHIFT + C (Close Triggered)" << std::endl;
                        if (s_instance->onHotkeyTriggered) s_instance->onHotkeyTriggered(HotkeyAction::Close, now);
                    }
                } else if (isAlt && isShift && (vk == 'X' || vk == 'x')) {
                    if (!s_instance->m_xDown && now >= s_instance->m_lastTriggerTime + 200) {
                        s_instance->m_xDown = true;
                        s_instance->m_lastTriggerTime = now;
                        std::cout << "\n[Keyboard Hook] ALT + SHIFT + X (Close Fallback Triggered)" << std::endl;
                        if (s_instance->onHotkeyTriggered) s_instance->onHotkeyTriggered(HotkeyAction::Close, now);
                    }
                } else if (isCtrl && isShift && vk == VK_F10) {
                    if (now >= s_instance->m_lastTriggerTime + 200) {
                        s_instance->m_lastTriggerTime = now;
                        std::cout << "\n[Keyboard Hook] Emergency Escape Triggered" << std::endl;
                        if (s_instance->onHotkeyTriggered) s_instance->onHotkeyTriggered(HotkeyAction::EmergencyEscape, now);
                    }
                }
            }
        }
    }
    return CallNextHookEx(s_instance ? s_instance->m_hook : NULL, nCode, wParam, lParam);
}

bool HotkeyManager::RegisterHotkeys(HWND hwnd) {
    auto& cfg = StateManager::Instance().GetConfig();

    // Open Hotkey (Alt + Shift + O)
    BOOL okOpen = RegisterHotKey(hwnd, HOTKEY_ID_OPEN, cfg.openHotkeyMod | MOD_NOREPEAT, cfg.openHotkeyKey);
    if (!okOpen) okOpen = RegisterHotKey(hwnd, HOTKEY_ID_OPEN, cfg.openHotkeyMod, cfg.openHotkeyKey);

    // Close Hotkey (Alt + Shift + C)
    BOOL okClose = RegisterHotKey(hwnd, HOTKEY_ID_CLOSE, cfg.closeHotkeyMod | MOD_NOREPEAT, cfg.closeHotkeyKey);
    if (!okClose) okClose = RegisterHotKey(hwnd, HOTKEY_ID_CLOSE, cfg.closeHotkeyMod, cfg.closeHotkeyKey);

    // Close Hotkey Fallback (Alt + Shift + X)
    BOOL okCloseX = RegisterHotKey(hwnd, HOTKEY_ID_CLOSE_FALLBACK, MOD_ALT | MOD_SHIFT | MOD_NOREPEAT, 'X');
    if (!okCloseX) okCloseX = RegisterHotKey(hwnd, HOTKEY_ID_CLOSE_FALLBACK, MOD_ALT | MOD_SHIFT, 'X');

    // Emergency Local Escape Hotkey (Ctrl + Shift + F10)
    BOOL okEsc = RegisterHotKey(hwnd, HOTKEY_ID_ESCAPE, MOD_CONTROL | MOD_SHIFT | MOD_NOREPEAT, VK_F10);
    if (!okEsc) okEsc = RegisterHotKey(hwnd, HOTKEY_ID_ESCAPE, MOD_CONTROL | MOD_SHIFT, VK_F10);

    m_registered = okOpen && (okClose || okCloseX);

    std::cout << "[Hotkeys] Registered Global Hotkeys:" << std::endl;
    std::cout << "  - ALT + SHIFT + O : Open Remote Overlay (" << (okOpen ? "Active" : "CONFLICT/FAILED") << ")" << std::endl;
    std::cout << "  - ALT + SHIFT + C : Close Remote Overlay (" << (okClose ? "Active" : "CONFLICT/FAILED") << ")" << std::endl;
    std::cout << "  - ALT + SHIFT + X : Close Remote Overlay Fallback (" << (okCloseX ? "Active" : "CONFLICT/FAILED") << ")" << std::endl;
    std::cout << "  - CTRL + SHIFT + F10 / ESC : Emergency Local Escape" << std::endl;

    return m_registered;
}

void HotkeyManager::UnregisterHotkeys(HWND hwnd) {
    if (m_registered) {
        UnregisterHotKey(hwnd, HOTKEY_ID_OPEN);
        UnregisterHotKey(hwnd, HOTKEY_ID_CLOSE);
        UnregisterHotKey(hwnd, HOTKEY_ID_CLOSE_FALLBACK);
        UnregisterHotKey(hwnd, HOTKEY_ID_ESCAPE);
        m_registered = false;
    }
}

bool HotkeyManager::HandleHotkeyMessage(WPARAM wParam, LPARAM /*lParam*/) {
    uint64_t t0 = StateManager::GetEpochMilliseconds();

    // Debounce to prevent duplicate dispatch if WH_KEYBOARD_LL already triggered
    if (t0 < m_lastTriggerTime + 200) {
        return false;
    }

    int hotkeyId = static_cast<int>(wParam);
    if (hotkeyId == HOTKEY_ID_OPEN) {
        m_lastTriggerTime = t0;
        std::cout << "\n[Hotkey Detected] ALT + SHIFT + O (Open Triggered)" << std::endl;
        if (onHotkeyTriggered) onHotkeyTriggered(HotkeyAction::Open, t0);
        return true;
    } else if (hotkeyId == HOTKEY_ID_CLOSE || hotkeyId == HOTKEY_ID_CLOSE_FALLBACK) {
        m_lastTriggerTime = t0;
        std::cout << "\n[Hotkey Detected] Close Hotkey Triggered" << std::endl;
        if (onHotkeyTriggered) onHotkeyTriggered(HotkeyAction::Close, t0);
        return true;
    } else if (hotkeyId == HOTKEY_ID_ESCAPE) {
        m_lastTriggerTime = t0;
        std::cout << "\n[Hotkey Detected] Emergency Escape Triggered" << std::endl;
        if (onHotkeyTriggered) onHotkeyTriggered(HotkeyAction::EmergencyEscape, t0);
        return true;
    }

    return false;
}

} // namespace PairPulse
