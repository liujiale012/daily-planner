@echo off
setlocal
cd /d "%~dp0"
call "%ProgramFiles%\nodejs\npm.cmd" install %*
