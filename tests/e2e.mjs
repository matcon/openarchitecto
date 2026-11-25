#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = resolve(dirname(__filename), "..");

async function getFreePort() {
  return new Promise((resolvePort, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close((err) => (err ? reject(err) : resolvePort(port)));
    });
  });
}

function runProcess(cmd, args, opts = {}) {
  return new Promise((resolveProc, reject) => {
    const child = spawn(cmd, args, { cwd: PROJECT_ROOT, ...opts });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => resolveProc({ code, stdout, stderr }));
  });
}

test("index.html inline scripts compile cleanly without personal/machine leaks", async () => {
  const html = await readFile(join(PROJECT_ROOT, "index.html"), "utf-8");

  assert.equal(html.includes("/home/mat"), false, "index.html must not contain /home/mat");
  assert.equal(/\bMatcon\b/i.test(html), false, "index.html must not contain personal handle Matcon");
  assert.equal(html.includes("19.876.543-2"), false, "index.html must not contain personal ID");

  const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptCount = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptCount += 1;
    assert.doesNotThrow(() => {
      new vm.Script(match[1], { filename: `index.html#script-${scriptCount}.js` });
    }, `Inline script #${scriptCount} failed JS syntax check`);
  }
  assert.ok(scriptCount >= 1, "Expected at least one inline script block in index.html");
});

test("MCP server supports Tools, Resources, Prompts, escaping, NLP flows, and sandboxed persistence", async () => {
  const tmpDiagrams = await mkdtemp(join(os.tmpdir(), "oa-mcp-"));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(PROJECT_ROOT, "dist", "mcp-server.js")],
    env: {
      ...process.env,
      OPENARCHITECTO_DIAGRAMS_DIR: tmpDiagrams,
      OPENARCHITECTO_STUDIO_URL: "http://127.0.0.1:5173",
    },
    stderr: "pipe",
  });

  const client = new Client({ name: "openarchitecto-e2e", version: "2.1.0" });
  try {
    await client.connect(transport);

    const toolsRes = await client.listTools();
    const toolNames = toolsRes.tools.map((t) => t.name).sort();
    assert.deepEqual(toolNames, [
      "create_diagram",
      "delete_diagram_from_studio",
      "export_diagram",
      "get_template",
      "list_catalogs",
      "list_templates",
      "load_diagram_from_studio",
      "prompt_to_diagram",
      "save_diagram_to_studio",
    ]);

    const resList = await client.listResources();
    assert.ok(resList.resources.some((r) => r.uri === "openarchitecto://catalogs"));

    const catalogRes = await client.readResource({ uri: "openarchitecto://catalogs" });
    const catalogs = JSON.parse(catalogRes.contents[0].text);
    assert.ok(Array.isArray(catalogs.bpmn) && catalogs.bpmn.length > 10);

    const tplRes = await client.readResource({ uri: "openarchitecto://templates/bpmn-telemedicina" });
    const tplJson = JSON.parse(tplRes.contents[0].text);
    assert.equal(tplJson.diagramType, "bpmn");

    const promptRes = await client.getPrompt({
      name: "design-bpmn-process",
      arguments: { processName: "Checkout", actors: "Cliente, Sistema" },
    });
    assert.match(promptRes.messages[0].content.text, /Checkout/);

    // Valid diagram with XML special chars & <<interface>> stereotype
    const validDiagram = {
      title: "Auth & Order <Flow>",
      diagramType: "uml",
      groups: [{ id: "g1", type: "uml_package", name: "Core & Auth", sub: "v2 <= 3", x: 40, y: 40, w: 700, h: 400 }],
      nodes: [
        { id: "n1", tpl: "uml_interface", name: "<<interface>> IAuth", sub1: "+ verify(a & b): Bool", x: 100, y: 120 },
        { id: "n2", tpl: "uml_class", name: "SessionService", sub1: "+ token <= ttl", x: 420, y: 120 },
      ],
      edges: [
        { id: "e1", source: "n2", target: "n1", label: "implements & checks", style: "async", step: "1" },
      ],
    };

    const created = await client.callTool({ name: "create_diagram", arguments: validDiagram });
    assert.notEqual(created.isError, true);

    // Invalid edge referential integrity
    const brokenEdge = await client.callTool({
      name: "create_diagram",
      arguments: {
        ...validDiagram,
        edges: [{ id: "e_bad", source: "n1", target: "missing_node", label: "x", style: "primary", step: "1" }],
      },
    });
    assert.equal(brokenEdge.isError, true);

    // Duplicate IDs check
    const dupIds = await client.callTool({
      name: "create_diagram",
      arguments: {
        ...validDiagram,
        nodes: [...validDiagram.nodes, { ...validDiagram.nodes[0] }],
      },
    });
    assert.equal(dupIds.isError, true);

    // Smart arrow-flow NLP generation
    const nlpRes = await client.callTool({
      name: "prompt_to_diagram",
      arguments: { prompt: "Browser -> API Gateway -> Lambda -> DynamoDB" },
    });
    assert.notEqual(nlpRes.isError, true);
    const nlpJson = JSON.parse(nlpRes.content[0].text.replace(/^[\s\S]*?\n\n/, ""));
    assert.equal(nlpJson.nodes.length, 4);
    assert.equal(nlpJson.edges.length, 3);
    assert.deepEqual(nlpJson.edges.map((e) => e.step), ["1", "2", "3"]);

    // Draw.io XML export escaping & well-formed attributes
    const drawioRes = await client.callTool({
      name: "export_diagram",
      arguments: { diagram: validDiagram, format: "drawio" },
    });
    const drawioXml = drawioRes.content[0].text;
    assert.match(drawioXml, /<mxfile\b/);
    assert.equal(drawioXml.includes("round=1;"), false, "Draw.io export must use rounded=1;, not round=1;");
    assert.match(drawioXml, /&amp;/);
    assert.match(drawioXml, /&lt;&lt;interface&gt;&gt;/);

    // SVG export escaping & absence of port-handle UI artifacts
    const svgRes = await client.callTool({
      name: "export_diagram",
      arguments: { diagram: validDiagram, format: "svg" },
    });
    const svgText = svgRes.content[0].text;
    assert.match(svgText, /^<svg\b/);
    assert.equal(svgText.includes("port-handle"), false);
    assert.match(svgText, /&amp;/);

    // Save / List / Load / Delete lifecycle inside sandboxed temp dir
    const saved = await client.callTool({
      name: "save_diagram_to_studio",
      arguments: { filename: "e2e_uml", diagram: validDiagram },
    });
    assert.notEqual(saved.isError, true);

    const listed = await client.callTool({ name: "load_diagram_from_studio", arguments: {} });
    const listObj = JSON.parse(listed.content[0].text);
    assert.ok(listObj.available_diagrams.includes("e2e_uml.json"));

    const loaded = await client.callTool({ name: "load_diagram_from_studio", arguments: { filename: "e2e_uml.json" } });
    const loadedObj = JSON.parse(loaded.content[0].text);
    assert.equal(loadedObj.title, validDiagram.title);

    // Traversal filename stays safely sandboxed (never reads /etc/passwd)
    const traversal = await client.callTool({ name: "load_diagram_from_studio", arguments: { filename: "../../etc/passwd" } });
    assert.equal(traversal.isError, true);

    const deleted = await client.callTool({ name: "delete_diagram_from_studio", arguments: { filename: "e2e_uml.json" } });
    assert.notEqual(deleted.isError, true);
  } finally {
    await transport.close().catch(() => {});
    await rm(tmpDiagrams, { recursive: true, force: true });
  }
});

test("HTTP Studio server serves UI, healthcheck, CRUD API, and blocks path traversal", async () => {
  const tmpDiagrams = await mkdtemp(join(os.tmpdir(), "oa-http-"));
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const srv = spawn(process.execPath, [join(PROJECT_ROOT, "dist", "servidor.js")], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      OPENARCHITECTO_DIAGRAMS_DIR: tmpDiagrams,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    let healthy = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`${baseUrl}/api/health`);
        if (res.ok) {
          const data = await res.json();
          assert.equal(data.status, "ok");
          assert.equal(data.version, "2.1.0");
          healthy = true;
          break;
        }
      } catch {
        // retry
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    assert.equal(healthy, true, "Studio HTTP server failed to pass /api/health within 3s");

    const homeRes = await fetch(`${baseUrl}/`);
    assert.equal(homeRes.status, 200);
    const homeHtml = await homeRes.text();
    assert.match(homeHtml, /OpenArchitecto/);

    // Save via REST POST
    const postRes = await fetch(`${baseUrl}/api/diagrams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "http_e2e",
        title: "HTTP E2E Diagram",
        diagramType: "cloud",
        groups: [],
        nodes: [{ id: "n1", tpl: "ec2", name: "EC2", x: 100, y: 100 }],
        edges: [],
      }),
    });
    assert.equal(postRes.status, 200);

    const listRes = await fetch(`${baseUrl}/api/diagrams`);
    assert.equal(listRes.status, 200);
    const listJson = await listRes.json();
    assert.ok(Array.isArray(listJson) && listJson.some((d) => d.filename === "http_e2e.json"));

    const getRes = await fetch(`${baseUrl}/api/diagrams/http_e2e.json`);
    assert.equal(getRes.status, 200);
    const getJson = await getRes.json();
    assert.equal(getJson.title, "HTTP E2E Diagram");

    const delRes = await fetch(`${baseUrl}/api/diagrams/http_e2e.json`, { method: "DELETE" });
    assert.equal(delRes.status, 200);

    const missingRes = await fetch(`${baseUrl}/api/diagrams/http_e2e.json`);
    assert.equal(missingRes.status, 404);

    // Invalid JSON returns 400
    const badJsonRes = await fetch(`${baseUrl}/api/diagrams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{bad json",
    });
    assert.equal(badJsonRes.status, 400);

    // Path traversal blocked
    const travRes = await fetch(`${baseUrl}/%2e%2e/etc/passwd`);
    assert.ok(travRes.status === 403 || travRes.status === 404);
  } finally {
    srv.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 150));
    await rm(tmpDiagrams, { recursive: true, force: true });
  }
});

test("Cross-platform installer dry-run completes cleanly", async () => {
  const res = await runProcess(process.execPath, [
    join(PROJECT_ROOT, "scripts", "install.mjs"),
    "--dry-run",
    "--scope=project",
  ]);
  assert.equal(res.code, 0, `Installer dry-run failed: ${res.stderr}`);
  assert.match(res.stdout, /Dry-run complete\./);
});
