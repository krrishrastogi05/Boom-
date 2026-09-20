#include "overlay.h"
#include "state.h"
#include <iostream>
#include <iomanip>

namespace PairPulse {

static const wchar_t* OVERLAY_CLASS_NAME = L"PairPulse_Overlay_WindowClass";

OverlayWindow& OverlayWindow::Instance() {
    static OverlayWindow instance;
    return instance;
}

OverlayWindow::OverlayWindow() {}

OverlayWindow::~OverlayWindow() {
    Destroy();
}

bool OverlayWindow::Initialize(HINSTANCE hInstance) {
    m_hInstance = hInstance;

    // Pre-create GDI drawing objects
    m_bgBrush = CreateSolidBrush(RGB(10, 14, 23)); // Deep dark slate background
    m_titleFont = CreateFontW(38, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
                              DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
                              CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
    m_subtitleFont = CreateFontW(18, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
                                 DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
                                 CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
    m_telemetryFont = CreateFontW(15, 0, 0, 0, FW_MEDIUM, FALSE, FALSE, FALSE,
                                  DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
                                  CLEARTYPE_QUALITY, FIXED_PITCH | FF_DONTCARE, L"Consolas");

    // Register Window Class
    WNDCLASSEXW wc = {0};
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = OverlayWindow::WndProc;
    wc.hInstance = hInstance;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = m_bgBrush;
    wc.lpszClassName = OVERLAY_CLASS_NAME;

    if (!RegisterClassExW(&wc)) {
        std::cerr << "[Overlay] Failed to register overlay window class." << std::endl;
        return false;
    }

    // Query primary monitor resolution (or virtual screen bounds)
    int screenWidth = GetSystemMetrics(SM_CXSCREEN);
    int screenHeight = GetSystemMetrics(SM_CYSCREEN);

    // Pre-create fullscreen borderless topmost window
    m_hwnd = CreateWindowExW(
        WS_EX_TOPMOST | WS_EX_TOOLWINDOW,
        OVERLAY_CLASS_NAME,
        L"PairPulse Overlay",
        WS_POPUP,
        0, 0, screenWidth, screenHeight,
        NULL, NULL, hInstance, this
    );

    if (!m_hwnd) {
        std::cerr << "[Overlay] Failed to create overlay window. Error: " << GetLastError() << std::endl;
        return false;
    }

    // Window is created in memory and kept hidden until activated
    ShowWindow(m_hwnd, SW_HIDE);
    UpdateWindow(m_hwnd);

    std::cout << "[Overlay] Pre-created fullscreen borderless window ("
              << screenWidth << "x" << screenHeight << ") successfully." << std::endl;

    return true;
}

void OverlayWindow::Destroy() {
    if (m_hwnd) {
        DestroyWindow(m_hwnd);
        m_hwnd = NULL;
    }
    if (m_hInstance) {
        UnregisterClassW(OVERLAY_CLASS_NAME, m_hInstance);
        m_hInstance = NULL;
    }
    if (m_bgBrush) { DeleteObject(m_bgBrush); m_bgBrush = NULL; }
    if (m_titleFont) { DeleteObject(m_titleFont); m_titleFont = NULL; }
    if (m_subtitleFont) { DeleteObject(m_subtitleFont); m_subtitleFont = NULL; }
    if (m_telemetryFont) { DeleteObject(m_telemetryFont); m_telemetryFont = NULL; }
}

void OverlayWindow::Show(const SignalTimestamps* ts) {
    if (!m_hwnd) return;

    // Record high-resolution display timing
    uint64_t t5 = StateManager::GetEpochMilliseconds();

    if (ts) {
        m_lastSeq = ts->seq;
        m_lastT0 = ts->t0;
        m_lastT1 = ts->t1;
        m_lastT2 = ts->t2;
        m_lastT3 = ts->t3;
        m_lastT4 = ts->t4;
        m_lastT5 = t5;
        m_lastEndToEndMs = (t5 > ts->t0 && ts->t0 > 0) ? (t5 - ts->t0) : 0;

        if (StateManager::Instance().GetConfig().debugLogging) {
            std::cout << "\n>>> [PAIRPULSE OVERLAY ON] Sequence #" << ts->seq << " <<<" << std::endl;
            std::cout << "  - Local Dispatch (T1 - T0): " << (ts->t1 >= ts->t0 ? ts->t1 - ts->t0 : 0) << " ms" << std::endl;
            std::cout << "  - Relay Transit  (T3 - T2): " << (ts->t3 >= ts->t2 ? ts->t3 - ts->t2 : 0) << " ms" << std::endl;
            std::cout << "  - Network Fwd    (T4 - T3): " << (ts->t4 >= ts->t3 ? ts->t4 - ts->t3 : 0) << " ms" << std::endl;
            std::cout << "  - ShowWindow()   (T5 - T4): " << (t5 >= ts->t4 ? t5 - ts->t4 : 0) << " ms" << std::endl;
            std::cout << "  ===> Total End-to-End Latency: " << m_lastEndToEndMs << " ms" << std::endl;
        }
    }

    PostMessage(m_hwnd, WM_USER_SHOW_OVERLAY, 0, 0);
}

void OverlayWindow::Hide() {
    if (!m_hwnd) return;
    PostMessage(m_hwnd, WM_USER_HIDE_OVERLAY, 0, 0);
}

void OverlayWindow::Toggle(const SignalTimestamps* ts) {
    if (m_isVisible) {
        Hide();
    } else {
        Show(ts);
    }
}

void OverlayWindow::Render(HDC hdc) {
    RECT rect;
    GetClientRect(m_hwnd, &rect);

    // Double buffer to prevent any visual tearing
    HDC memDC = CreateCompatibleDC(hdc);
    HBITMAP memBitmap = CreateCompatibleBitmap(hdc, rect.right, rect.bottom);
    HBITMAP oldBitmap = (HBITMAP)SelectObject(memDC, memBitmap);

    // Background fill
    FillRect(memDC, &rect, m_bgBrush);

    // Accent line at the top
    RECT accentRect = {0, 0, rect.right, 4};
    HBRUSH accentBrush = CreateSolidBrush(RGB(56, 189, 248)); // Cyan accent
    FillRect(memDC, &accentRect, accentBrush);
    DeleteObject(accentBrush);

    SetBkMode(memDC, TRANSPARENT);

    // Title
    SelectObject(memDC, m_titleFont);
    SetTextColor(memDC, RGB(241, 245, 249)); // White-slate
    RECT titleRect = rect;
    titleRect.top = rect.bottom / 2 - 120;
    titleRect.bottom = titleRect.top + 60;
    DrawTextW(memDC, L"PAIRPULSE ACTIVE", -1, &titleRect, DT_CENTER | DT_SINGLELINE);

    // Subtitle
    SelectObject(memDC, m_subtitleFont);
    SetTextColor(memDC, RGB(148, 163, 184)); // Muted slate
    RECT subRect = rect;
    subRect.top = titleRect.bottom + 10;
    subRect.bottom = subRect.top + 40;
    DrawTextW(memDC, L"Cross-Device Desktop Signaling Screen  •  Press [ALT+SHIFT+C] or [ESC] to Dismiss", -1, &subRect, DT_CENTER | DT_SINGLELINE);

    // Latency & Telemetry Block
    if (m_lastSeq > 0) {
        SelectObject(memDC, m_telemetryFont);
        SetTextColor(memDC, RGB(56, 189, 248));
        std::wstring tele = L"Telemetry: Seq #" + std::to_wstring(m_lastSeq) +
                            L"  |  End-to-End Latency: " + std::to_wstring(m_lastEndToEndMs) + L" ms" +
                            L"  |  Local Dispatch: " + std::to_wstring(m_lastT1 >= m_lastT0 ? m_lastT1 - m_lastT0 : 0) + L" ms" +
                            L"  |  Relay: " + std::to_wstring(m_lastT3 >= m_lastT2 ? m_lastT3 - m_lastT2 : 0) + L" ms";
        RECT teleRect = rect;
        teleRect.top = subRect.bottom + 30;
        teleRect.bottom = teleRect.top + 30;
        DrawTextW(memDC, tele.c_str(), -1, &teleRect, DT_CENTER | DT_SINGLELINE);
    }

    // Blit from memory DC to screen DC
    BitBlt(hdc, 0, 0, rect.right, rect.bottom, memDC, 0, 0, SRCCOPY);

    SelectObject(memDC, oldBitmap);
    DeleteObject(memBitmap);
    DeleteDC(memDC);
}

LRESULT CALLBACK OverlayWindow::WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_USER_SHOW_OVERLAY: {
            ShowWindow(hwnd, SW_SHOW);
            SetForegroundWindow(hwnd);
            SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
            OverlayWindow::Instance().m_isVisible = true;
            InvalidateRect(hwnd, NULL, TRUE);
            return 0;
        }

        case WM_USER_HIDE_OVERLAY: {
            ShowWindow(hwnd, SW_HIDE);
            SetWindowPos(hwnd, HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_HIDEWINDOW);
            OverlayWindow::Instance().m_isVisible = false;
            std::cout << "[Overlay] Hidden." << std::endl;
            return 0;
        }

        case WM_PAINT: {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hwnd, &ps);
            OverlayWindow::Instance().Render(hdc);
            EndPaint(hwnd, &ps);
            return 0;
        }

        case WM_SYSKEYDOWN:
        case WM_KEYDOWN: {
            // Local Emergency Escape: User pressing ESC, C, X, or Alt+Shift+C immediately closes overlay
            bool isAlt = (GetKeyState(VK_MENU) & 0x8000) != 0;
            bool isShift = (GetKeyState(VK_SHIFT) & 0x8000) != 0;
            if (wParam == VK_ESCAPE || wParam == 'C' || wParam == 'c' || wParam == 'X' || wParam == 'x' || (wParam == 'C' && isAlt && isShift)) {
                std::cout << "[Overlay] Local emergency escape key pressed." << std::endl;
                OverlayWindow::Instance().Hide();
                return 0;
            }
            return 0;
        }

        // Intercept mouse clicks: clicking anywhere dismisses overlay
        case WM_LBUTTONDOWN:
        case WM_RBUTTONDOWN: {
            std::cout << "[Overlay] Screen click detected - dismissing overlay." << std::endl;
            OverlayWindow::Instance().Hide();
            return 0;
        }

        case WM_DESTROY: {
            return 0;
        }

        default:
            return DefWindowProcW(hwnd, msg, wParam, lParam);
    }
}

} // namespace PairPulse
