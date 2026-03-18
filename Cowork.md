# Cowork.md — Claude Cowork & Dispatch Integration Guide

## Overview

Claude GANK สามารถเชื่อมต่อกับ Claude Desktop (Cowork / Dispatch) ผ่าน **MCP Server**
ทำให้สั่งงานทีม AI ได้จากทุกที่ — ผ่าน Cowork บน Desktop หรือ Dispatch จากมือถือ

```
Phone (Dispatch) → Claude Desktop (Cowork) → MCP Server → Dashboard API → AI Engine
                                                  ↕
                                            SQLite Database
                                                  ↕
                                          Dashboard UI (real-time)
```

## Setup — เชื่อม Cowork กับ Dashboard

### Step 1: Build MCP Server

```bash
cd /path/to/ClaudeAgent
npm run mcp:build
```

### Step 2: เพิ่ม MCP Server ใน Claude Desktop

แก้ไขไฟล์ `claude_desktop_config.json`:

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

ปิดแล้วเปิด Claude Desktop ใหม่ — จะเห็น tools ของ claude-gank ใน Cowork

### Step 4: (Optional) เปิด Dashboard สำหรับ real-time UI

```bash
npm run dev    # http://localhost:3000
```

> Dashboard ไม่จำเป็นต้องเปิด — MCP Server สามารถเขียนลง DB ตรงๆ ได้
> แต่ถ้าเปิดไว้จะได้ real-time streaming + UI visualization

## MCP Tools ที่ใช้ได้ใน Cowork

### 1. `list_agents`
แสดงรายชื่อ agent ทั้งหมดในทีม พร้อมสถานะและ model

**Parameters:** ไม่มี

**ตัวอย่างการใช้ใน Cowork:**
> "ดูรายชื่อทีมทั้งหมด"

**Output:**
```
Agent Team (15 members):

[CORE] เลขา (secretary) — รับงาน วิเคราะห์ ส่งต่อคนที่ใช่ | STANDBY · sonnet
[TECH] นักเขียนโค้ด (coder) — เขียนโค้ด debug แก้ปัญหาเทคนิค | STANDBY · opus
...
```

---

### 2. `get_agent`
ดูรายละเอียดของ agent ตัวที่ระบุ พร้อม missions ล่าสุดและ memories

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| agent_id | string | ID ของ agent (e.g. "coder", "secretary") |

**ตัวอย่าง:**
> "ดูรายละเอียดของนักเขียนโค้ด"

---

### 3. `dispatch_mission`
สั่งงาน (mission) ให้ agent ตัวที่ระบุ — ถ้า Dashboard เปิดอยู่จะ stream ผ่าน API, ถ้าไม่เปิดจะเขียนลง DB รอประมวลผล

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| agent_id | string | Yes | ID ของ agent ที่จะรับงาน |
| title | string | Yes | ชื่องาน |
| input | string | Yes | รายละเอียดงาน |
| priority | enum | No | LOW / NORMAL / HIGH / URGENT (default: NORMAL) |

**ตัวอย่าง:**
> "ให้นักเขียนโค้ดสร้าง REST API สำหรับระบบสมาชิก ด้วย Express + TypeScript"

→ Cowork จะเรียก `dispatch_mission` พร้อม agent_id="coder"

---

### 4. `auto_dispatch`
สั่งงานโดยไม่ต้องระบุ agent — เลขา (secretary) จะวิเคราะห์งานแล้วส่งต่อให้คนที่เหมาะสมอัตโนมัติ

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| title | string | Yes | ชื่องาน |
| input | string | Yes | รายละเอียดงาน |
| priority | enum | No | LOW / NORMAL / HIGH / URGENT |

**ตัวอย่าง:**
> "ช่วยเขียนบทความเรื่อง AI trends 2026"

→ Cowork เรียก `auto_dispatch` → เลขาวิเคราะห์ → ส่งต่อให้ "นักสร้างคอนเทนต์"

**Flow:**
1. เลขารับ routing prompt พร้อม agent catalog
2. เลขาตอบ agent ID ที่เหมาะสม
3. Mission ถูก delegate ไปยัง agent ที่เลือก
4. Agent ประมวลผลและส่งผลกลับ

---

### 5. `team_status`
ดูสถานะรวมของทีม — ใครทำอะไรอยู่ งานค้างกี่ชิ้น

**Parameters:** ไม่มี

**ตัวอย่าง:**
> "ตอนนี้ทีมสถานะเป็นยังไง"

**Output:**
```
Team Status:
━━━━━━━━━━━━━━━━━━━━
Agents: 15 total (2 working, 12 standby, 1 error)
Missions: 47 total (2 running, 3 pending, 40 completed)

Currently Working:
  - นักเขียนโค้ด (TECH)
  - นักสร้างคอนเทนต์ (CREATIVE)
```

---

### 6. `get_mission_result`
ดูผลลัพธ์ของ mission ที่ระบุ

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| mission_id | string | ID ของ mission (UUID) |

**ตัวอย่าง:**
> "ดูผลงานของ mission ล่าสุดที่สั่งไป"

---

### 7. `send_message`
ส่งข้อความระหว่าง agents ผ่าน message bus

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| from_agent_id | string | Yes | ID ผู้ส่ง |
| to_agent_id | string | No | ID ผู้รับ (ไม่ใส่ = broadcast) |
| content | string | Yes | เนื้อหาข้อความ |
| type | enum | No | CHAT / TASK / RESULT / SYSTEM |

## MCP Resources

นอกจาก tools ยังมี resources ที่ Cowork อ่านได้:

| URI | Description |
|-----|-------------|
| `claude-gank://agents` | JSON ข้อมูล agent ทั้งหมด |
| `claude-gank://missions` | JSON missions ล่าสุด 50 รายการ |

## Dispatch — สั่งงานจากมือถือ

### Prerequisites
1. Claude Desktop เปิดอยู่บนเครื่อง (MCP Server ต้องรันได้)
2. Pair มือถือกับ Desktop ผ่าน QR code (Cowork → Dispatch)
3. (แนะนำ) `npm run dev` เปิด Dashboard ไว้สำหรับ real-time processing

### ตัวอย่างคำสั่งจาก Dispatch

```
"ดูสถานะทีม"
→ team_status

"ให้นักเขียนโค้ดสร้าง API endpoint สำหรับ user authentication"
→ dispatch_mission(agent_id="coder", ...)

"เขียนบทความเรื่อง AI สำหรับธุรกิจ"
→ auto_dispatch → เลขา routes → นักสร้างคอนเทนต์

"วิเคราะห์แนวโน้มราคาทองสัปดาห์นี้"
→ auto_dispatch → เลขา routes → นักเทรดทอง

"ส่งข้อความให้ทุกคนในทีมว่าพรุ่งนี้มี sprint review"
→ send_message(from="secretary", content="...", broadcast)
```

### Workflow: Phone → Desktop → Dashboard

```
1. [Phone] พิมพ์: "ให้นักข่าวสรุปข่าว AI วันนี้"
2. [Desktop] Cowork รับคำสั่ง → เรียก dispatch_mission
3. [MCP Server] ส่ง POST http://localhost:3000/api/missions
4. [Dashboard] AgentManager → AI Engine → Claude API (streaming)
5. [DB] Save mission output + memory
6. [Phone] Dispatch แสดงผลลัพธ์
7. [Dashboard] UI อัปเดต real-time (agent status, mission log)
```

## Agent IDs Reference

ใช้ IDs เหล่านี้กับ `dispatch_mission` และ `send_message`:

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

## Troubleshooting

### MCP Server ไม่ขึ้นใน Cowork
- ตรวจสอบว่า build แล้ว: `npm run mcp:build`
- ตรวจสอบ path ใน `claude_desktop_config.json` เป็น absolute path
- ตรวจสอบว่า `claude-gank.db` มีอยู่: `npm run seed`
- Restart Claude Desktop หลังแก้ config

### dispatch_mission ไม่ทำงาน
- ตรวจสอบว่า Dashboard เปิดอยู่: `npm run dev`
- ตรวจสอบ `ANTHROPIC_API_KEY` ใน `.env`
- ถ้า Dashboard ไม่เปิด mission จะถูก queue ลง DB (status: PENDING)

### Agent ค้าง WORKING
- เกิดจาก API call ค้างหรือ error ที่ไม่ได้ handle
- แก้ไข: `PATCH /api/agents/:id` body `{ "status": "STANDBY" }`
- หรือจาก Cowork: ใช้ get_agent เช็คแล้ว dispatch mission ใหม่

### Memory เต็ม
- Memory auto-save 500 chars ต่อ mission
- ลบ memory เก่าได้โดยตรงจาก SQLite: `DELETE FROM memory WHERE agent_id = ? AND created_at < ?`
