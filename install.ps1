$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js >= 18 is required. Install it from https://nodejs.org/"
  exit 1
}

$NodeMajor = [int](node -p 'process.versions.node.split(".")[0]')
if ($NodeMajor -lt 18) {
  Write-Error "Node.js >= 18 is required."
  exit 1
}

if (-not (Test-Path "node_modules\@modelcontextprotocol\sdk")) {
  Write-Host "[INFO] Installing dependencies..."
  npm install
}

if (-not (Test-Path "dist\mcp-server.js") -or -not (Test-Path "dist\servidor.js")) {
  Write-Host "[INFO] Building TypeScript artifacts..."
  npm run build
}

node scripts\install.mjs @args
