import { execSync } from "child_process";
import { resolve, join } from "path";
import { existsSync, statSync } from "fs";

const PROJECT_DIR = resolve(__dirname, "..");

// ━━━━━━━━━━━━━━━━━━━━ Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StepResult {
  name: string;
  status: "pass" | "fail" | "skip";
  detail: string;
  duration: number;
}

const results: StepResult[] = [];

// ━━━━━━━━━━━━━━━━━━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function runStep(name: string, fn: () => string): void {
  const start = Date.now();
  console.log(`\n${"━".repeat(50)}`);
  console.log(`⏳ Step ${results.length + 1}: ${name}`);
  console.log("━".repeat(50));

  try {
    const detail = fn();
    const duration = Date.now() - start;
    results.push({ name, status: "pass", detail, duration });
    console.log(`✅ ${name} — สำเร็จ (${formatDuration(duration)})`);
  } catch (err: any) {
    const duration = Date.now() - start;
    const detail = err.message || String(err);
    results.push({ name, status: "fail", detail, duration });
    console.log(`❌ ${name} — ล้มเหลว (${formatDuration(duration)})`);
    console.log(`   ${detail.split("\n")[0]}`);
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function run(cmd: string): string {
  return execSync(cmd, { cwd: PROJECT_DIR, stdio: "pipe", timeout: 300_000 }).toString();
}

// ━━━━━━━━━━━━━━━━━━━━ Steps ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Step 1: npm install
runStep("ติดตั้ง Dependencies (npm install)", () => {
  const hasNodeModules = existsSync(join(PROJECT_DIR, "node_modules"));
  if (hasNodeModules) {
    // ยังรัน install เพื่อให้แน่ใจว่าครบ
    run("npm install --prefer-offline");
    return "dependencies ครบแล้ว (ใช้ cache)";
  }
  run("npm install");
  // validate
  if (!existsSync(join(PROJECT_DIR, "node_modules"))) {
    throw new Error("node_modules ไม่ถูกสร้าง");
  }
  return "ติดตั้ง dependencies ใหม่ทั้งหมด";
});

// Step 2: npm run seed
runStep("สร้าง Database + Seed Agents (npm run seed)", () => {
  const output = run("npm run seed");
  // validate DB file exists
  const dbPath = join(PROJECT_DIR, "claude-gank.db");
  if (!existsSync(dbPath)) {
    throw new Error("claude-gank.db ไม่ถูกสร้าง");
  }
  const dbSize = statSync(dbPath).size;
  // extract agent count from output
  const matchCreated = output.match(/(\d+)\s*agents?\s*created/i);
  const matchTotal = output.match(/(\d+)\s*agents?\s*total/i);
  const matchAll = output.match(/all\s*(\d+)\s*agents/i);
  const count = matchTotal?.[1] || matchCreated?.[1] || matchAll?.[1] || "20";
  return `${count} agents | DB size: ${(dbSize / 1024).toFixed(0)} KB`;
});

// Step 3: npm run mcp:build
runStep("Build MCP Server (npm run mcp:build)", () => {
  run("npm run mcp:build");
  // validate
  const distPath = join(PROJECT_DIR, "mcp-server", "dist", "index.js");
  if (!existsSync(distPath)) {
    throw new Error("mcp-server/dist/index.js ไม่ถูกสร้าง");
  }
  const size = statSync(distPath).size;
  return `mcp-server/dist/index.js (${(size / 1024).toFixed(0)} KB)`;
});

// Step 4: npm run build
runStep("Build Dashboard (npm run build)", () => {
  run("npm run build");
  // validate
  const nextDir = join(PROJECT_DIR, ".next");
  if (!existsSync(nextDir)) {
    throw new Error(".next directory ไม่ถูกสร้าง");
  }
  return "Next.js production build สำเร็จ";
});

// Step 5: setup:cowork
runStep("ตั้งค่า Cowork Config (setup:cowork)", () => {
  const output = run("npx tsx scripts/setup-cowork.ts");
  if (output.includes("ไม่ต้องแก้อะไร")) {
    return "ตั้งค่าอยู่แล้ว — ไม่ต้องแก้";
  }
  if (output.includes("เพิ่ม claude-gank") || output.includes("อัปเดต claude-gank")) {
    return "เขียน claude_desktop_config.json สำเร็จ";
  }
  return output.trim().split("\n").pop() || "สำเร็จ";
});

// ━━━━━━━━━━━━━━━━━━━━ Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log(`\n${"━".repeat(50)}`);
console.log("📋 สรุปผลการติดตั้ง");
console.log("━".repeat(50));

const passed = results.filter((r) => r.status === "pass");
const failed = results.filter((r) => r.status === "fail");
const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

results.forEach((r, i) => {
  const icon = r.status === "pass" ? "✅" : r.status === "fail" ? "❌" : "⏭️";
  console.log(`  ${icon} Step ${i + 1}: ${r.name}`);
  console.log(`     ${r.detail} (${formatDuration(r.duration)})`);
});

console.log(`\n${"━".repeat(50)}`);
console.log(`  ผ่าน: ${passed.length}/${results.length} | เวลารวม: ${formatDuration(totalTime)}`);

if (failed.length === 0) {
  console.log(`\n🎉 ติดตั้งสำเร็จทุกขั้นตอน!\n`);
  console.log("  ขั้นตอนถัดไป:");
  console.log("  1. เปิด Dashboard:     npm run dev → http://localhost:3000");
  console.log("  2. Bird's Eye View:    http://localhost:3000/birdseye");
  console.log("  3. Restart Claude Desktop เพื่อเชื่อม Cowork");
  console.log();
} else {
  console.log(`\n⚠️  มี ${failed.length} ขั้นตอนที่ล้มเหลว — ดูรายละเอียดด้านบน\n`);
  process.exit(1);
}
