#include <winsock2.h>
#include <windows.h>
#include <shellapi.h>
#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <atomic>
#include <ixwebsocket/IXNetSystem.h>

#include "state.h"
#include "websocket_client.h"
#include "hotkey.h"
#include "overlay.h"
#include "pairing.h"
#include "startup.h"

using namespace PairPulse;

#define WM_TRAYICON (WM_USER + 101)
#define ID_TRAY_EXIT 2001
#define ID_TRAY_STATUS 2002
#define ID_TRAY_TOGGLE 2003
#define ID_TRAY_RESET 2004

static NOTIFYICONDATAW g_nid = {0};
static HWND g_msgHwnd = NULL;
static std::unique_ptr<WebSocketClient> g_wsClient;
static std::unique_ptr<HotkeyManager> g_hotkeyManager;
static std::unique_ptr<PairingManager> g_pairingManager;
static std::atomic<uint64_t> g_sequenceNumber{100};
static std::string g_inputPairCode = "";

static void UpdateTrayTooltip(const std::wstring& statusText) {
    if (g_msgHwnd) {
        auto roleStr = StateManager::RoleToString(StateManager::Instance().GetConfig().role);
        std::wstring tip = L"PairPulse [" + std::wstring(roleStr.begin(), roleStr.end()) + L"] - " + statusText;
        wcsncpy_s(g_nid.szTip, tip.c_str(), _TRUNCATE);
        Shell_NotifyIconW(NIM_MODIFY, &g_nid);
    }
}

static LRESULT CALLBACK MsgWindowProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_HOTKEY: {
            if (wParam >= 9991 && wParam <= 9993) {
                std::cout << "[Local Escape] Closing overlay via local hotkey." << std::endl;
                OverlayWindow::Instance().Hide();
                return 0;
            }
            if (g_hotkeyManager) {
                g_hotkeyManager->HandleHotkeyMessage(wParam, lParam);
            }
            return 0;
        }

        case WM_TRAYICON: {
            if (lParam == WM_RBUTTONUP || lParam == WM_CONTEXTMENU) {
                POINT pt;
                GetCursorPos(&pt);
                HMENU hMenu = CreatePopupMenu();
                InsertMenuW(hMenu, 0, MF_BYPOSITION | MF_STRING, ID_TRAY_STATUS, L"PairPulse Status");
                InsertMenuW(hMenu, 1, MF_BYPOSITION | MF_SEPARATOR, 0, NULL);
                InsertMenuW(hMenu, 2, MF_BYPOSITION | MF_STRING, ID_TRAY_TOGGLE, L"Toggle Overlay");
                InsertMenuW(hMenu, 3, MF_BYPOSITION | MF_STRING, ID_TRAY_RESET, L"Reset Pairing Credentials");
                InsertMenuW(hMenu, 4, MF_BYPOSITION | MF_SEPARATOR, 0, NULL);
                InsertMenuW(hMenu, 5, MF_BYPOSITION | MF_STRING, ID_TRAY_EXIT, L"Exit PairPulse");

                SetForegroundWindow(hwnd);
                TrackPopupMenu(hMenu, TPM_RIGHTBUTTON, pt.x, pt.y, 0, hwnd, NULL);
                DestroyMenu(hMenu);
            }
            return 0;
        }

        case WM_COMMAND: {
            int wmId = LOWORD(wParam);
            if (wmId == ID_TRAY_EXIT) {
                PostQuitMessage(0);
            } else if (wmId == ID_TRAY_TOGGLE) {
                OverlayWindow::Instance().Toggle();
            } else if (wmId == ID_TRAY_RESET) {
                StateManager::Instance().ResetConfig();
                MessageBoxW(hwnd, L"Pairing credentials reset. Please restart PairPulse to pair again.", L"PairPulse", MB_OK | MB_ICONINFORMATION);
            } else if (wmId == ID_TRAY_STATUS) {
                auto& cfg = StateManager::Instance().GetConfig();
                std::string status = "Role: " + StateManager::RoleToString(cfg.role) + "\n" +
                                     "Server: " + cfg.serverUrl + "\n" +
                                     "Connected: " + (g_wsClient && g_wsClient->IsConnected() ? "YES" : "NO") + "\n" +
                                     "Pair ID: " + (cfg.pairId.empty() ? "(Not Paired)" : cfg.pairId);
                MessageBoxA(hwnd, status.c_str(), "PairPulse Status", MB_OK | MB_ICONINFORMATION);
            }
            return 0;
        }

        case WM_DESTROY: {
            Shell_NotifyIconW(NIM_DELETE, &g_nid);
            PostQuitMessage(0);
            return 0;
        }

        default:
            return DefWindowProcW(hwnd, msg, wParam, lParam);
    }
}

static void PrintUsage() {
    std::cout << "PairPulse Desktop Client - Ultra-Low-Latency Cross-Device Signaling\n\n"
              << "Usage: pairpulse.exe [options]\n\n"
              << "Options:\n"
              << "  --role <controller|receiver>  Run as Laptop A (controller) or Laptop B (receiver)\n"
              << "  --server <url>                Relay server URL (default: ws://localhost:8080)\n"
              << "  --pair <code>                 6-digit pairing code to submit (for receiver)\n"
              << "  --config <path>               Custom config file path\n"
              << "  --reset                       Reset saved pairing credentials and exit\n"
              << "  --install-autostart           Register application in Windows autostart and exit\n"
              << "  --uninstall-autostart         Remove application from Windows autostart and exit\n"
              << "  --help                        Show this help message\n\n"
              << "Default Global Hotkeys (Controller):\n"
              << "  ALT + SHIFT + O               Open Remote Overlay\n"
              << "  ALT + SHIFT + C               Close Remote Overlay\n"
              << "  CTRL + SHIFT + F10 / ESC      Local Emergency Escape (Overlay dismiss)\n"
              << std::endl;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE /*hPrevInstance*/, LPSTR lpCmdLine, int /*nCmdShow*/) {
    // Initialize Windows networking subsystem
    ix::initNetSystem();

    // Also attach console if invoked from terminal or enable stdout
    AllocConsole();
    FILE* fp;
    freopen_s(&fp, "CONOUT$", "w", stdout);
    freopen_s(&fp, "CONOUT$", "w", stderr);

    std::cout << "======================================================" << std::endl;
    std::cout << " PairPulse Desktop Agent v1.0" << std::endl;
    std::cout << "======================================================" << std::endl;

    std::vector<std::string> args;
    int argc = 0;
    LPWSTR* argvW = CommandLineToArgvW(GetCommandLineW(), &argc);
    for (int i = 0; i < argc; i++) {
        char buf[1024];
        WideCharToMultiByte(CP_UTF8, 0, argvW[i], -1, buf, 1024, NULL, NULL);
        args.push_back(buf);
    }
    LocalFree(argvW);

    std::string customConfig = "";
    std::string roleArg = "";
    std::string serverArg = "";
    bool installAutostart = false;
    bool uninstallAutostart = false;
    bool resetCreds = false;

    for (size_t i = 1; i < args.size(); i++) {
        if (args[i] == "--help" || args[i] == "-h") {
            PrintUsage();
            return 0;
        } else if (args[i] == "--role" && i + 1 < args.size()) {
            roleArg = args[++i];
        } else if (args[i] == "--server" && i + 1 < args.size()) {
            serverArg = args[++i];
        } else if (args[i] == "--pair" && i + 1 < args.size()) {
            g_inputPairCode = args[++i];
        } else if (args[i] == "--config" && i + 1 < args.size()) {
            customConfig = args[++i];
        } else if (args[i] == "--install-autostart") {
            installAutostart = true;
        } else if (args[i] == "--uninstall-autostart") {
            uninstallAutostart = true;
        } else if (args[i] == "--reset") {
            resetCreds = true;
        }
    }

    auto& stateMgr = StateManager::Instance();
    stateMgr.LoadConfig(customConfig);
    auto& cfg = stateMgr.GetConfig();

    if (resetCreds) {
        stateMgr.ResetConfig(customConfig);
        std::cout << "[Config] Pairing credentials successfully cleared." << std::endl;
        return 0;
    }

    if (!roleArg.empty()) {
        cfg.role = StateManager::StringToRole(roleArg);
    }
    if (!serverArg.empty()) {
        cfg.serverUrl = serverArg;
    }

    if (installAutostart) {
        StartupManager::InstallAutostart(cfg.role);
        return 0;
    }
    if (uninstallAutostart) {
        StartupManager::UninstallAutostart();
        return 0;
    }

    if (cfg.role == Role::Unknown) {
        std::cout << "[PairPulse] Role not specified. Defaulting to: CONTROLLER (Laptop A)." << std::endl;
        std::cout << "            To run as Receiver (Laptop B), launch with: --role receiver" << std::endl;
        cfg.role = Role::Controller;
    }

    std::cout << "[PairPulse] Starting as: " << StateManager::RoleToString(cfg.role) << std::endl;
    std::cout << "[PairPulse] Relay URL:   " << cfg.serverUrl << std::endl;

    // Register Hidden Message-Only Window for Hotkeys and Tray
    WNDCLASSEXW wc = {0};
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.lpfnWndProc = MsgWindowProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = L"PairPulse_MsgWindow";
    RegisterClassExW(&wc);

    g_msgHwnd = CreateWindowExW(0, L"PairPulse_MsgWindow", L"PairPulse_Msg", 0, 0, 0, 0, 0, HWND_MESSAGE, NULL, hInstance, NULL);

    // Initialize System Tray Icon
    g_nid.cbSize = sizeof(NOTIFYICONDATAW);
    g_nid.hWnd = g_msgHwnd;
    g_nid.uID = 1;
    g_nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    g_nid.uCallbackMessage = WM_TRAYICON;
    g_nid.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    Shell_NotifyIconW(NIM_ADD, &g_nid);
    UpdateTrayTooltip(L"Connecting...");

    // Initialize Overlay for Receiver
    // CRITICAL REQUIREMENT: Pre-create in memory during startup, keep hidden until event!
    if (cfg.role == Role::Receiver) {
        std::cout << "[Overlay] Pre-warming borderless fullscreen overlay in memory..." << std::endl;
        if (!OverlayWindow::Instance().Initialize(hInstance)) {
            std::cerr << "[Overlay] Failed to pre-warm overlay window." << std::endl;
        }
    }

    // Initialize WebSocket Client
    g_wsClient = std::make_unique<WebSocketClient>();
    g_pairingManager = std::make_unique<PairingManager>(*g_wsClient);
    g_pairingManager->Initialize();

    g_wsClient->AddConnectionListener([](bool isConnected) {
        UpdateTrayTooltip(isConnected ? L"Connected" : L"Reconnecting...");
    });

    // Controller: Global Hotkey Registration & Fast Hot Path
    if (cfg.role == Role::Controller) {
        g_hotkeyManager = std::make_unique<HotkeyManager>();
        g_hotkeyManager->RegisterHotkeys(g_msgHwnd);

        g_hotkeyManager->onHotkeyTriggered = [](HotkeyAction action, uint64_t t0) {
            uint64_t seq = ++g_sequenceNumber;
            std::string signalType = "OVERLAY_ON";
            if (action == HotkeyAction::Close) signalType = "OVERLAY_OFF";
            else if (action == HotkeyAction::Toggle) signalType = "OVERLAY_TOGGLE";

            // T1: Monotonic timestamp right before writing to already-open socket
            uint64_t t1 = StateManager::GetEpochMilliseconds();

            if (g_wsClient && g_wsClient->IsConnected()) {
                g_wsClient->SendOverlaySignal(signalType, seq, t0, t1);
                std::cout << "[Signal Sent] " << signalType << " (Seq #" << seq
                          << ") | Local Dispatch Latency (T1 - T0): " << (t1 >= t0 ? t1 - t0 : 0) << " ms" << std::endl;
            } else {
                std::cerr << "[Signal Dropped] Relay WebSocket is currently disconnected." << std::endl;
            }
        };
    }

    // Receiver: Handle Inbound Signaling Events
    if (cfg.role == Role::Receiver) {
        // Register local dismiss hotkeys on Receiver
        RegisterHotKey(g_msgHwnd, 9991, MOD_ALT | MOD_SHIFT, 'C');
        RegisterHotKey(g_msgHwnd, 9992, MOD_ALT | MOD_SHIFT, 'X');

        g_wsClient->onOverlaySignal = [](const std::string& type, const SignalTimestamps& ts) {
            std::cout << "\n[Remote Signal Received] " << type << " (Seq #" << ts.seq << ")" << std::endl;
            if (type == "OVERLAY_ON") {
                OverlayWindow::Instance().Show(&ts);
            } else if (type == "OVERLAY_OFF") {
                OverlayWindow::Instance().Hide();
            } else if (type == "OVERLAY_TOGGLE") {
                OverlayWindow::Instance().Toggle(&ts);
            }
        };

        g_wsClient->onStateSync = [](const std::string& state, uint64_t /*seq*/, bool pairedOnline) {
            std::cout << "[State Sync] Remote state: " << state << " | Partner online: " << (pairedOnline ? "YES" : "NO") << std::endl;
            if (state == "ON") {
                OverlayWindow::Instance().Show(nullptr);
            } else if (state == "OFF") {
                OverlayWindow::Instance().Hide();
            }
        };
    }

    // Start WebSocket Connection
    g_wsClient->Connect(cfg.serverUrl);

    // If un-paired, initiate pairing flow
    if (!g_pairingManager->IsPaired()) {
        std::cout << "[Pairing] Device is not paired yet." << std::endl;
        g_pairingManager->StartPairingFlow(g_inputPairCode);
    }

    // Main Win32 Event Loop
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    // Cleanup on exit
    if (g_hotkeyManager) g_hotkeyManager->UnregisterHotkeys(g_msgHwnd);
    if (g_wsClient) g_wsClient->Disconnect();
    OverlayWindow::Instance().Destroy();
    if (g_msgHwnd) DestroyWindow(g_msgHwnd);

    ix::uninitNetSystem();

    return static_cast<int>(msg.wParam);
}
