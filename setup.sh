#!/bin/bash
# CLAUDE GANK - Setup Script (Mac/Linux)

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║   CLAUDE GANK COMMAND CENTER                     ║${NC}"
echo -e "${GREEN}║   Multi-Agent AI Dashboard - Setup               ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║   20 AI Agents + Bird's Eye View + MCP Server    ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "  สิ่งที่จะติดตั้ง:"
echo "    [1] npm dependencies (Next.js, React, Tailwind, SQLite...)"
echo "    [2] SQLite Database + Seed 20 AI Agents"
echo "    [3] Build MCP Server สำหรับ Cowork"
echo "    [4] ทดสอบ Build Dashboard"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}  [ERROR] ไม่พบ Node.js! กรุณาติดตั้งจาก https://nodejs.org${NC}"
    exit 1
fi

echo "  ตรวจสอบ environment:"
echo "    Node.js: $(node -v)"
echo "    npm:     $(npm -v)"
echo ""

# Confirm
read -p "  พร้อมติดตั้งหรือยัง? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo ""
    echo "  ยกเลิกการติดตั้ง"
    exit 0
fi

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  [1/4] กำลังติดตั้ง dependencies...${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""
npm install
echo ""
echo -e "${GREEN}  [OK] Dependencies ติดตั้งเสร็จ${NC}"
echo ""

echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  [2/4] กำลังสร้าง Database + Seed 20 Agents...${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""
npx tsx scripts/seed.ts
echo ""
echo -e "${GREEN}  [OK] Database + 20 Agents สร้างเสร็จ${NC}"
echo ""

echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  [3/4] กำลัง Build MCP Server...${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""
npm run mcp:build
echo ""
echo -e "${GREEN}  [OK] MCP Server build เสร็จ${NC}"
echo ""

echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  [4/4] กำลัง Build Dashboard...${NC}"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""
npm run build
echo ""
echo -e "${GREEN}  [OK] Dashboard build เสร็จ${NC}"
echo ""

# Get absolute path
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Success
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║   SETUP COMPLETE!                                ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "  สิ่งที่ติดตั้งแล้ว:"
echo -e "    ${GREEN}[OK]${NC} npm dependencies"
echo -e "    ${GREEN}[OK]${NC} SQLite Database (claude-gank.db)"
echo -e "    ${GREEN}[OK]${NC} 20 AI Agents (CORE/TECH/CREATIVE/BIZ/FINANCE)"
echo -e "    ${GREEN}[OK]${NC} MCP Server (mcp-server/dist/index.js)"
echo -e "    ${GREEN}[OK]${NC} Dashboard build"
echo ""
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo "  ขั้นตอนถัดไป:"
echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
echo ""
echo "  1. เปิด Dashboard:"
echo "     ./start.sh"
echo "     หรือ: npm run dev"
echo "     แล้วเปิด: http://localhost:3000"
echo ""
echo "  2. เชื่อม Cowork (ทำครั้งเดียว):"
echo ""

# Detect OS for config path
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
    CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
else
    CONFIG_DIR="$HOME/.config/Claude"
    CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
fi

echo "     แก้ไขไฟล์: $CONFIG_FILE"
echo ""
echo '     {'
echo '       "mcpServers": {'
echo '         "claude-gank": {'
echo '           "command": "node",'
echo '           "args": ["mcp-server/dist/index.js"],'
echo "           \"cwd\": \"$PROJECT_DIR\""
echo '         }'
echo '       }'
echo '     }'
echo ""
echo "     แล้ว Restart Claude Desktop"
echo ""

# Ask to generate config
read -p "  ต้องการสร้าง claude_desktop_config.json อัตโนมัติไหม? (y/n): " GENCONFIG
if [[ "$GENCONFIG" == "y" || "$GENCONFIG" == "Y" ]]; then
    echo ""
    echo "  กำลังสร้าง config..."

    mkdir -p "$CONFIG_DIR"

    if [[ -f "$CONFIG_FILE" ]]; then
        echo "  [!] พบ config เดิม — สร้าง backup ก่อน"
        cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"
        echo -e "  ${GREEN}[OK]${NC} Backup: claude_desktop_config.backup.json"
    fi

    cat > "$CONFIG_FILE" << JSONEOF
{
  "mcpServers": {
    "claude-gank": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"],
      "cwd": "$PROJECT_DIR"
    }
  }
}
JSONEOF

    echo -e "  ${GREEN}[OK]${NC} Config สร้างเสร็จ: $CONFIG_FILE"
    echo ""
    echo -e "  ${YELLOW}กรุณา Restart Claude Desktop แล้วทดสอบใน Cowork!${NC}"
fi

echo ""
echo "  เสร็จแล้ว! กด Enter เพื่อปิด"
read
