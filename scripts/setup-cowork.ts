import { resolve, join } from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir, platform } from "os";

const PROJECT_DIR = resolve(__dirname, "..");

// ━━━━━━━━━━━━━━━━━━━━ Detect config path ━━━━━━━━━━━━━━━━━━━━

function getConfigPath(): string {
  const os = platform();
  if (os === "darwin") {
    return join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else if (os === "win32") {
    return join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
  } else {
    // Linux
    return join(homedir(), ".config", "Claude", "claude_desktop_config.json");
  }
}

// ━━━━━━━━━━━━━━━━━━━━ Main ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function main() {
  const configPath = getConfigPath();
  console.log(`\n🔍 Project path: ${PROJECT_DIR}`);
  console.log(`📄 Config path:  ${configPath}\n`);

  // Check MCP server is built
  const mcpDist = join(PROJECT_DIR, "mcp-server", "dist", "index.js");
  if (!existsSync(mcpDist)) {
    console.log("⚠️  MCP Server ยังไม่ได้ build — กำลังรัน npm run mcp:build ...\n");
    const { execSync } = require("child_process");
    execSync("npm run mcp:build", { cwd: PROJECT_DIR, stdio: "inherit" });
    console.log();
  }

  // Read existing config or create new
  let config: any = { mcpServers: {} };
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf-8");
      config = JSON.parse(raw);
      if (!config.mcpServers) config.mcpServers = {};
      console.log(`✅ พบ config เดิม (มี ${Object.keys(config.mcpServers).length} MCP servers)`);
    } catch {
      console.log("⚠️  Config เดิมอ่านไม่ได้ — สร้างใหม่");
      config = { mcpServers: {} };
    }
  } else {
    console.log("📝 ไม่พบ config — สร้างใหม่");
    const dir = join(configPath, "..");
    mkdirSync(dir, { recursive: true });
  }

  // Check if already configured with same path
  const existing = config.mcpServers["claude-gank"];
  if (existing && existing.cwd === PROJECT_DIR) {
    console.log(`\n✅ claude-gank ตั้งค่าอยู่แล้ว — ชี้ไปที่ ${PROJECT_DIR}`);
    console.log("   ไม่ต้องแก้อะไร!\n");
    return;
  }

  // Update config
  const wasExisting = !!existing;
  config.mcpServers["claude-gank"] = {
    command: "node",
    args: ["mcp-server/dist/index.js"],
    cwd: PROJECT_DIR,
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");

  if (wasExisting) {
    console.log(`\n🔄 อัปเดต claude-gank → cwd: ${PROJECT_DIR}`);
  } else {
    console.log(`\n✅ เพิ่ม claude-gank → cwd: ${PROJECT_DIR}`);
  }

  console.log(`💾 บันทึกไปที่ ${configPath}`);
  console.log("\n⚡ Restart Claude Desktop (Quit แล้วเปิดใหม่) เพื่อให้ config มีผล\n");
}

main();
