# OpenArchitecto Studio & MCP

Cross-platform **Multi-Domain Architecture Diagramming Suite** (**Multi-Cloud AWS/GCP/Azure/K8s**, **BPMN 2.0**, **UML 2.5**, **C4 Model**, **ERD**, and **Flowcharts**) combining:

- **MCP Server (`openarchitecto-mcp`)** over stdio JSON-RPC 2.0 (Tools, Resources, Prompts)
- **Web Studio (`openarchitecto-studio`)** with interactive SVG canvas, BPMN Swimlanes, NLP arrow-flow generator, Presentation Mode, and Draw.io (`.drawio`) / `.svg` / `.png` / `.json` export
- **Portable Agent Skill (`skills/openarchitecto`)** and **Diagrammer Agent (`agents/openarchitecto-diagrammer.md`)** compatible with Claude Desktop, Claude Code, Cursor, Windsurf, Gemini CLI, Antigravity, and Codex CLI

Runs natively on **Linux**, **macOS**, and **Windows** using **Node.js >= 18** (zero containers required) or **Bun**.

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/matcon/openarchitecto.git
cd openarchitecto
npm install
npm run build
```

Run the interactive/automatic setup to configure detected MCP clients and install the Skill & Agent:

- **Linux / macOS**:
  ```bash
  ./install.sh
  ```
- **Windows (PowerShell)**:
  ```powershell
  .\install.ps1
  ```
- **Universal Node CLI** (all OS):
  ```bash
  node scripts/install.mjs --dry-run
  node scripts/install.mjs
  ```

### 2. Start Web Studio

```bash
npm start
# or
./iniciar.sh
```

Open `http://127.0.0.1:5173`. Default Studio session credentials: `Architect` / `ARCH-001` (or select **Invitado (Solo Lectura)** for read-only inspection and Presentation Mode).

---

## Installer Options (`scripts/install.mjs`)

| Flag | Description |
| :--- | :--- |
| `--scope=user \| project` | Register globally for installed AI clients (`user`, default) or locally in `./.mcp.json` (`project`) |
| `--client=LIST` | Comma-separated: `auto` (default), `all`, `claude-desktop`, `claude-code`, `cursor`, `windsurf`, `gemini`, `antigravity`, `codex` |
| `--runtime=node \| bun` | Launch `node dist/mcp-server.js` (default) or `bun run mcp-server.ts` |
| `--diagrams-dir=PATH` | Set `OPENARCHITECTO_DIAGRAMS_DIR` in the generated MCP config |
| `--no-skills` | Register MCP config only without copying `SKILL.md` / agent markdown |
| `--dry-run` | Preview all file changes without writing to disk |
| `--uninstall` | Remove `openarchitecto` MCP entries and installed skill/agent copies |

---

## Manual MCP Client Configuration

If you prefer manual setup, point your MCP client to `<repo>/dist/mcp-server.js` via `node` (see [mcp_config_snippet.json](mcp_config_snippet.json)):

### JSON Clients (Claude Desktop, Claude Code, Cursor, Windsurf, Gemini CLI, Antigravity)

```json
{
  "mcpServers": {
    "openarchitecto": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/openarchitecto/dist/mcp-server.js"],
      "env": {}
    }
  }
}
```

### Codex CLI (`~/.codex/config.toml`)

```toml
[mcp_servers.openarchitecto]
command = "node"
args = ["/ABSOLUTE/PATH/TO/openarchitecto/dist/mcp-server.js"]
```

---

## MCP Capabilities (Tools, Resources & Prompts)

### Tools (9)

| Tool | Description |
| :--- | :--- |
| `list_catalogs` | Returns official node `tpl` stencils and container `groups` types across `cloud`, `uml`, `bpmn`, `c4`, `erd`, `flowchart` |
| `list_templates` | Lists built-in starter templates filtered by `diagramType` |
| `get_template` | Returns the full JSON graph for a given `templateId` |
| `create_diagram` | Validates node/group schemas, ID uniqueness, and edge referential integrity |
| `prompt_to_diagram` | Converts prose or arrow chains (`A -> B -> C`) into an auto-positioned diagram |
| `export_diagram` | Exports a diagram or template to editable Draw.io XML (`.drawio`) or vector `.svg` |
| `save_diagram_to_studio` | Persists diagram JSON safely into `OPENARCHITECTO_DIAGRAMS_DIR` |
| `load_diagram_from_studio` | Lists saved Studio diagrams or loads one by filename |
| `delete_diagram_from_studio` | Safely deletes a saved Studio diagram JSON file |

### Resources (3) & Prompts (2)

- `openarchitecto://catalogs` — Complete JSON catalog across all disciplines
- `openarchitecto://templates/{templateId}` — Starter template JSON with completion
- `openarchitecto://diagrams/{filename}` — Saved Studio diagram JSON with completion
- Prompt `design-architecture` (`domain`, `requirements`)
- Prompt `design-bpmn-process` (`processName`, `actors`)

---

## Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `OPENARCHITECTO_DIAGRAMS_DIR` | `<projectRoot>/diagrams` | Directory where JSON diagrams are read/written |
| `PORT` / `OPENARCHITECTO_PORT` | `5173` | Web Studio HTTP port |
| `HOST` / `OPENARCHITECTO_HOST` | `127.0.0.1` | Web Studio bind address |
| `OPENARCHITECTO_STUDIO_URL` | `http://127.0.0.1:5173` | Base Studio URL reported in MCP tool responses |

---

## Studio Shortcuts & Presentation Mode

- `V`: Move / Select tool
- `C`: Connect tool
- `P`: Toggle **Presentation Mode** (animates edges sequentially using `edge.step`)
- `ArrowRight` / `Space`: Next presentation step (`ArrowLeft`: previous step)
- `Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z`: Undo / Redo (disabled during Presentation Mode)
- `Delete` / `Backspace`: Remove selected element (disabled during Presentation Mode)
- `Escape`: Exit modals or Presentation Mode

---

## Development & Verification

```bash
npm run build   # Compile TypeScript (shared.ts, mcp-server.ts, servidor.ts) to dist/
npm test        # Run automated E2E suite (MCP stdio, HTTP API, exporters, HTML syntax, installer)
```
