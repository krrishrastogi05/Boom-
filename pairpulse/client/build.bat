@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo    PairPulse Windows Client Build Script
echo ======================================================

where cmake >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] CMake was not found in your PATH.
    echo Please install CMake from https://cmake.org/download/
    echo or run: winget install Kitware.CMake
    pause
    exit /b 1
)

if not exist build (
    mkdir build
)

cd build
echo [*] Generating build system with CMake...
cmake ..
if %errorlevel% neq 0 (
    echo [ERROR] CMake configuration failed.
    pause
    exit /b 1
)

echo [*] Compiling PairPulse (Release)...
cmake --build . --config Release
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed.
    pause
    exit /b 1
)

echo.
echo ======================================================
echo  BUILD SUCCESSFUL!
echo ======================================================
if exist Release\pairpulse.exe (
    echo Binary located at: build\Release\pairpulse.exe
    copy /Y Release\pairpulse.exe ..\pairpulse.exe >nul
    echo Copied to: pairpulse\client\pairpulse.exe
) else if exist pairpulse.exe (
    echo Binary located at: build\pairpulse.exe
    copy /Y pairpulse.exe ..\pairpulse.exe >nul
    echo Copied to: pairpulse\client\pairpulse.exe
)

echo.
echo You can now run:
echo   Laptop A (Controller): pairpulse.exe --role controller --server wss://boom-ba63.onrender.com
echo   Laptop B (Receiver):   pairpulse.exe --role receiver --server wss://boom-ba63.onrender.com --pair <code>
echo.
pause
