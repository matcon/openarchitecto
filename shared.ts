import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolves the OpenArchitecto project root regardless of whether the code runs
 * directly from `.ts` at root or compiled inside `dist/*.js` on Node.js or Bun.
 */
export function resolveProjectRoot(metaUrl: string): string {
  let dir = dirname(fileURLToPath(metaUrl));
  for (let i = 0; i < 4; i++) {
    if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "index.html"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return dirname(fileURLToPath(metaUrl));
}

export interface RuntimeConfig {
  projectRoot: string;
  diagramsDir: string;
  host: string;
  port: number;
  studioUrl: string;
}

export function getRuntimeConfig(metaUrl: string): RuntimeConfig {
  const projectRoot = resolveProjectRoot(metaUrl);

  const envDiagrams = process.env.OPENARCHITECTO_DIAGRAMS_DIR?.trim();
  const diagramsDir = envDiagrams
    ? resolve(process.cwd(), envDiagrams)
    : join(projectRoot, "diagrams");

  const rawHost = process.env.HOST?.trim() || process.env.OPENARCHITECTO_HOST?.trim() || "127.0.0.1";
  const rawPort = Number(process.env.PORT || process.env.OPENARCHITECTO_PORT || "5173");
  const port = Number.isInteger(rawPort) && rawPort >= 1 && rawPort <= 65535 ? rawPort : 5173;

  const displayHost = rawHost === "0.0.0.0" || rawHost === "::" ? "localhost" : rawHost;
  const studioUrl = process.env.OPENARCHITECTO_STUDIO_URL?.trim() || `http://${displayHost}:${port}`;

  return { projectRoot, diagramsDir, host: rawHost, port, studioUrl };
}

/**
 * Normalizes a diagram name into a safe bare stem `[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}`
 * without dots, slashes, or traversal sequences.
 */
export function sanitizeDiagramStem(rawName: string): string {
  const stripped = String(rawName || "")
    .trim()
    .replace(/\.json$/i, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, 128);
  return stripped || `diagram_${Date.now()}`;
}

/**
 * Strictly validates and resolves a diagram JSON file inside `diagramsDir`.
 * Rejects path traversal (`..`), separators (`/` or `\`), null bytes, or hidden files.
 */
export function resolveSafeDiagramPath(
  diagramsDir: string,
  rawName: string
): { ok: true; filename: string; filePath: string } | { ok: false; error: string } {
  const trimmed = String(rawName || "").trim();
  if (!trimmed || trimmed.includes("\0")) {
    return { ok: false, error: "Invalid empty or null-byte diagram filename." };
  }
  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("..")) {
    return { ok: false, error: "Path traversal or directory separators are not allowed in diagram filename." };
  }

  const stem = trimmed.replace(/\.json$/i, "");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(stem)) {
    return {
      ok: false,
      error: "Filename must start with alphanumeric and contain only [a-zA-Z0-9_-] (max 128 chars)."
    };
  }

  const filename = `${stem}.json`;
  const rootResolved = resolve(diagramsDir);
  const targetResolved = resolve(rootResolved, filename);
  const rel = relative(rootResolved, targetResolved);

  if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
    return { ok: false, error: "Resolved path escapes diagrams directory." };
  }

  return { ok: true, filename, filePath: targetResolved };
}

/**
 * Strictly resolves a static asset path inside `publicDir` preventing traversal across OSes.
 */
export function resolveSafeStaticPath(
  publicDir: string,
  urlPathname: string
): { ok: true; filePath: string } | { ok: false; status: number; error: string } {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPathname);
  } catch {
    return { ok: false, status: 400, error: "Malformed URL encoding" };
  }

  if (decoded.includes("\0") || decoded.includes("\\")) {
    return { ok: false, status: 400, error: "Invalid path characters" };
  }

  const relUrl = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const base = resolve(publicDir);
  const target = resolve(base, relUrl);
  const rel = relative(base, target);

  if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, filePath: target };
}

/**
 * Escapes all XML 1.0 special characters and strips invalid XML control chars.
 */
export function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formats text safely for Draw.io HTML/XML label attributes (escapes XML first, then maps newlines to &#xa;).
 */
export function escapeDrawioLabel(value: unknown): string {
  return escapeXml(value).replace(/\r?\n/g, "&#xa;");
}

/**
 * Sanitizes CSS/SVG colors for safe attribute interpolation.
 */
export function sanitizeColor(value: unknown, fallback: string): string {
  const s = String(value ?? "").trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(s) || s === "none") return s;
  return fallback;
}

export function finiteNum(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
