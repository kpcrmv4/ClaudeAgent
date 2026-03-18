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

## ภาพรวมระบบ (Architecture)

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Dashboard  │────▶│  SQLite DB      │◀────│  MCP Server  │
│  (Next.js)  │     │  claude-gank.db │     │  (stdio)     │
│  :3000      │     │                 │     │              │
│             │     │  20 agents      │     │              │
│  สร้าง      │     │  missions ←──────────── Cowork       │
│  PENDING    │     │  messages       │     │  หยิบงาน     │
│  missions   │     │  memory         │     │  คิดเอง      │
│             │     │                 │     │  เขียนผลกลับ │
│  poll ทุก   │     │                 │     │              │
│  3 วินาที   │     │                 │     │              │
└─────────────┘     └─────────────────┘     └──────────────┘
       ↑                                          ↑
  Browser/มือถือ                           ┌──────┴──────┐
                                           │  Dispatch   │
                                           │  (Phone)    │
                                           └─────────────┘
```

**Flow หลัก:**
1. คุณสั่งงาน (จาก Dashboard / Cowork / Dispatch) → สร้าง PENDING mission ลง DB
2. Cowork เรียก `process_next_mission` → อ่าน agent context + memories → คิดคำตอบ
3. Cowork เรียก `complete_mission` → เขียนผลลัพธ์กลับ DB + save memory
4. Dashboard poll ทุก 3 วินาที → แสดงผลลัพธ์ + confetti 🎉

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

## STEP 3: สร้าง Database + Seed 20 Agents

```bash
npm run seed
```

Output ที่ควรเห็น (ครั้งแรก):
```
Seeding 20 agents...
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
  ✓ นักวิทยาศาสตร์ข้อมูล (TECH)
  ✓ โปรดิวเซอร์วิดีโอ (CREATIVE)
  ✓ ที่ปรึกษากฎหมาย (BIZ)
  ✓ นักแปล (CORE)
  ✓ ผู้จัดการโปรเจค (CORE)
Done! 20 agents created.
```

> ถ้ามี DB อยู่แล้ว (เช่น 15 agents เดิม) seed จะเพิ่มเฉพาะตัวใหม่อัตโนมัติ

---

## STEP 4: ทดสอบ Dashboard

```bash
npm run dev
```

เปิด browser → **http://localhost:3000**

ควรเห็น:
- **AGENTS** — 20 agent cards แบ่งตาม category (CORE, TECH, CREATIVE, BIZ, FINANCE)
- **BIRD'S EYE** — มุมมองกล้องวงจรปิด เห็น agent ทุกตัวบน office floor plan
- **WAR ROOM** — ภาพรวมทีม + auto-dispatch
- **COMMS** — message bus ระหว่าง agents
- **MISSIONS** — mission logs ทั้งหมด
- **SYSTEM** — system info + MCP config

ลองทดสอบ:
1. คลิก agent card → เปิด Mission Panel → พิมพ์สั่งงาน → DEPLOY
2. ไปหน้า BIRD'S EYE → คลิก agent บนแผนที่ → สั่งงานจาก dispatch form
3. Mission จะเป็น PENDING (รอ Cowork หยิบไปทำ)

> ถ้าเห็นหน้าเหล่านี้ = Dashboard พร้อม! ปิด dev server ได้ก่อน (Ctrl+C)

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

# ถ้าไม่มีไฟล์ ให้สร้างใหม่:
mkdir -p ~/Library/Application\ Support/Claude
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
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
    "existing-server": { "..." : "..." },
    "claude-gank": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"],
      "cwd": "/Users/yourname/Projects/ClaudeAgent"
    }
  }
}
```

> **สำคัญ:** `cwd` ต้องเป็น **absolute path** ที่ถูกต้อง (ตาม Step 6.1)

### 6.4 Restart Claude Desktop

ปิด Claude Desktop ทั้งหมด (Quit / Cmd+Q / Alt+F4) แล้วเปิดใหม่

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
Agents: 20 total (0 working, 20 standby)
Missions: 0 total (0 pending, 0 running, 0 completed, 0 failed)
```

### 7.3 ทดสอบดูรายชื่อ

```
แสดงรายชื่อทีมทั้งหมด
```

ควรเห็น 20 agents แบ่งตาม category:
- CORE: เลขา, นักแปล, ผู้จัดการโปรเจค
- TECH: นักเขียนโค้ด, ผู้ดูแลระบบ, นักสร้างออโตเมชัน, นักออกแบบ Prompt, นักวิทยาศาสตร์ข้อมูล
- CREATIVE: นักออกแบบคอร์ส, นักสร้างคอนเทนต์, กราฟฟิค, ครีเอทีฟ, โปรดิวเซอร์วิดีโอ
- BIZ: นักการตลาด, นักวางกลยุทธ์, นักข่าว, ที่ปรึกษากฎหมาย
- FINANCE: นักบัญชี, นักเทรดทอง, นักวิเคราะห์หุ้น

---

## STEP 8: ทดสอบสั่งงานจริง

### 8.1 เปิด Dashboard (ในอีก terminal)

```bash
npm run dev
```

### 8.2 สั่งงานใน Cowork

**ตัวอย่างที่ 1 — สั่งตรง:**
```
ให้นักสร้างคอนเทนต์เขียน caption Instagram 3 แบบ เรื่อง AI กับธุรกิจ
```

**ตัวอย่างที่ 2 — ให้เลขาเลือก agent:**
```
ช่วยเขียนบทความเรื่อง AI trends
```

**ตัวอย่างที่ 3 — สั่ง agent ใหม่:**
```
ให้ที่ปรึกษากฎหมายตรวจสัญญา NDA ว่ามีข้อควรระวังอะไรบ้าง
```

**ตัวอย่างที่ 4 — ให้ทีมทำงานร่วมกัน:**
```
ให้ผู้จัดการโปรเจควางแผนสร้างเว็บ e-commerce แล้วแจก task ให้ทีม
```

Cowork จะ:
1. เรียก `dispatch_mission` → สร้าง PENDING mission
2. เรียก `process_next_mission` → อ่าน agent context + memories
3. คิดคำตอบ (ใช้ subscription)
4. เรียก `complete_mission` → เขียนผลกลับ DB

### 8.3 ดูผลใน Dashboard

**วิธีที่ 1 — หน้า Missions:**
เปิด http://localhost:3000/missions → เห็น mission ที่เสร็จแล้ว

**วิธีที่ 2 — หน้า Agents:**
คลิก agent → เห็นผลงานใน Mission Panel

**วิธีที่ 3 — Bird's Eye View (แนะนำ!):**
เปิด http://localhost:3000/birdseye → เห็น agent เปลี่ยนจาก 💤 เป็น ⌨️ typing → งานเสร็จ 🎉 confetti ระเบิด!

---

## STEP 9: สั่งงานจากมือถือ (Dispatch)

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

## STEP 10: สั่งงานจาก Dashboard (Bird's Eye View)

ไม่ต้องเปิด Cowork ก็สร้าง PENDING mission ได้:

1. เปิด http://localhost:3000/birdseye
2. คลิกตัว agent บนแผนที่
3. พิมพ์ชื่อ mission + รายละเอียด + เลือก priority
4. กด 🚀 DISPATCH → sparkle ระเบิดที่ตัว agent
5. Mission เป็น PENDING → รอ Cowork หยิบไปทำ

> **Tip:** เปิด Cowork แล้วพิมพ์ "หยิบงานถัดไปมาทำ" เพื่อให้ Cowork process mission ที่รอ

---

## Agent Team ทั้ง 20 ตัว

| ID | Name | Cat | Model | ทำอะไรได้ |
|----|------|-----|-------|-----------|
| secretary | เลขา | CORE | sonnet | รับงาน วิเคราะห์ ส่งต่อ agent ที่เหมาะสม |
| translator | นักแปล | CORE | sonnet | แปล TH↔EN↔JP↔CN + localization |
| project-mgr | ผู้จัดการโปรเจค | CORE | sonnet | Agile, WBS, sprint planning, tracking |
| coder | นักเขียนโค้ด | TECH | opus | เขียนโค้ด TS/Python/Go/Rust, debug |
| sysadmin | ผู้ดูแลระบบ | TECH | opus | Docker, K8s, CI/CD, AWS, server |
| automator | นักสร้างออโตเมชัน | TECH | opus | n8n/Zapier, API, data pipeline |
| prompt-eng | นักออกแบบ Prompt | TECH | sonnet | system prompt, CoT, few-shot |
| data-scientist | นักวิทยาศาสตร์ข้อมูล | TECH | opus | ML/AI, pandas, PyTorch, RAG |
| course-designer | นักออกแบบคอร์ส | CREATIVE | sonnet | หลักสูตร ADDIE, Bloom's |
| content-creator | นักสร้างคอนเทนต์ | CREATIVE | sonnet | IG/TikTok/Blog/Email/YouTube |
| graphic | กราฟฟิค | CREATIVE | sonnet | UI/UX, branding, AI image prompt |
| creative | ครีเอทีฟ | CREATIVE | sonnet | brainstorm, campaign, viral |
| video-producer | โปรดิวเซอร์วิดีโอ | CREATIVE | sonnet | script, storyboard, production |
| marketer | นักการตลาด | BIZ | sonnet | Meta/Google Ads, SEO, AARRR |
| strategist | นักวางกลยุทธ์ | BIZ | opus | Porter's, Lean Canvas, SWOT |
| journalist | นักข่าว | BIZ | sonnet | วิจัย, fact-check, สรุปข่าว |
| legal-advisor | ที่ปรึกษากฎหมาย | BIZ | opus | สัญญา, PDPA, ลิขสิทธิ์ |
| accountant | นักบัญชี | FINANCE | opus | งบการเงิน, ภาษี, TFRS/IFRS |
| gold-trader | นักเทรดทอง | FINANCE | opus | technical + fundamental, ทองไทย |
| stock-analyst | นักวิเคราะห์หุ้น | FINANCE | opus | P/E, DCF, SET50, S&P 500 |

---

## สรุป Commands ทั้งหมด

| ขั้นตอน | Command | ทำอะไร |
|---------|---------|--------|
| ติดตั้ง | `npm install` | ติดตั้ง dependencies |
| สร้าง DB | `npm run seed` | สร้าง/เพิ่ม agents (20 ตัว) |
| Dashboard | `npm run dev` | เปิด UI ที่ :3000 |
| Build MCP | `npm run mcp:build` | Compile MCP server |
| Test MCP | `npm run mcp:start` | ทดสอบรัน MCP (stdio) |
| Build app | `npm run build` | Production build |

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

## ตัวอย่างคำสั่งใน Cowork / Dispatch

```
"ดูสถานะทีม"                                    → team_status
"แสดงรายชื่อทีมทั้งหมด"                           → list_agents
"มีงานอะไรรอทำบ้าง"                              → get_pending_missions
"หยิบงานถัดไปมาทำ"                               → process_next_mission

"ให้นักเขียนโค้ดสร้าง API สำหรับ user auth"        → dispatch + process + complete
"ช่วยแปลเอกสารนี้เป็นภาษาอังกฤษ"                  → translator
"ให้ที่ปรึกษากฎหมายตรวจสัญญา NDA"                 → legal-advisor
"ให้ data scientist วิเคราะห์ข้อมูลยอดขาย"        → data-scientist
"ให้โปรดิวเซอร์เขียน script วิดีโอ YouTube"        → video-producer
"ให้ PM วางแผนโปรเจค mobile app"                  → project-mgr

"ส่งข้อความให้ทุกคนว่าพรุ่งนี้มี sprint review"     → send_message (broadcast)
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

### Bird's Eye View ไม่เห็น agent ใหม่
```bash
# Seed เพิ่ม agents ใหม่
npm run seed
# ควรเห็น "Adding 5 new agents..."
# แล้ว refresh หน้า Dashboard
```

---

## Timeline ติดตั้งทั้งหมด

```
1. Clone repo                         ~1 min
2. npm install                         ~2-3 min
3. npm run seed                        ~10 sec
4. npm run dev (ทดสอบ Dashboard)       ~5 sec
5. npm run mcp:build                   ~5 sec
6. แก้ claude_desktop_config.json      ~2 min
7. Restart Claude Desktop              ~10 sec
8. ทดสอบใน Cowork                      ~1 min
                                       ─────────
                                       รวม ~10 นาที
```
