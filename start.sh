#!/bin/bash
# CLAUDE GANK - Start Dashboard

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   CLAUDE GANK COMMAND CENTER                     ║${NC}"
echo -e "${GREEN}║   Starting Dashboard...                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Dashboard:    ${CYAN}http://localhost:3000${NC}"
echo -e "  Agents:       ${CYAN}http://localhost:3000/agents${NC}"
echo -e "  Bird's Eye:   ${CYAN}http://localhost:3000/birdseye${NC}"
echo -e "  Missions:     ${CYAN}http://localhost:3000/missions${NC}"
echo ""
echo "  กด Ctrl+C เพื่อหยุด"
echo ""

# Open browser after 3 seconds
(sleep 3 && open http://localhost:3000/birdseye 2>/dev/null || xdg-open http://localhost:3000/birdseye 2>/dev/null) &

# Start dev server
npm run dev
