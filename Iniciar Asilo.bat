@echo off
setlocal
cd /d "%~dp0"
where powershell.exe >nul 2>&1
if errorlevel 1 (
  echo Windows PowerShell nao foi encontrado neste computador.
  echo O inicializador utiliza o PowerShell integrado ao Windows e nao precisa de Python ou Node.js.
  pause
  exit /b 1
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar-asilo.ps1"
if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar o servidor local.
  pause
)
