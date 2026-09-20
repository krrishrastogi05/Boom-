cmake_minimum_required(VERSION 3.20)
project(pairpulse VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Configure IXWebSocket using OpenSSL for TLS
set(USE_TLS ON CACHE BOOL "" FORCE)
set(USE_OPENSSL ON CACHE BOOL "" FORCE)
set(USE_MBED_TLS OFF CACHE BOOL "" FORCE)
set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)

include(FetchContent)
FetchContent_Declare(
    ixwebsocket
    GIT_REPOSITORY https://github.com/machinezone/IXWebSocket.git
    GIT_TAG v11.4.4
)
FetchContent_MakeAvailable(ixwebsocket)

set(SOURCES
    src/main.cpp
    src/websocket_client.cpp
    src/websocket_client.h
    src/hotkey.cpp
    src/hotkey.h
    src/overlay.cpp
    src/overlay.h
    src/pairing.cpp
    src/pairing.h
    src/state.cpp
    src/state.h
    src/startup.cpp
    src/startup.h
)

add_executable(pairpulse ${SOURCES})

target_include_directories(pairpulse PRIVATE src)

target_link_libraries(pairpulse PRIVATE
    ixwebsocket
    ws2_32
    crypt32
    user32
    gdi32
    advapi32
    shell32
)

# Win32 subsystem configuration (calls WinMain)
set_target_properties(pairpulse PROPERTIES
    WIN32_EXECUTABLE TRUE
)
