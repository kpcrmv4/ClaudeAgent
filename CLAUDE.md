# CLAUDE.md — Claude GANK Command Center

## Project Overview

Multi-Agent AI Dashboard ที่ควบคุม AI agents 15 ตัวจาก dashboard เดียว
สร้างด้วย Next.js 16 (App Router) + SQLite + Anthropic Claude API + MCP Server

```
User → Dashboard (Next.js) → AgentManager → AI Engine (Claude API) → ผลลัพธ์
                                    ↕
                              SQLite (agents, missions, memory, messages, skills)
                                    ↕
                              MCP Server → Claude Desktop Cowork / Dispatch
```

## Quick Start

```bash
# 1. ติดตั้ง
npm install

# 2. ตั้ง API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# 3. Seed 15 agents
npm run seed

# 4. รัน Dashboard
npm run dev          # http://localhost:3000

# 5. Build MCP Server (สำหรับ Cowork)
npm run mcp:build
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS 4 (dark cyberpunk theme)
- **Database:** SQLite via better-sqlite3 (WAL mode)
- **AI Engine:** @anthropic-ai/sdk (Claude Opus 4.6 / Sonnet 4.6 / Haiku 4.5)
- **MCP:** @modelcontextprotocol/sdk (stdio transport)
- **Build:** TypeScript 5, PostCSS

## Project Structure

```
src/
├── app/
│   ├── agents/page.tsx         # Agent Grid — เลือก agent, สั่ง mission
│   ├── war-room/page.tsx       # War Room — ภาพรวมทีม, auto-dispatch
│   ├── comms/page.tsx          # Comms — message bus ระหว่าง agents
│   ├── missions/page.tsx       # Missions — ดู mission logs ทั้งหมด
│   ├── system/page.tsx         # System — config, MCP setup guide
│   ├── api/agents/route.ts     # GET /api/agents, POST /api/agents
│   ├── api/agents/[id]/route.ts
│   ├── api/missions/route.ts   # GET /api/missions, POST (dispatch/auto)
│   ├── api/missions/[id]/route.ts
│   └── api/messages/route.ts   # GET /api/messages, POST /api/messages
├── components/
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── AgentCard.tsx           # Agent card with pixel avatar + status
│   ├── MissionPanel.tsx        # Modal — สั่งงาน agent + stream output
│   └── DeployAgentModal.tsx    # Modal — สร้าง agent ใหม่
├── lib/
│   ├── types.ts                # Agent, Mission, Message, Memory, Skill types
│   ├── db.ts                   # SQLite schema + CRUD functions
│   ├── ai-engine.ts            # Claude API streaming + memory injection
│   └── agent-manager.ts        # dispatchMission, autoDispatch, teamOverview
mcp-server/
│   └── src/index.ts            # MCP Server — 7 tools + 2 resources
scripts/
│   └── seed.ts                 # Seed 15 agents ลง SQLite
```

## Database Schema (SQLite)

5 tables: `agents`, `missions`, `messages`, `memory`, `skills`

### agents
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | e.g. "coder", "secretary" |
| name | TEXT | ชื่อไทย e.g. "นักเขียนโค้ด" |
| role | TEXT | บทบาท |
| category | TEXT | CORE / TECH / CREATIVE / BIZ / FINANCE |
| model | TEXT | opus / sonnet / haiku |
| status | TEXT | STANDBY / WORKING / ERROR / OFFLINE |
| personality | TEXT | ลักษณะนิสัย |
| system_prompt | TEXT | Prompt หลักของ agent |
| effort_level | TEXT | low / medium / high |
| skills | TEXT | JSON array of skill IDs |

### missions
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| title | TEXT | ชื่องาน |
| agent_id | TEXT FK | agent ที่รับผิดชอบ |
| status | TEXT | PENDING / RUNNING / COMPLETED / FAILED / CANCELLED |
| priority | TEXT | LOW / NORMAL / HIGH / URGENT |
| input | TEXT | คำสั่งที่ส่งให้ agent |
| output | TEXT | ผลลัพธ์จาก AI |
| parent_mission_id | TEXT FK | mission แม่ (สำหรับ auto-dispatch chain) |

### messages
| Column | Type | Description |
|--------|------|-------------|
| from_agent_id | TEXT FK | ผู้ส่ง |
| to_agent_id | TEXT FK | ผู้รับ (null = broadcast) |
| type | TEXT | CHAT / TASK / RESULT / SYSTEM |
| content | TEXT | เนื้อหาข้อความ |

### memory
| Column | Type | Description |
|--------|------|-------------|
| agent_id | TEXT FK | เจ้าของ memory |
| key | TEXT | ชื่อ memory |
| value | TEXT | เนื้อหา (auto-saved จาก mission output, max 500 chars) |

## Agent Team (15 ตัว)

| ID | Name | Category | Model | Role |
|----|------|----------|-------|------|
| secretary | เลขา | CORE | sonnet | รับงาน วิเคราะห์ ส่งต่อคนที่ใช่ |
| coder | นักเขียนโค้ด | TECH | opus | เขียนโค้ด debug แก้ปัญหาเทคนิค |
| sysadmin | ผู้ดูแลระบบ | TECH | opus | จัดการ server, infra, DevOps |
| automator | นักสร้างออโตเมชัน | TECH | opus | สร้าง workflow อัตโนมัติ |
| prompt-eng | นักออกแบบ Prompt | TECH | sonnet | ออกแบบ prompt สำหรับ AI |
| course-designer | นักออกแบบคอร์ส | CREATIVE | sonnet | ออกแบบหลักสูตรและเนื้อหาการเรียนรู้ |
| content-creator | นักสร้างคอนเทนต์ | CREATIVE | sonnet | สร้างคอนเทนต์ทุกรูปแบบ |
| graphic | กราฟฟิค | CREATIVE | sonnet | ออกแบบกราฟิกและ visual |
| creative | ครีเอทีฟ | CREATIVE | sonnet | คิดไอเดียสร้างสรรค์ |
| marketer | นักการตลาด | BIZ | sonnet | วางแผนการตลาดดิจิทัล |
| strategist | นักวางกลยุทธ์ | BIZ | opus | วางกลยุทธ์ธุรกิจ |
| journalist | นักข่าว | BIZ | sonnet | วิจัย เขียนรายงาน สรุปข่าว |
| accountant | นักบัญชี | FINANCE | opus | จัดการบัญชีและการเงิน |
| gold-trader | นักเทรดทอง | FINANCE | opus | วิเคราะห์ตลาดทองคำ |
| stock-analyst | นักวิเคราะห์หุ้น | FINANCE | opus | วิเคราะห์หุ้นและตลาดหลักทรัพย์ |

## Core Flows

### Direct Dispatch
```
User → POST /api/missions { agentId, title, input } → AgentManager.dispatchMission()
  → AI Engine: buildSystemPrompt(agent + memories) → Claude API (streaming)
  → Save output to missions table + Save memory → Return streamed result
```

### Auto-Dispatch (Secretary Routing)
```
User → POST /api/missions { input, auto: true } → AgentManager.autoDispatch()
  → Secretary agent analyzes task + picks best agent from catalog
  → Delegates mission to chosen agent → Agent executes → Return result
```

### Agent-to-Agent Delegation
```
AgentA → delegateTask(fromAgent, toAgent, task) → creates TASK message
  → Executes on toAgent with "[Delegated from AgentA]: task" prefix
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/agents | รายชื่อ agents ทั้งหมด |
| GET | /api/agents?stats=true | สถิติระบบ |
| POST | /api/agents | สร้าง agent ใหม่ |
| GET | /api/agents/:id | รายละเอียด agent + missions + memories |
| PATCH | /api/agents/:id | อัปเดต agent |
| GET | /api/missions | รายการ missions (limit 50) |
| POST | /api/missions | Dispatch mission (streaming response) |
| GET | /api/missions/:id | รายละเอียด mission |
| PATCH | /api/missions/:id | อัปเดต mission |
| GET | /api/messages | รายการ messages |
| POST | /api/messages | ส่งข้อความ |

## AI Engine Details

- Models: `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`
- Streaming: `anthropic.messages.stream()` with `onChunk` callback
- System prompt = agent.system_prompt + memories + identity + instructions
- Memory: auto-saved top 500 chars of output per mission
- Max tokens: 8192

## Development Guidelines

- ใช้ TypeScript strict mode ทุกไฟล์
- UI ใช้ dark theme (bg-dark: #0a0e17) กับ monospace font
- Category colors: CORE=green, TECH=cyan, CREATIVE=purple, BIZ=red, FINANCE=amber
- Database file: `claude-gank.db` (root directory, gitignored)
- Environment: `.env` with `ANTHROPIC_API_KEY`
- ไม่มี ORM — ใช้ better-sqlite3 raw SQL ตรงๆ
- Components ทุกตัวเป็น client components ("use client") ยกเว้น layout

## Scripts

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run seed         # Seed 15 agents into DB
npm run mcp:build    # Compile MCP server (TypeScript → dist/)
npm run mcp:start    # Run MCP server (stdio)
```
