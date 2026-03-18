# Cowork.md — Claude Cowork & Dispatch Integration Guide

## แนวคิดหลัก

**ไม่ต้องใช้ API key** — Claude Cowork คือ AI Engine ของระบบ

```
เดิม:  Dashboard → API key → Claude API → ผลลัพธ์  (จ่ายซ้ำ!)
ใหม่:  Dashboard → PENDING mission → Cowork หยิบไปทำ → เขียนผลกลับ  (ใช้ subscription)
```

Cowork มี Claude อยู่ในตัวอยู่แล้ว — แค่ให้มันอ่าน agent context แล้วคิดเอง

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Dashboard  │────▶│  SQLite DB      │◀────│  MCP Server  │
│  (Next.js)  │     │  claude-gank.db │     │  (stdio)     │
│  :3000      │     │                 │     │              │
│             │     │  agents         │     │              │
│  สร้าง      │     │  missions ←──────────── Cowork       │
│  PENDING    │     │  messages       │     │  หยิบงาน     │
│  missions   │     │  memory         │     │  คิดเอง      │
│             │     │                 │     │  เขียนผลกลับ │
│  poll ทุก   │     │                 │     │              │
│  3 วินาที   │     │                 │     │              │
└─────────────┘     └─────────────────┘     └──────────────┘
                                                   ↑
                                            ┌──────┴──────┐
                                            │  Dispatch   │
                                            │  (Phone)    │
                                            └─────────────┘
```

## Setup

### Step 1: Build MCP Server

```bash
npm run mcp:build
```

### Step 2: เพิ่มใน Claude Desktop Config

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

### Step 3: Restart Claude Desktop

ปิดแล้วเปิดใหม่ → จะเห็น tools ของ claude-gank ใน Cowork

### Step 4: (แนะนำ) เปิด Dashboard

```bash
npm run dev    # http://localhost:3000
```

> Dashboard ไม่จำเป็น — MCP อ่าน/เขียน DB ตรงๆ ได้ แต่ถ้าเปิดจะเห็น UI real-time

## Workflow หลัก

### 1. สั่งงานผ่าน Cowork

```
คุณ: "ให้นักเขียนโค้ดสร้าง REST API สำหรับระบบสมาชิก"

Cowork:
  1. เรียก dispatch_mission(agent_id="coder", title="REST API", input="...")
  2. เรียก process_next_mission()  ← หยิบงาน + อ่าน agent context
  3. คิดคำตอบ (ใช้ subscription — ไม่ต้อง API key)
  4. เรียก complete_mission(mission_id="...", output="ผลลัพธ์")
```

### 2. Auto-Dispatch (เลขาเลือก agent)

```
คุณ: "ช่วยเขียนบทความเรื่อง AI trends"

Cowork:
  1. เรียก dispatch_mission ให้เลขา route
  2. อ่าน [AUTO-DISPATCH] context → เลือก content-creator
  3. เรียก dispatch_mission(agent_id="content-creator", ...)
  4. process_next_mission → คิด → complete_mission
```

### 3. สั่งจาก Dispatch (มือถือ)

```
Phone → "วิเคราะห์แนวโน้มราคาทอง"
  → Desktop Cowork รับ
  → เรียก dispatch_mission(agent_id="gold-trader")
  → process_next_mission → คิด → complete_mission
  → Phone เห็นผลลัพธ์
```

### 4. สั่งจาก Dashboard UI

```
เปิด Dashboard :3000 → คลิก agent → พิมพ์สั่งงาน → DEPLOY
  → สร้าง PENDING mission ลง DB
  → Cowork เรียก get_pending_missions → เห็นงาน
  → process_next_mission → คิด → complete_mission
  → Dashboard poll ทุก 3s → เห็นผลลัพธ์
```

## MCP Tools Reference

### Core Workflow Tools

#### `get_pending_missions`
ดู missions ที่รอ Cowork หยิบไปทำ (เรียงตาม priority แล้ว created_at)

```
ไม่มี parameters

Output: รายการ missions พร้อม agent info, priority, input
```

---

#### `process_next_mission`
หยิบ mission ถัดไป → mark RUNNING → คืน context ทั้งหมดที่ Cowork ต้องใช้

```
Parameters:
  mission_id (optional) — ระบุเจาะจง, ไม่ใส่ = หยิบตาม priority

Output:
  - Agent system_prompt + personality
  - Agent memories (20 ล่าสุด)
  - Mission input (task details)
  - คำแนะนำให้ใช้ complete_mission เขียนผลกลับ
```

**สิ่งที่เกิดขึ้นใน DB:**
- Mission status: `PENDING → RUNNING`
- Agent status: `STANDBY → WORKING`

---

#### `complete_mission`
เขียนผลลัพธ์กลับ + save memory + set agent กลับ STANDBY

```
Parameters:
  mission_id (required) — ID ของ mission
  output (required) — ผลลัพธ์ที่ Cowork สร้างขึ้น
  memory_key (optional) — ชื่อสิ่งที่ต้องจำ
  memory_value (optional) — เนื้อหาที่ต้องจำ

สิ่งที่เกิดขึ้น:
  - Mission: RUNNING → COMPLETED, output saved
  - Agent: WORKING → STANDBY
  - Memory: auto-save output 500 chars + custom memory (ถ้าระบุ)
  - Message: RESULT logged
```

---

#### `fail_mission`
บันทึกว่า mission ล้มเหลว

```
Parameters:
  mission_id (required)
  reason (required) — สาเหตุ
```

---

### Management Tools

#### `list_agents`
```
Output: [CATEGORY] ชื่อ (id) — role | STATUS · model
```

#### `get_agent`
```
Parameters: agent_id
Output: agent details + 5 missions ล่าสุด + 10 memories ล่าสุด
```

#### `dispatch_mission`
สร้าง PENDING mission ใหม่ (ยังไม่ทำ — รอ process_next_mission)

```
Parameters: agent_id, title, input, priority (default: NORMAL)
```

#### `team_status`
```
Output: จำนวน agents, missions แยกตาม status, ใครทำอะไรอยู่
```

#### `send_message`
```
Parameters: from_agent_id, to_agent_id (optional=broadcast), content, type
```

#### `get_mission_result`
```
Parameters: mission_id
Output: full mission data as JSON
```

## MCP Resources

| URI | Description |
|-----|-------------|
| `claude-gank://agents` | JSON agents ทั้งหมด |
| `claude-gank://pending-missions` | JSON missions ที่รอทำ (พร้อม system_prompt) |
| `claude-gank://missions` | JSON missions ล่าสุด 50 รายการ |

## Agent IDs

| ID | Agent | Category |
|----|-------|----------|
| `secretary` | เลขา | CORE |
| `coder` | นักเขียนโค้ด | TECH |
| `sysadmin` | ผู้ดูแลระบบ | TECH |
| `automator` | นักสร้างออโตเมชัน | TECH |
| `prompt-eng` | นักออกแบบ Prompt | TECH |
| `course-designer` | นักออกแบบคอร์ส | CREATIVE |
| `content-creator` | นักสร้างคอนเทนต์ | CREATIVE |
| `graphic` | กราฟฟิค | CREATIVE |
| `creative` | ครีเอทีฟ | CREATIVE |
| `marketer` | นักการตลาด | BIZ |
| `strategist` | นักวางกลยุทธ์ | BIZ |
| `journalist` | นักข่าว | BIZ |
| `accountant` | นักบัญชี | FINANCE |
| `gold-trader` | นักเทรดทอง | FINANCE |
| `stock-analyst` | นักวิเคราะห์หุ้น | FINANCE |

## ตัวอย่างคำสั่งใน Cowork / Dispatch

```
"ดูสถานะทีม"
→ team_status

"มีงานอะไรรอทำบ้าง"
→ get_pending_missions

"หยิบงานถัดไปมาทำ"
→ process_next_mission

"ให้นักเขียนโค้ดสร้าง API สำหรับ user auth"
→ dispatch_mission + process_next_mission + complete_mission

"เขียนบทความเรื่อง AI สำหรับธุรกิจ"
→ dispatch_mission (เลขา) → dispatch_mission (content-creator) → process + complete

"วิเคราะห์แนวโน้มราคาทองสัปดาห์นี้"
→ dispatch_mission(agent_id="gold-trader") → process + complete

"ส่งข้อความให้ทุกคนว่าพรุ่งนี้มี sprint review"
→ send_message(from="secretary", broadcast)
```

## Troubleshooting

### MCP Server ไม่ขึ้นใน Cowork
- `npm run mcp:build` แล้วหรือยัง?
- path ใน config เป็น absolute path?
- `claude-gank.db` มีอยู่? (`npm run seed`)
- Restart Claude Desktop?

### Mission ค้าง PENDING
- Cowork ยังไม่ได้หยิบ — สั่ง "มีงานอะไรรอทำบ้าง" แล้วใช้ process_next_mission

### Agent ค้าง WORKING
- Mission อาจล้มเหลวกลางทาง
- ใช้ fail_mission เพื่อ reset หรือ PATCH /api/agents/:id `{ "status": "STANDBY" }`

### Dashboard ไม่เห็นผลลัพธ์
- Dashboard poll ทุก 3 วินาที — รอสักครู่
- Cowork ใช้ complete_mission เขียนผลกลับแล้วหรือยัง?
