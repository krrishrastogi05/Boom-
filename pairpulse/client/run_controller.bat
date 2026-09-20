@echo off
setlocal
set DEFAULT_URL=wss://boom-ba63.onrender.com
set /p SERVER_URL="Enter Relay URL (press Enter for default %DEFAULT_URL%): "
if "%SERVER_URL%"=="" set SERVER_URL=%DEFAULT_URL%

echo.
echo Starting PairPulse Controller (Laptop A)...
echo Relay Server: %SERVER_URL%
echo.
if exist pairpulse.exe (
    pairpulse.exe --role controller --server %SERVER_URL%
) else if exist build\Release\pairpulse.exe (
    build\Release\pairpulse.exe --role controller --server %SERVER_URL%
) else (
    echo [ERROR] pairpulse.exe not found!
    pause
)
