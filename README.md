# Claude GANK Command Center

**Multi-Agent AI Dashboard** — ควบคุม AI agents 20 ตัวจาก dashboard เดียว ไม่ต้องใช้ API key

> ใช้ Claude Cowork subscription ที่จ่ายอยู่แล้ว — ไม่มีค่าใช้จ่ายเพิ่ม

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![License](https://img.shields.io/badge/License-MIT-blue)
![Agents](https://img.shields.io/badge/AI%20Agents-20-purple)

---

## What is this?

ระบบ Multi-Agent ที่ให้คุณสร้าง mission สั่งงาน AI agents 20 ตัว แต่ละตัวมีบทบาทเฉพาะทาง (เขียนโค้ด, การตลาด, วิเคราะห์หุ้น, กฎหมาย ฯลฯ) ทุกอย่างทำงานผ่าน Claude Cowork — ไม่ต้องตั้ง API key

```
คุณ → สั่งงาน (Dashboard / Cowork / มือถือ)
        ↓
  PENDING mission ลง SQLite
        ↓
  Cowork หยิบงาน → อ่าน agent context + memories → คิดเอง
        ↓
  เขียนผลกลับ → Dashboard แสดงผล real-time
```

## Features

- **20 AI Agents** — 5 หมวด: CORE, TECH, CREATIVE, BIZ, FINANCE
- **Bird's Eye View** — มุมมองกล้องวงจรปิด เห็น agent ทำงาน real-time + confetti เมื่องานเสร็จ
- **3 ช่องทางสั่งงาน** — Dashboard (คลิก), Cowork (พิมพ์), Dispatch (มือถือ)
- **Agent Memory** — จำผลงานที่ผ่านมา ทำงานดีขึ้นเรื่อยๆ
- **Zero API Key** — ใช้ subscription ที่จ่ายอยู่แล้วผ่าน MCP
- **Dark Cyberpunk Theme** — UI มืดสวย monospace

## Screenshots

| Agents Grid | Bird's Eye View |
|:-----------:|:---------------:|
| หน้า /agents — คลิกสั่งงาน | หน้า /birdseye — CCTV floor plan |

## Quick Start

### Windows
```
ดับเบิ้ลคลิก setup.bat
```

### Mac / Linux
```bash
chmod +x setup.sh && ./setup.sh
```

### Manual
```bash
git clone https://github.com/YOUR_USERNAME/ClaudeAgent.git
cd ClaudeAgent
npm install
npm run seed        # สร้าง 20 agents
npm run mcp:build   # Build MCP Server
npm run dev         # http://localhost:3000
```

## Connect to Cowork

แก้ `claude_desktop_config.json`:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "claude-gank": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"],
      "cwd": "/absolute/path/to/ClaudeAgent"
    }
  }
}
```

Restart Claude Desktop → เปิด Cowork → พิมพ์ "ดูสถานะทีม"

> รายละเอียดทั้งหมดอยู่ใน [SETUP.md](SETUP.md)

## Agent Team (20 ตัว)

| Category | Agents | ทำอะไร |
|----------|--------|--------|
| **CORE** | เลขา, นักแปล, PM | รับงาน route, แปลภาษา, จัดการโปรเจค |
| **TECH** | Coder, SysAdmin, Automator, Prompt Eng, Data Scientist | เขียนโค้ด, DevOps, automation, ML/AI |
| **CREATIVE** | Course Designer, Content, Graphic, Creative, Video | คอร์ส, คอนเทนต์, กราฟิก, ไอเดีย, วิดีโอ |
| **BIZ** | Marketer, Strategist, Journalist, Legal | การตลาด, กลยุทธ์, วิจัย, กฎหมาย |
| **FINANCE** | Accountant, Gold Trader, Stock Analyst | บัญชี, ทอง, หุ้น |

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **Styling:** Tailwind CSS 4 (dark cyberpunk theme)
- **Database:** SQLite via better-sqlite3
- **MCP:** @modelcontextprotocol/sdk v1
- **AI Engine:** Claude Cowork (via MCP — no direct API calls)

## Project Structure

```
ClaudeAgent/
├── src/app/           # Next.js pages + API routes
├── src/components/    # React components (AgentCard, FloorPlan, etc.)
├── src/lib/           # Database, types, agent manager
├── mcp-server/        # MCP Server for Cowork (10 tools + 3 resources)
├── scripts/           # Seed script (20 agents)
├── setup.bat/.sh      # One-click setup
├── start.bat/.sh      # One-click start
├── SETUP.md           # Step-by-step setup guide
├── Cowork.md          # MCP tools reference
└── CLAUDE.md          # Project documentation
```

## Documentation

| File | Content |
|------|---------|
| [SETUP.md](SETUP.md) | ติดตั้งตั้งแต่ศูนย์ (10 ขั้นตอน) |
| [Cowork.md](Cowork.md) | MCP Tools reference + ตัวอย่างคำสั่ง |
| [CLAUDE.md](CLAUDE.md) | Architecture + DB schema + conventions |

## Requirements

- Node.js 18+
- Claude Desktop App
- Claude Subscription (Pro $20+ or Max $100+)

> ไม่ต้องมี API key — ทุกอย่างผ่าน Cowork subscription

## License

MIT License - [LICENSE](LICENSE)

---

**Powered by Mr.KKD**
