#!/usr/bin/env node
/**
 * OpenArchitecto Studio — Cross-Platform HTTP & REST API Server
 * Runs natively on Node.js >= 18 and Bun (Linux, macOS, Windows) with zero external DBs.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdir, readdir, readFile, realpath, stat, unlink, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import {
  getRuntimeConfig,
  resolveSafeDiagramPath,
  resolveSafeStaticPath,
  sanitizeDiagramStem,
} from "./shared.js";

const config = getRuntimeConfig(import.meta.url);
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MiB

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".drawio": "application/xml; charset=utf-8",
};

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}

function sendText(res: ServerResponse, status: number, text: string, contentType = "text/plain; charset=utf-8"): void {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(text),
    "X-Content-Type-Options": "nosniff",
  });
  res.end(text);
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > MAX_BODY_BYTES) {
      const err = new Error("Payload Too Large");
      (err as Error & { statusCode?: number }).statusCode = 413;
      throw err;
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString("utf-8").trim();
  if (!raw) {
    const err = new Error("Empty JSON body");
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    const err = new Error("Expected JSON object");
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }
  return parsed as Record<string, unknown>;
}

async function listDiagramsMetadata(): Promise<unknown[]> {
  const files = await readdir(config.diagramsDir);
  const list: unknown[] = [];

  for (const f of files.sort()) {
    if (!f.endsWith(".json")) continue;
    const safe = resolveSafeDiagramPath(config.diagramsDir, f);
    if (!safe.ok) continue;

    try {
      const content = JSON.parse(await readFile(safe.filePath, "utf-8"));
      list.push({
        filename: safe.filename,
        id: content.id || safe.filename.replace(/\.json$/, ""),
        title: content.title || safe.filename.replace(/\.json$/, ""),
        diagramType: content.diagramType || "cloud",
        nodeCount: Array.isArray(content.nodes) ? content.nodes.length : 0,
        groupCount: Array.isArray(content.groups) ? content.groups.length : 0,
        updatedAt: content.updatedAt || new Date().toISOString(),
      });
    } catch {
      list.push({
        filename: safe.filename,
        id: safe.filename.replace(/\.json$/, ""),
        title: safe.filename,
      });
    }
  }
  return list;
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const method = req.method || "GET";
  const hostHeader = req.headers.host || `localhost:${config.port}`;
  const url = new URL(req.url || "/", `http://${hostHeader}`);

  // Local CORS headers for seamless browser/tooling usage
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Healthcheck
  if (url.pathname === "/api/health" && method === "GET") {
    sendJson(res, 200, {
      status: "ok",
      version: "2.1.0",
      diagramsDir: config.diagramsDir,
      host: config.host,
      port: config.port,
    });
    return;
  }

  // SVG Favicon
  if (url.pathname === "/favicon.ico" && method === "GET") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#232F3E"/><path d="M7 11h18M7 16h18M7 21h18" stroke="#ED7100" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    sendText(res, 200, svg, "image/svg+xml");
    return;
  }

  // REST API: List & Create/Update diagrams
  if (url.pathname === "/api/diagrams" && method === "GET") {
    try {
      const list = await listDiagramsMetadata();
      sendJson(res, 200, list);
    } catch (err) {
      sendJson(res, 500, { error: (err as Error).message });
    }
    return;
  }

  if (url.pathname === "/api/diagrams" && method === "POST") {
    try {
      const body = await readJsonBody(req);
      const rawName = String(body.filename || body.id || body.title || `diag_${Date.now()}`);
      const stem = sanitizeDiagramStem(rawName);
      const safe = resolveSafeDiagramPath(config.diagramsDir, stem);
      if (!safe.ok) {
        sendJson(res, 400, { error: safe.error });
        return;
      }

      const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : stem;
      const payload = {
        ...body,
        id,
        filename: safe.filename,
        updatedAt: new Date().toISOString(),
      };
      await writeFile(safe.filePath, JSON.stringify(payload, null, 2), "utf-8");
      sendJson(res, 200, { success: true, filename: safe.filename, id });
    } catch (err) {
      const status = (err as Error & { statusCode?: number }).statusCode || 400;
      sendJson(res, status, { error: (err as Error).message });
    }
    return;
  }

  // REST API: Get or Delete single diagram
  if (url.pathname.startsWith("/api/diagrams/")) {
    let rawSegment: string;
    try {
      rawSegment = decodeURIComponent(url.pathname.slice("/api/diagrams/".length));
    } catch {
      sendJson(res, 400, { error: "Malformed diagram filename encoding" });
      return;
    }

    const safe = resolveSafeDiagramPath(config.diagramsDir, rawSegment);
    if (!safe.ok) {
      sendJson(res, 400, { error: safe.error });
      return;
    }

    if (method === "GET") {
      try {
        const raw = await readFile(safe.filePath, "utf-8");
        sendText(res, 200, raw, "application/json; charset=utf-8");
      } catch {
        sendJson(res, 404, { error: "Diagrama no encontrado" });
      }
      return;
    }

    if (method === "DELETE") {
      try {
        await unlink(safe.filePath);
        sendJson(res, 200, { success: true, message: "Eliminado correctamente" });
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        sendJson(res, code === "ENOENT" ? 404 : 500, {
          error: code === "ENOENT" ? "Diagrama no encontrado" : "No se pudo eliminar el diagrama",
        });
      }
      return;
    }

    sendJson(res, 405, { error: "Method Not Allowed" });
    return;
  }

  // Static files inside projectRoot
  if (method !== "GET" && method !== "HEAD") {
    sendText(res, 405, "Method Not Allowed");
    return;
  }

  const staticResolved = resolveSafeStaticPath(config.projectRoot, url.pathname);
  if (!staticResolved.ok) {
    sendText(res, staticResolved.status, staticResolved.error);
    return;
  }

  try {
    const rootReal = await realpath(resolve(config.projectRoot));
    const targetReal = await realpath(staticResolved.filePath);
    if (targetReal !== rootReal && !targetReal.startsWith(rootReal + (rootReal.endsWith("/") || rootReal.endsWith("\\") ? "" : process.platform === "win32" ? "\\" : "/"))) {
      sendText(res, 403, "Forbidden");
      return;
    }
    const info = await stat(targetReal);
    if (!info.isFile()) {
      sendText(res, 404, "Not Found");
      return;
    }
    const ext = extname(targetReal).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";
    const data = await readFile(targetReal);
    res.writeHead(200, {
      "Content-Type": mime,
      "Content-Length": data.length,
      "X-Content-Type-Options": "nosniff",
    });
    res.end(method === "HEAD" ? undefined : data);
  } catch {
    sendText(res, 404, "Not Found");
  }
}

await mkdir(config.diagramsDir, { recursive: true });

const server = createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error("Unhandled request error:", err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "Internal Server Error" });
    }
  });
});

server.listen(config.port, config.host, () => {
  console.log(`🚀 Architect Studio Pro activo en ${config.studioUrl}`);
  console.log(`📁 Directorio de diagramas: ${config.diagramsDir}`);
});

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
