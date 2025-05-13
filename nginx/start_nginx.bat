@echo off
REM Cambia al directorio donde está este script (.bat)
cd /D "%~dp0"

echo Starting Nginx from %cd%
REM -p "%cd%\" establece el directorio de trabajo actual (la carpeta 'nginx') como el prefijo de Nginx
REM -c conf/nginx.conf especifica la ruta del archivo de config relativa al prefijo
start "NginxPortable" nginx.exe -p "%cd%\" -c conf/nginx.conf

echo Nginx started. Check logs/error.log for issues.