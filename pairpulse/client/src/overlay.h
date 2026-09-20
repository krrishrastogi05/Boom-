#pragma once

#include <windows.h>
#include <string>
#include <cstdint>
#include "websocket_client.h"

namespace PairPulse {

class OverlayWindow {
public:
    static OverlayWindow& Instance();

    bool Initialize(HINSTANCE hInstance);
    void Destroy();

    void Show(const SignalTimestamps* ts = nullptr);
    void Hide();
    void Toggle(const SignalTimestamps* ts = nullptr);
    bool IsVisible() const { return m_isVisible; }

    HWND GetHwnd() const { return m_hwnd; }

private:
    OverlayWindow();
    ~OverlayWindow();

    static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);
    void Render(HDC hdc);

    HWND m_hwnd = NULL;
    bool m_isVisible = false;
    HINSTANCE m_hInstance = NULL;

    // Cached telemetry for display
    uint64_t m_lastSeq = 0;
    uint64_t m_lastEndToEndMs = 0;
    uint64_t m_lastT0 = 0;
    uint64_t m_lastT1 = 0;
    uint64_t m_lastT2 = 0;
    uint64_t m_lastT3 = 0;
    uint64_t m_lastT4 = 0;
    uint64_t m_lastT5 = 0;

    // Pre-warmed GDI resources
    HBRUSH m_bgBrush = NULL;
    HFONT m_titleFont = NULL;
    HFONT m_subtitleFont = NULL;
    HFONT m_telemetryFont = NULL;
};

} // namespace PairPulse
