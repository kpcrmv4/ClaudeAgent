# CLAUDE.md — Claude GANK Command Center

## Project Overview

Multi-Agent AI Dashboard ที่ควบคุม AI agents 20 ตัวจาก dashboard เดียว
ประมวลผลทั้งหมดผ่าน **Claude Cowork** (ใช้ subscription ที่จ่ายอยู่แล้ว — ไม่ต้องใช้ API key)

```
User → Dashboard (Next.js) → สร้าง Mission (PENDING) → SQLite
                                                            ↕
Phone → Dispatch → Cowork → MCP Server → หยิบงาน → คิดเอง → เขียนผลกลับ
                                                            ↕
                                                    Dashboard UI (poll ทุก 3s)
```

## Quick Start

```bash
npm install              # ติดตั้ง dependencies
npm run seed             # สร้าง 20 agents (เพิ่มใหม่อัตโนมัติถ้ามีอยู่แล้ว)
npm run dev              # Dashboard → http://localhost:3000
npm run mcp:build        # Build MCP Server สำหรับ Cowork
```

> ไม่ต้องตั้ง API key — ทุกอย่างผ่าน Cowork subscription

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **Styling:** Tailwind CSS 4 (dark cyberpunk theme, monospace)
- **Database:** SQLite via better-sqlite3 (WAL mode, foreign keys)
- **MCP:** @modelcontextprotocol/sdk v1 (stdio transport)
- **AI Engine:** Claude Cowork (ผ่าน MCP — ไม่มี direct API call)

## Architecture — Cowork-Powered

**เดิม (ต้อง API key):**
Dashboard → Anthropic SDK → Claude API → ผลลัพธ์

**ใหม่ (ใช้ subscription):**
1. Dashboard/MCP สร้าง mission ลง DB → status: `PENDING`
2. Cowork เรียก `process_next_mission` → อ่าน agent context + memories
3. Cowork คิดคำตอบเอง (ใช้ subscription)
4. Cowork เรียก `complete_mission` → เขียนผลกลับลง DB
5. Dashboard poll ทุก 3 วินาที → แสดงผลลัพธ์

## Project Structure

```
src/
├── app/
│   ├── agents/page.tsx         # Agent Grid — คลิกเปิด MissionPanel สั่งงาน
│   ├── birdseye/page.tsx       # Bird's Eye View — CCTV floor plan + dispatch
│   ├── war-room/page.tsx       # War Room — ภาพรวมทีม + Auto-Dispatch
│   ├── comms/page.tsx          # Comms — message bus ระหว่าง agents
│   ├── missions/page.tsx       # Mission Logs ทั้งหมด
│   ├── system/page.tsx         # System Info + MCP Config
│   ├── api/agents/route.ts     # GET list, POST create
│   ├── api/agents/[id]/route.ts
│   ├── api/missions/route.ts   # GET list, POST dispatch (creates PENDING)
│   ├── api/missions/[id]/route.ts
│   └── api/messages/route.ts
├── components/
│   ├── Sidebar.tsx
│   ├── AgentCard.tsx            # Card with SVG pixel avatar + status
│   ├── MissionPanel.tsx         # Modal — สั่งงาน + ดูผลลัพธ์ (polling)
│   ├── DeployAgentModal.tsx     # Modal — สร้าง agent ใหม่
│   ├── FloorPlan.tsx            # SVG office floor plan with zones + desks
│   ├── BirdEyeAgent.tsx         # SVG pixel character with state animations
│   ├── MessageLine.tsx          # Dashed lines between communicating agents
│   └── Particles.tsx            # Confetti/sparkle/smoke effects
├── lib/
│   ├── types.ts                 # Agent, Mission, Message, Memory, Skill
│   ├── db.ts                    # SQLite schema + CRUD (5 tables)
│   └── agent-manager.ts        # dispatchMission, autoDispatchMission (DB-only)
mcp-server/
│   └── src/index.ts             # MCP Server v2 — 10 tools + 3 resources
scripts/
│   └── seed.ts                  # Seed 20 agents (auto-adds new agents to existing DB)
```

## Database Schema

| Table | Key Columns |
|-------|-------------|
| agents | id, name, role, category, model, status, system_prompt, personality, effort_level, skills |
| missions | id, title, agent_id, status, priority, input, output, parent_mission_id |
| messages | id, from_agent_id, to_agent_id, type, content, mission_id |
| memory | id, agent_id, key, value, mission_id |
| skills | id, name, description, instructions |

**Status flows:**
- Agent: `STANDBY → WORKING → STANDBY` (หรือ `→ ERROR`)
- Mission: `PENDING → RUNNING → COMPLETED` (หรือ `→ FAILED`)

## Agent Team (20 ตัว)

| ID | Name | Cat | Model | Role |
|----|------|-----|-------|------|
| secretary | เลขา | CORE | sonnet | รับงาน วิเคราะห์ ส่งต่อ |
| translator | นักแปล | CORE | sonnet | แปลภาษา TH↔EN↔JP↔CN |
| project-mgr | ผู้จัดการโปรเจค | CORE | sonnet | จัดลำดับงาน ติดตาม deadline |
| coder | นักเขียนโค้ด | TECH | opus | เขียนโค้ด debug |
| sysadmin | ผู้ดูแลระบบ | TECH | opus | server, DevOps |
| automator | นักสร้างออโตเมชัน | TECH | opus | workflow อัตโนมัติ |
| prompt-eng | นักออกแบบ Prompt | TECH | sonnet | prompt engineering |
| data-scientist | นักวิทยาศาสตร์ข้อมูล | TECH | opus | ML, data pipeline, AI |
| course-designer | นักออกแบบคอร์ส | CREATIVE | sonnet | หลักสูตรออนไลน์ |
| content-creator | นักสร้างคอนเทนต์ | CREATIVE | sonnet | คอนเทนต์ทุกรูปแบบ |
| graphic | กราฟฟิค | CREATIVE | sonnet | กราฟิก, UI/UX |
| creative | ครีเอทีฟ | CREATIVE | sonnet | ไอเดียสร้างสรรค์ |
| video-producer | โปรดิวเซอร์วิดีโอ | CREATIVE | sonnet | storyboard, production |
| marketer | นักการตลาด | BIZ | sonnet | การตลาดดิจิทัล |
| strategist | นักวางกลยุทธ์ | BIZ | opus | กลยุทธ์ธุรกิจ |
| journalist | นักข่าว | BIZ | sonnet | วิจัย สรุปข่าว |
| legal-advisor | ที่ปรึกษากฎหมาย | BIZ | opus | สัญญา PDPA กฎหมายธุรกิจ |
| accountant | นักบัญชี | FINANCE | opus | บัญชี การเงิน |
| gold-trader | นักเทรดทอง | FINANCE | opus | ตลาดทองคำ |
| stock-analyst | นักวิเคราะห์หุ้น | FINANCE | opus | หุ้น ตลาดหลักทรัพย์ |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/agents | รายชื่อ agents |
| GET | /api/agents?stats=true | สถิติระบบ |
| POST | /api/agents | สร้าง agent ใหม่ |
| GET | /api/agents/:id | รายละเอียด + missions + memories |
| PATCH | /api/agents/:id | อัปเดต agent |
| GET | /api/missions | รายการ missions |
| POST | /api/missions | สร้าง PENDING mission |
| GET | /api/missions/:id | รายละเอียด mission |
| PATCH | /api/missions/:id | อัปเดต mission |
| GET | /api/messages | รายการ messages |
| POST | /api/messages | ส่งข้อความ |

POST /api/missions body:
- `{ agentId, title, input, priority }` → direct dispatch
- `{ title, input, auto: true }` → auto-dispatch ผ่านเลขา

## MCP Server Tools (10 tools)

### Core Workflow (Cowork ใช้ทำงาน)
1. `get_pending_missions` — ดูงานที่รอทำ
2. `process_next_mission` — หยิบงาน + รับ context (system_prompt, memories)
3. `complete_mission` — เขียนผลลัพธ์กลับ + save memory
4. `fail_mission` — บันทึกว่างานล้มเหลว

### Management
5. `list_agents` — ดูทีมทั้งหมด
6. `get_agent` — รายละเอียด agent
7. `dispatch_mission` — สร้าง PENDING mission
8. `team_status` — สถานะรวมทีม
9. `send_message` — ส่งข้อความระหว่าง agents
10. `get_mission_result` — ดูผลลัพธ์ mission

## Conventions

- Category colors: CORE=green, TECH=cyan, CREATIVE=purple, BIZ=red, FINANCE=amber
- Agent IDs: lowercase kebab-case (e.g., `content-creator`)
- Database: `claude-gank.db` (root dir, gitignored)
- All components are "use client" (client-side rendering + polling)
- API returns `{ success: boolean, data?, error?, message? }`
- Memory auto-saved: top 500 chars of mission output

## Scripts

```bash
npm run dev          # Dev server (:3000)
npm run build        # Production build
npm run seed         # Seed 15 agents
npm run mcp:build    # Compile MCP server
npm run mcp:start    # Run MCP server (stdio)
```
