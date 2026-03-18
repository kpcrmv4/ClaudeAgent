@echo off
chcp 65001 >nul 2>&1
title CLAUDE GANK - Dashboard
color 0A

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   CLAUDE GANK COMMAND CENTER                     ║
echo  ║   Starting Dashboard...                          ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  Dashboard:    http://localhost:3000
echo  Agents:       http://localhost:3000/agents
echo  Bird's Eye:   http://localhost:3000/birdseye
echo  Missions:     http://localhost:3000/missions
echo.
echo  กด Ctrl+C เพื่อหยุด
echo.
echo ══════════════════════════════════════════════════
echo.

:: Open browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000/birdseye"

:: Start dev server
call npm run dev
