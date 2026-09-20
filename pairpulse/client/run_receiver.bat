@echo off
setlocal
set /p SERVER_URL="Enter Relay URL (press Enter for default ws://localhost:8080): "
if "%SERVER_URL%"=="" set SERVER_URL=ws://localhost:8080

set /p PAIR_CODE="Enter 6-digit Pairing Code (leave blank if already paired): "

set ARGS=--role receiver --server %SERVER_URL%
if not "%PAIR_CODE%"=="" set ARGS=%ARGS% --pair %PAIR_CODE%

echo Starting PairPulse Receiver (Laptop B)...
if exist pairpulse.exe (
    pairpulse.exe %ARGS%
) else if exist build\Release\pairpulse.exe (
    build\Release\pairpulse.exe %ARGS%
) else (
    echo [ERROR] pairpulse.exe not found! Run build.bat first.
    pause
)
