@echo off
chcp 65001 >nul 2>&1
title CLAUDE GANK - Setup Wizard
color 0A

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║                                                  ║
echo  ║   CLAUDE GANK COMMAND CENTER                     ║
echo  ║   Multi-Agent AI Dashboard - Setup Wizard        ║
echo  ║                                                  ║
echo  ║   20 AI Agents + Bird's Eye View + MCP Server    ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  สิ่งที่จะติดตั้ง:
echo    [1] npm dependencies (Next.js, React, Tailwind, SQLite...)
echo    [2] SQLite Database + Seed 20 AI Agents
echo    [3] Build MCP Server สำหรับ Cowork
echo    [4] ทดสอบ Build Dashboard
echo.
echo  สิ่งที่ต้องมีก่อน:
echo    - Node.js 18+ (เช็ค: node -v)
echo    - npm (เช็ค: npm -v)
echo.

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] ไม่พบ Node.js! กรุณาติดตั้งจาก https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Show versions
echo  ตรวจสอบ environment:
for /f "tokens=*" %%i in ('node -v') do echo    Node.js: %%i
for /f "tokens=*" %%i in ('npm -v') do echo    npm:     %%i
echo.

:: Confirm
set /p CONFIRM="  พร้อมติดตั้งหรือยัง? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo.
    echo  ยกเลิกการติดตั้ง
    pause
    exit /b 0
)

echo.
echo ══════════════════════════════════════════════════
echo  [1/4] กำลังติดตั้ง dependencies...
echo ══════════════════════════════════════════════════
echo.
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] npm install ล้มเหลว!
    pause
    exit /b 1
)
echo.
echo  [OK] Dependencies ติดตั้งเสร็จ
echo.

echo ══════════════════════════════════════════════════
echo  [2/4] กำลังสร้าง Database + Seed 20 Agents...
echo ══════════════════════════════════════════════════
echo.
call npx tsx scripts/seed.ts
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Seed ล้มเหลว!
    pause
    exit /b 1
)
echo.
echo  [OK] Database + 20 Agents สร้างเสร็จ
echo.

echo ══════════════════════════════════════════════════
echo  [3/4] กำลัง Build MCP Server...
echo ══════════════════════════════════════════════════
echo.
call npm run mcp:build
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] MCP Build ล้มเหลว! ลอง: cd mcp-server ^& npm install ^& npx tsc
    pause
    exit /b 1
)
echo.
echo  [OK] MCP Server build เสร็จ
echo.

echo ══════════════════════════════════════════════════
echo  [4/4] กำลัง Build Dashboard...
echo ══════════════════════════════════════════════════
echo.
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] Dashboard build ล้มเหลว!
    pause
    exit /b 1
)
echo.
echo  [OK] Dashboard build เสร็จ
echo.

:: Success!
color 0A
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║                                                  ║
echo  ║   SETUP COMPLETE!                                ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  สิ่งที่ติดตั้งแล้ว:
echo    [OK] npm dependencies
echo    [OK] SQLite Database (claude-gank.db)
echo    [OK] 20 AI Agents (CORE/TECH/CREATIVE/BIZ/FINANCE)
echo    [OK] MCP Server (mcp-server/dist/index.js)
echo    [OK] Dashboard build
echo.
echo  ══════════════════════════════════════════════════
echo  ขั้นตอนถัดไป:
echo  ══════════════════════════════════════════════════
echo.
echo  1. เปิด Dashboard:
echo     ดับเบิ้ลคลิก start.bat
echo     หรือรัน: npm run dev
echo     แล้วเปิด: http://localhost:3000
echo.
echo  2. เชื่อม Cowork (ทำครั้งเดียว):
echo     แก้ไขไฟล์:
echo     %%APPDATA%%\Claude\claude_desktop_config.json
echo.
echo     เพิ่ม:
echo     {
echo       "mcpServers": {
echo         "claude-gank": {
echo           "command": "node",
echo           "args": ["mcp-server/dist/index.js"],
echo           "cwd": "%CD%"
echo         }
echo       }
echo     }
echo.
echo     แล้ว Restart Claude Desktop
echo.
echo  3. ทดสอบใน Cowork:
echo     พิมพ์: "ดูสถานะทีม"
echo.

:: Ask to generate config
echo.
set /p GENCONFIG="  ต้องการสร้าง claude_desktop_config.json อัตโนมัติไหม? (y/n): "
if /i "%GENCONFIG%"=="y" (
    echo.
    echo  กำลังสร้าง config...

    :: Create config directory if needed
    if not exist "%APPDATA%\Claude" mkdir "%APPDATA%\Claude"

    :: Check if config exists
    if exist "%APPDATA%\Claude\claude_desktop_config.json" (
        echo  [!] พบ config เดิมอยู่แล้ว — สร้าง backup ก่อน
        copy "%APPDATA%\Claude\claude_desktop_config.json" "%APPDATA%\Claude\claude_desktop_config.backup.json" >nul
        echo  [OK] Backup: claude_desktop_config.backup.json
    )

    :: Write config — use PowerShell for proper JSON with escaped paths
    powershell -Command "$cwd = '%CD%' -replace '\\', '/'; $json = @{mcpServers=@{'claude-gank'=@{command='node';args=@('mcp-server/dist/index.js');cwd=$cwd}}} | ConvertTo-Json -Depth 4; $json | Set-Content -Path '%APPDATA%\Claude\claude_desktop_config.json' -Encoding UTF8"

    echo  [OK] Config สร้างเสร็จ: %APPDATA%\Claude\claude_desktop_config.json
    echo.
    echo  กรุณา Restart Claude Desktop แล้วทดสอบใน Cowork!
)

echo.
pause
