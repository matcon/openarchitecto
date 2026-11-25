#!/usr/bin/env node
/**
 * OpenArchitecto Cross-Platform Installer (Linux, macOS, Windows)
 * Registers the MCP server and installs portable Agent Skill & Agent definitions.
 */

import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = resolve(dirname(__filename), "..");

function printHelp() {
  console.log(`
OpenArchitecto Installer v2.1.0 (Linux / macOS / Windows)

Usage:
  node scripts/install.mjs [options]

Options:
  --scope=user|project      Install for user-global clients (default) or current workspace (.mcp.json)
  --client=LIST             Comma-separated targets: auto (default), all, claude-desktop,
                            claude-code, cursor, windsurf, gemini, antigravity, codex
  --runtime=node|bun        MCP server command runtime: node (default, dist/mcp-server.js) or bun
  --diagrams-dir=PATH       Optional OPENARCHITECTO_DIAGRAMS_DIR override in MCP config
  --no-skills               Skip installing SKILL.md and agent definition files
  --skip-build              Skip automatic npm run build check
  --dry-run                 Print planned changes without modifying files
  --uninstall               Remove OpenArchitecto entries & installed skill/agent copies
  -y, --yes                 Non-interactive confirmation (default behavior)
  -h, --help                Show this help message
`);
}

function parseArgs(argv) {
  const opts = {
    scope: "user",
    clients: ["auto"],
    runtime: "node",
    diagramsDir: "",
    installSkills: true,
    skipBuild: false,
    dryRun: false,
    uninstall: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "-h" || arg === "--help") opts.help = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--uninstall") opts.uninstall = true;
    else if (arg === "--no-skills") opts.installSkills = false;
    else if (arg === "--skip-build") opts.skipBuild = true;
    else if (arg === "-y" || arg === "--yes") {
      // accepted for CLI compatibility
    } else if (arg.startsWith("--scope=")) {
      const val = arg.slice("--scope=".length).trim().toLowerCase();
      if (val === "user" || val === "project") opts.scope = val;
      else throw new Error(`Invalid --scope value: ${val}`);
    } else if (arg.startsWith("--client=")) {
      opts.clients = arg
        .slice("--client=".length)
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    } else if (arg.startsWith("--runtime=")) {
      const val = arg.slice("--runtime=".length).trim().toLowerCase();
      if (val === "node" || val === "bun") opts.runtime = val;
      else throw new Error(`Invalid --runtime value: ${val}`);
    } else if (arg.startsWith("--diagrams-dir=")) {
      opts.diagramsDir = resolve(process.cwd(), arg.slice("--diagrams-dir=".length).trim());
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return opts;
}

function getClaudeDesktopConfigPath(home) {
  if (process.platform === "darwin") {
    return join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || join(home, "AppData", "Roaming");
    return join(appData, "Claude", "claude_desktop_config.json");
  }
  const xdg = process.env.XDG_CONFIG_HOME || join(home, ".config");
  return join(xdg, "Claude", "claude_desktop_config.json");
}

function getMcpTargets(home, scope) {
  if (scope === "project") {
    return [
      { id: "project-mcp", label: "Workspace .mcp.json", path: join(process.cwd(), ".mcp.json"), kind: "json", detectDir: process.cwd() },
    ];
  }
  const claudeDesktopPath = getClaudeDesktopConfigPath(home);
  return [
    { id: "claude-desktop", label: "Claude Desktop", path: claudeDesktopPath, kind: "json", detectDir: dirname(claudeDesktopPath) },
    { id: "claude-code", label: "Claude Code", path: join(home, ".claude.json"), kind: "json", detectDir: join(home, ".claude") },
    { id: "cursor", label: "Cursor", path: join(home, ".cursor", "mcp.json"), kind: "json", detectDir: join(home, ".cursor") },
    { id: "windsurf", label: "Windsurf", path: join(home, ".codeium", "windsurf", "mcp_config.json"), kind: "json", detectDir: join(home, ".codeium", "windsurf") },
    { id: "gemini", label: "Gemini CLI", path: join(home, ".gemini", "settings.json"), kind: "json", detectDir: join(home, ".gemini") },
    { id: "antigravity", label: "Antigravity CLI", path: join(home, ".gemini", "antigravity-cli", "mcp_config.json"), kind: "json", detectDir: join(home, ".gemini", "antigravity-cli") },
    { id: "codex", label: "Codex CLI", path: join(home, ".codex", "config.toml"), kind: "toml", detectDir: join(home, ".codex") },
  ];
}

function buildServerEntry(opts) {
  const entry = opts.runtime === "bun"
    ? { command: "bun", args: ["run", join(PROJECT_ROOT, "mcp-server.ts")] }
    : { command: "node", args: [join(PROJECT_ROOT, "dist", "mcp-server.js")] };

  if (opts.diagramsDir) {
    entry.env = { OPENARCHITECTO_DIAGRAMS_DIR: opts.diagramsDir };
  }
  return entry;
}

function toTomlString(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildCodexTomlBlock(entry) {
  const lines = [
    "[mcp_servers.openarchitecto]",
    `command = ${toTomlString(entry.command)}`,
    `args = [${entry.args.map(toTomlString).join(", ")}]`,
  ];
  if (entry.env && Object.keys(entry.env).length > 0) {
    lines.push("[mcp_servers.openarchitecto.env]");
    for (const [k, v] of Object.entries(entry.env)) {
      lines.push(`${k} = ${toTomlString(v)}`);
    }
  }
  return lines.join("\n") + "\n";
}

async function updateJsonConfig(target, serverEntry, opts) {
  let data = {};
  if (existsSync(target.path)) {
    const raw = await readFile(target.path, "utf-8");
    if (raw.trim()) {
      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.warn(`[WARN] Skipping ${target.label} (${target.path}): invalid JSON (${err.message})`);
        return false;
      }
    }
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    console.warn(`[WARN] Skipping ${target.label} (${target.path}): root JSON must be an object`);
    return false;
  }

  if (opts.uninstall) {
    if (!data.mcpServers || !Object.prototype.hasOwnProperty.call(data.mcpServers, "openarchitecto")) {
      return false;
    }
    delete data.mcpServers.openarchitecto;
  } else {
    if (!data.mcpServers || typeof data.mcpServers !== "object" || Array.isArray(data.mcpServers)) {
      data.mcpServers = {};
    }
    data.mcpServers.openarchitecto = serverEntry;
  }

  if (opts.dryRun) {
    console.log(`[DRY-RUN] Would ${opts.uninstall ? "remove from" : "update"} ${target.label}: ${target.path}`);
    return true;
  }

  await mkdir(dirname(target.path), { recursive: true });
  await writeFile(target.path, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`[OK] ${opts.uninstall ? "Removed from" : "Configured"} ${target.label}: ${target.path}`);
  return true;
}

async function updateTomlConfig(target, serverEntry, opts) {
  const existing = existsSync(target.path) ? await readFile(target.path, "utf-8") : "";
  const sectionRegex = /\n?\[mcp_servers\.openarchitecto\][\s\S]*?(?=\n\[(?!mcp_servers\.openarchitecto\.)|$)/g;
  const cleaned = existing.replace(sectionRegex, "").trimEnd();
  const nextContent = opts.uninstall
    ? (cleaned ? cleaned + "\n" : "")
    : (cleaned ? cleaned + "\n\n" : "") + buildCodexTomlBlock(serverEntry);

  if (opts.uninstall && existing === nextContent) return false;

  if (opts.dryRun) {
    console.log(`[DRY-RUN] Would ${opts.uninstall ? "remove from" : "update"} ${target.label}: ${target.path}`);
    return true;
  }

  await mkdir(dirname(target.path), { recursive: true });
  await writeFile(target.path, nextContent, "utf-8");
  console.log(`[OK] ${opts.uninstall ? "Removed from" : "Configured"} ${target.label}: ${target.path}`);
  return true;
}

async function syncSkillsAndAgents(home, opts) {
  if (!opts.installSkills) return;
  const srcSkillDir = join(PROJECT_ROOT, "skills", "openarchitecto");
  const srcAgentFile = join(PROJECT_ROOT, "agents", "openarchitecto-diagrammer.md");

  const skillTargets = opts.scope === "project"
    ? [
        { root: join(process.cwd(), ".agents"), dest: join(process.cwd(), ".agents", "skills", "openarchitecto"), always: true },
        { root: join(process.cwd(), ".claude"), dest: join(process.cwd(), ".claude", "skills", "openarchitecto"), always: false },
      ]
    : [
        { root: join(home, ".gemini"), dest: join(home, ".gemini", "skills", "openarchitecto"), always: false },
        { root: join(home, ".claude"), dest: join(home, ".claude", "skills", "openarchitecto"), always: false },
        { root: join(home, ".agents"), dest: join(home, ".agents", "skills", "openarchitecto"), always: false },
        { root: join(home, ".codex"), dest: join(home, ".codex", "skills", "openarchitecto"), always: false },
      ];

  for (const t of skillTargets) {
    if (!t.always && !existsSync(t.root)) continue;
    if (opts.uninstall) {
      if (!existsSync(t.dest)) continue;
      if (opts.dryRun) {
        console.log(`[DRY-RUN] Would remove skill: ${t.dest}`);
      } else {
        await rm(t.dest, { recursive: true, force: true });
        console.log(`[OK] Removed skill: ${t.dest}`);
      }
      continue;
    }
    if (opts.dryRun) {
      console.log(`[DRY-RUN] Would install skill to: ${t.dest}`);
    } else {
      await mkdir(dirname(t.dest), { recursive: true });
      await cp(srcSkillDir, t.dest, { recursive: true, force: true });
      console.log(`[OK] Installed skill: ${t.dest}`);
    }
  }

  const agentTargets = opts.scope === "project"
    ? [{ root: join(process.cwd(), ".claude"), dest: join(process.cwd(), ".claude", "agents", "openarchitecto-diagrammer.md") }]
    : [
        { root: join(home, ".claude"), dest: join(home, ".claude", "agents", "openarchitecto-diagrammer.md") },
        {
          root: join(home, ".gemini", "config", "plugins", "swarmclaw-agents", "agents"),
          dest: join(home, ".gemini", "config", "plugins", "swarmclaw-agents", "agents", "openarchitecto-diagrammer.md"),
        },
      ];

  for (const a of agentTargets) {
    if (!existsSync(a.root)) continue;
    if (opts.uninstall) {
      if (!existsSync(a.dest)) continue;
      if (opts.dryRun) {
        console.log(`[DRY-RUN] Would remove agent: ${a.dest}`);
      } else {
        await rm(a.dest, { force: true });
        console.log(`[OK] Removed agent: ${a.dest}`);
      }
      continue;
    }
    if (opts.dryRun) {
      console.log(`[DRY-RUN] Would install agent to: ${a.dest}`);
    } else {
      await mkdir(dirname(a.dest), { recursive: true });
      await cp(srcAgentFile, a.dest, { force: true });
      console.log(`[OK] Installed agent: ${a.dest}`);
    }
  }
}

function ensureBuilt(opts) {
  if (opts.uninstall || opts.skipBuild || opts.runtime !== "node") return;
  const distMcp = join(PROJECT_ROOT, "dist", "mcp-server.js");
  if (existsSync(distMcp)) return;

  if (opts.dryRun) {
    console.log("[DRY-RUN] dist/mcp-server.js missing; would run npm run build");
    return;
  }

  console.log("[INFO] Building TypeScript artifacts into dist/...");
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const res = spawnSync(npmCmd, ["run", "build"], { cwd: PROJECT_ROOT, stdio: "inherit" });
  if (res.status !== 0) {
    throw new Error("Build failed. Run `npm install && npm run build` manually and retry.");
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  ensureBuilt(opts);

  const home = os.homedir();
  const targets = getMcpTargets(home, opts.scope);
  const wantAll = opts.clients.includes("all");
  const wantAuto = opts.clients.includes("auto");
  const serverEntry = buildServerEntry(opts);

  let updatedCount = 0;
  for (const target of targets) {
    const selected =
      opts.scope === "project" ||
      wantAll ||
      opts.clients.includes(target.id) ||
      (wantAuto && (existsSync(target.path) || existsSync(target.detectDir)));

    if (!selected) continue;

    const changed = target.kind === "toml"
      ? await updateTomlConfig(target, serverEntry, opts)
      : await updateJsonConfig(target, serverEntry, opts);
    if (changed) updatedCount += 1;
  }

  await syncSkillsAndAgents(home, opts);

  console.log("");
  console.log(opts.dryRun ? "Dry-run complete." : "OpenArchitecto setup complete.");
  if (updatedCount === 0 && !opts.uninstall) {
    console.log("No pre-existing MCP client folders matched automatically.");
    console.log("Pass --client=claude-desktop,cursor,gemini or --scope=project, or copy mcp_config_snippet.json.");
  }
  console.log(`Server entrypoint: ${serverEntry.command} ${serverEntry.args.join(" ")}`);
  console.log("Start Web Studio: npm start (http://127.0.0.1:5173)");
}

main().catch((err) => {
  console.error(`[ERROR] ${err.message}`);
  process.exit(1);
});
