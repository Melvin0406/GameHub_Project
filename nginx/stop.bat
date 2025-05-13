@echo off
cd /D "%~dp0"
echo Stopping Nginx...
nginx.exe -p "%cd%\" -s stop
echo Nginx stop signal sent.