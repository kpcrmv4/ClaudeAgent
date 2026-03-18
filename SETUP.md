# SETUP.md — ติดตั้งตั้งแต่ศูนย์จนใช้งานได้

## สิ่งที่ต้องมี (Prerequisites)

| สิ่งที่ต้องมี | ทำไม | เช็คยังไง |
|---------------|------|-----------|
| Node.js 18+ | รัน Next.js + MCP Server | `node -v` |
| npm | จัดการ packages | `npm -v` |
| Claude Desktop App | รัน Cowork + MCP | ดาวน์โหลดจาก claude.com/download |
| Claude Subscription | Pro ($20) หรือ Max ($100+) | เปิด Claude Desktop ดู plan |
| Git | clone โปรเจค | `git clone ...` |

> ไม่ต้องมี API key — ระบบใช้ Cowork subscription ที่จ่ายอยู่แล้ว

---

## STEP 1: Clone โปรเจค

```bash
git clone <repo-url> ClaudeAgent
cd ClaudeAgent
```

---

## STEP 2: ติดตั้ง Dependencies

```bash
npm install
```

จะติดตั้ง: next, react, tailwindcss, better-sqlite3, @modelcontextprotocol/sdk, zod, uuid, tsx ฯลฯ

---

## STEP 3: สร้าง Database + Seed 15 Agents

```bash
npm run seed
```

Output ที่ควรเห็น:
```
Seeding 15 agents...
  ✓ เลขา (CORE)
  ✓ นักเขียนโค้ด (TECH)
  ✓ ผู้ดูแลระบบ (TECH)
  ✓ นักสร้างออโตเมชัน (TECH)
  ✓ นักออกแบบ Prompt (TECH)
  ✓ นักออกแบบคอร์ส (CREATIVE)
  ✓ นักสร้างคอนเทนต์ (CREATIVE)
  ✓ กราฟฟิค (CREATIVE)
  ✓ ครีเอทีฟ (CREATIVE)
  ✓ นักการตลาด (BIZ)
  ✓ นักวางกลยุทธ์ (BIZ)
  ✓ นักข่าว (BIZ)
  ✓ นักบัญชี (FINANCE)
  ✓ นักเทรดทอง (FINANCE)
  ✓ นักวิเคราะห์หุ้น (FINANCE)
Done! 15 agents created.
```

จะสร้างไฟล์ `claude-gank.db` ที่ root ของโปรเจค

---

## STEP 4: ทดสอบ Dashboard

```bash
npm run dev
```

เปิด browser → **http://localhost:3000**

ควรเห็น:
- หน้า AGENTS — 15 agent cards แบ่งตาม category
- Sidebar ซ้าย: AGENTS, WAR ROOM, COMMS, MISSIONS, SYSTEM
- คลิก agent card → เปิด Mission Panel → พิมพ์สั่งงาน → DEPLOY
- Mission จะเป็น PENDING (รอ Cowork หยิบไปทำ)

> ถ้าเห็นหน้านี้ = Dashboard พร้อมใช้งาน ปิด dev server ได้ก่อน (Ctrl+C)

---

## STEP 5: Build MCP Server

```bash
npm run mcp:build
```

จะ compile TypeScript → `mcp-server/dist/index.js`

ทดสอบว่า build สำเร็จ:
```bash
ls mcp-server/dist/index.js
# ควรเห็นไฟล์
```

---

## STEP 6: เชื่อม MCP Server กับ Claude Desktop

### 6.1 หา path เต็มของโปรเจค

```bash
pwd
# เช่น /Users/yourname/Projects/ClaudeAgent
```

### 6.2 แก้ไข Claude Desktop Config

**macOS:**
```bash
# เปิดไฟล์ config
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```
# เปิด file path นี้
%APPDATA%\Claude\claude_desktop_config.json
```

### 6.3 เพิ่ม MCP Server Config

ถ้าไฟล์ว่าง/ไม่มี ให้สร้างใหม่:

```json
{
  "mcpServers": {
    "claude-gank": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"],
      "cwd": "/Users/yourname/Projects/ClaudeAgent"
    }
  }
}
```

ถ้ามี mcpServers อยู่แล้ว ให้เพิ่ม `"claude-gank"` เข้าไป:

```json
{
  "mcpServers": {
    "existing-server": { ... },
    "claude-gank": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"],
      "cwd": "/Users/yourname/Projects/ClaudeAgent"
    }
  }
}
```

> **สำคัญ:** `cwd` ต้องเป็น absolute path ที่ถูกต้อง (ตาม Step 6.1)

### 6.4 Restart Claude Desktop

ปิด Claude Desktop ทั้งหมด (Quit) แล้วเปิดใหม่

---

## STEP 7: ทดสอบใน Cowork

### 7.1 เปิด Cowork

Claude Desktop → เปิด Cowork (ถ้ายังไม่เคยเปิด จะอยู่ใน menu)

### 7.2 เช็คว่า MCP เชื่อมต่อสำเร็จ

พิมพ์ใน Cowork:

```
ดูสถานะทีม
```

ถ้า MCP ทำงาน Cowork จะเรียก `team_status` แล้วตอบ:

```
Team Status:
━━━━━━━━━━━━━━━━━━━━
Agents: 15 total (0 working, 15 standby)
Missions: 0 total (0 pending, 0 running, 0 completed, 0 failed)
```

### 7.3 ทดสอบดูรายชื่อ

```
แสดงรายชื่อทีมทั้งหมด
```

ควรเห็น 15 agents แบ่งตาม category

---

## STEP 8: ทดสอบสั่งงานจริง

### 8.1 เปิด Dashboard (ในอีก terminal)

```bash
npm run dev
```

### 8.2 สั่งงานใน Cowork

```
ให้นักสร้างคอนเทนต์เขียน caption Instagram 3 แบบ เรื่อง AI กับธุรกิจ
```

Cowork จะ:
1. เรียก `dispatch_mission` → สร้าง PENDING mission
2. เรียก `process_next_mission` → อ่าน agent context
3. คิดคำตอบ (ใช้ subscription)
4. เรียก `complete_mission` → เขียนผลกลับ DB

### 8.3 ดูผลใน Dashboard

เปิด http://localhost:3000/missions → จะเห็น mission ที่เสร็จแล้ว

หรือคลิก agent "นักสร้างคอนเทนต์" → เห็นผลงานใน Mission Panel

---

## STEP 9: (Optional) ตั้ง Dispatch — สั่งจากมือถือ

### 9.1 อัปเดต Claude App บนมือถือ

ดาวน์โหลด/อัปเดต Claude App (iOS/Android)

### 9.2 Pair

Claude Desktop → Cowork → Dispatch → สแกน QR code ด้วยมือถือ

### 9.3 ทดสอบจากมือถือ

พิมพ์ใน Dispatch:
```
มีงานอะไรรอทำบ้าง
```

หรือสั่งงาน:
```
ให้นักข่าวสรุปข่าว AI ที่สำคัญวันนี้
```

> **หมายเหตุ:** Dispatch ต้องเปิด Claude Desktop ไว้บนคอมพิวเตอร์ ถ้าปิดจะใช้ไม่ได้

---

## สรุป Commands ทั้งหมด

| ขั้นตอน | Command | ทำอะไร |
|---------|---------|--------|
| ติดตั้ง | `npm install` | ติดตั้ง dependencies |
| สร้าง DB | `npm run seed` | สร้าง 15 agents |
| Dashboard | `npm run dev` | เปิด UI ที่ :3000 |
| Build MCP | `npm run mcp:build` | Compile MCP server |
| Test MCP | `npm run mcp:start` | ทดสอบรัน MCP (stdio) |

---

## สรุปไฟล์สำคัญ

```
ClaudeAgent/
├── claude-gank.db               ← SQLite database (สร้างจาก npm run seed)
├── mcp-server/dist/index.js     ← MCP Server (สร้างจาก npm run mcp:build)
├── src/                         ← Dashboard source code
├── CLAUDE.md                    ← คู่มือโปรเจค (สำหรับ Claude Code)
├── Cowork.md                    ← คู่มือ Cowork/Dispatch integration
└── SETUP.md                     ← คู่มือนี้
```

---

## Troubleshooting

### `npm run seed` แล้วไม่มี agents
```bash
# ลบ DB แล้ว seed ใหม่
rm claude-gank.db
npm run seed
```

### `npm run mcp:build` error
```bash
# ติดตั้ง dependencies ของ MCP server
cd mcp-server && npm install && npx tsc && cd ..
```

### Cowork ไม่เห็น tools
1. เช็คว่า `claude_desktop_config.json` ถูกต้อง (absolute path)
2. เช็คว่า `mcp-server/dist/index.js` มีอยู่
3. เช็คว่า `claude-gank.db` มีอยู่
4. Restart Claude Desktop (Quit แล้วเปิดใหม่)

### Mission ค้าง PENDING ใน Dashboard
- Cowork ยังไม่ได้หยิบ → สั่งใน Cowork: "มีงานอะไรรอทำบ้าง หยิบงานถัดไปมาทำ"

### Agent ค้าง WORKING
```bash
# Reset ผ่าน API
curl -X PATCH http://localhost:3000/api/agents/AGENT_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"STANDBY"}'
```

### Dashboard เปิดไม่ได้
```bash
# เช็คว่า port 3000 ว่าง
lsof -i :3000
# ถ้าไม่ว่าง
npm run dev -- -p 3001
```
