@echo off
echo Stopping Nginx...
REM Cambia al directorio donde está nginx.exe
cd /D "%~dp0"
nginx.exe -s stop
echo Nginx stop signal sent.