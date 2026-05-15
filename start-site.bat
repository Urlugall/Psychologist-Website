@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "MODE=%~1"

if not defined MODE (
    echo Select start mode:
    echo   1 - site
    echo   2 - dev
    set /p MODE=Enter choice [1/2]: 
)

if /I "%MODE%"=="dev" goto dev
if "%MODE%"=="2" goto dev

set "PORT=8000"
set "OPEN_PATH=/"
goto run

:dev
set "PORT=8001"
set "OPEN_PATH=/admin/"

:run
where py >nul 2>nul
if not errorlevel 1 (
    py -3 "%ROOT%scripts\start_server.py" --root "%ROOT%" --port %PORT% --open-path "%OPEN_PATH%"
    goto :eof
)

where python >nul 2>nul
if not errorlevel 1 (
    python "%ROOT%scripts\start_server.py" --root "%ROOT%" --port %PORT% --open-path "%OPEN_PATH%"
    goto :eof
)

echo Python 3 was not found. Install Python and try again.
pause
exit /b 1
