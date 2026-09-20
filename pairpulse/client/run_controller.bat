@echo off
setlocal
set /p SERVER_URL="Enter Relay URL (press Enter for default ws://localhost:8080): "
if "%SERVER_URL%"=="" set SERVER_URL=ws://localhost:8080

echo Starting PairPulse Controller (Laptop A)...
if exist pairpulse.exe (
    pairpulse.exe --role controller --server %SERVER_URL%
) else if exist build\Release\pairpulse.exe (
    build\Release\pairpulse.exe --role controller --server %SERVER_URL%
) else (
    echo [ERROR] pairpulse.exe not found! Run build.bat first.
    pause
)
