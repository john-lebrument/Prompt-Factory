@echo off
chcp 65001 >nul
title Prompt Factory
echo ==============================================
echo       🏭 LANCEMENT DE PROMPT FACTORY 🏭
echo ==============================================
echo.
echo Ouverture dans votre navigateur par défaut...
start "" "%~dp0index.html"
exit
