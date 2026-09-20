@echo off
setlocal
set DEFAULT_URL=wss://boom-ba63.onrender.com
set /p SERVER_URL="Enter Relay URL (press Enter for default %DEFAULT_URL%): "
if "%SERVER_URL%"=="" set SERVER_URL=%DEFAULT_URL%

echo.
:check_paired
if not exist "%APPDATA%\PairPulse\config_receiver.json" (
    if not exist "%APPDATA%\PairPulse\config.json" (
        echo [!] First-time setup: This device is not paired with Laptop A yet.
        set /p PAIR_CODE="Enter 6-digit Pairing Code displayed on Laptop A: "
        if "%PAIR_CODE%"=="" (
            echo [!] Please enter the 6-digit code to pair.
            goto check_paired
        )
    )
)

if "%PAIR_CODE%"=="" (
    set /p PAIR_CODE="Enter 6-digit Pairing Code from Laptop A (leave blank if already paired): "
)

set ARGS=--role receiver --server %SERVER_URL%
if not "%PAIR_CODE%"=="" set ARGS=%ARGS% --pair %PAIR_CODE%

echo.
echo Starting PairPulse Receiver (Laptop B)...
echo Relay Server: %SERVER_URL%
echo.
if exist pairpulse.exe (
    pairpulse.exe %ARGS%
) else if exist build\Release\pairpulse.exe (
    build\Release\pairpulse.exe %ARGS%
) else (
    echo [ERROR] pairpulse.exe not found!
    pause
)
