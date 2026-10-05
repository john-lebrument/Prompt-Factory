@echo off
chcp 65001 >nul
title Synchronisation GitHub - Prompt Factory
echo ==============================================
echo       🏭 SYNCHRONISATION PROMPT FACTORY 🏭
echo ==============================================
echo.
python "%~dp0sync_github.py"
echo.
echo Opération terminée.
pause
