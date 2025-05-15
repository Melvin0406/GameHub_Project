@echo off
echo Starting Nginx from %~dp0
REM Cambia al directorio donde está nginx.exe
cd /D "%~dp0"
REM -p . asegura que el prefijo sea el directorio actual
REM -c conf/nginx.conf es relativo a ese prefijo
start "NginxPortable" nginx.exe -p . -c conf/nginx.conf
echo Nginx started. Check logs/error.log for issues.