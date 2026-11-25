---
name: openarchitecto
description: Design, validate, export, and persist multi-domain architecture diagrams (Multi-Cloud AWS/GCP/Azure/K8s, BPMN 2.0, UML 2.5, C4 Model, ERD, Flowcharts) using OpenArchitecto MCP tools and resources. Use when users request system architecture diagrams, BPMN workflows with pools and swimlanes, UML models, C4 boundaries, ERDs, or Draw.io (.drawio) exports.
---

# OpenArchitecto — Multi-Domain Architecture Diagramming

Use the **OpenArchitecto MCP** server (`mcp-server.ts` / `dist/mcp-server.js`) to build, validate, persist, and export structured diagrams synchronized with **OpenArchitecto Studio** (`index.html` served by `servidor.ts` / `dist/servidor.js`).

> For exact `tpl` stencil IDs, `groups` zone types, template IDs, and JSON payload schemas, read [references/catalog-and-schemas.md](references/catalog-and-schemas.md).

## Standard Operating Workflow

1. **Discover Valid Stencils & Templates**
   - Call `list_catalogs` (with `domain`: `"all"`, `"cloud"`, `"uml"`, `"bpmn"`, `"c4"`, `"erd"`, `"flowchart"`, or `"groups"`) or read MCP Resource `openarchitecto://catalogs`.
   - Call `list_templates` (or `get_template`) when starting from an existing architecture pattern (`medicapp-cloud`, `bpmn-telemedicina`, `uml-class-medicapp`, `uml-sequence-auth`, `c4-medicapp-containers`, `erd-hospital`, `flowchart-triage`).
   - Only use `tpl` and `group.type` IDs returned by the catalog or listed in [references/catalog-and-schemas.md](references/catalog-and-schemas.md).

2. **Bootstrap from Natural Language (Optional)**
   - Call `prompt_to_diagram` when turning rough prose or arrow chains (for example `Browser -> API Gateway -> Lambda -> DynamoDB`) into an initial layout, then refine coordinates, zones, and `step` numbers before saving.

3. **Author Structured Diagrams (`create_diagram`)**
   - **Boundaries (`groups`)**: Place enclosing zones first (lower z-order):
     - *Cloud*: `aws_cloud` > `vpc` > `public_subnet` / `private_subnet` / `k8s_cluster` / `region` / `datacenter`
     - *BPMN 2.0*: `bpmn_pool` > horizontal `bpmn_lane` rows (+ `bpmn_subproc` / `bpmn_trans` where needed)
     - *C4 / UML*: `c4_boundary` or `uml_package`
   - **Components (`nodes`)**: Align coordinates to a `20px` grid. Keep `>= 220px` horizontal and `>= 140px` vertical spacing between node centers so labels and connectors remain legible.
   - **Ordered Flows (`edges`)**: Every `source` and `target` must match an existing node or group `id`. Assign sequential string numbers (`"1"`, `"2"`, `"3"`, ...) to `edge.step` so **Presentation Mode** (`P` in Studio) steps cleanly through the flow.
   - **Edge Styles**: `"primary"` (main sync flow), `"sec"` (auth/security/control), `"async"` (events/queues/implements), `"error"` (exceptions/fault paths).

4. **Persist & Export**
   - Call `save_diagram_to_studio` with a safe filename stem (e.g., `checkout_bpmn`). OpenArchitecto resolves the output folder dynamically via `OPENARCHITECTO_DIAGRAMS_DIR` (or `<repo>/diagrams/` by default).
   - Call `export_diagram` with `format: "drawio"` for native `.drawio` XML (editable in diagrams.net / VS Code Draw.io Integration) or `format: "svg"` for vector graphics.
   - Use `load_diagram_from_studio` to inspect or iterate on existing diagrams, and `delete_diagram_from_studio` to clean up obsolete files.

## MCP Capabilities Inventory

| Kind | Identifier | Purpose |
| :--- | :--- | :--- |
| Tool | `list_catalogs` | Return valid node `tpl` IDs and container `groups` types |
| Tool | `list_templates` | List built-in starter templates across disciplines |
| Tool | `get_template` | Retrieve full JSON specification for a `templateId` |
| Tool | `create_diagram` | Validate structure, referential integrity, and normalize diagram JSON |
| Tool | `prompt_to_diagram` | Generate an auto-positioned diagram from prose or `A -> B -> C` flows |
| Tool | `export_diagram` | Render validated diagram or template to `.drawio` XML or `.svg` |
| Tool | `save_diagram_to_studio` | Persist diagram JSON safely to `$OPENARCHITECTO_DIAGRAMS_DIR` |
| Tool | `load_diagram_from_studio` | List saved studio JSON files or load one by filename |
| Tool | `delete_diagram_from_studio` | Remove a saved studio JSON file safely |
| Resource | `openarchitecto://catalogs` | Read-only JSON catalog of all domains |
| Resource | `openarchitecto://templates/{templateId}` | Read-only template JSON with URI completion |
| Resource | `openarchitecto://diagrams/{filename}` | Read-only saved diagram JSON with URI completion |
| Prompt | `design-architecture` | Guided prompt for modeling a target `domain` + `requirements` |
| Prompt | `design-bpmn-process` | Guided prompt for BPMN 2.0 modeling with pools and swimlanes |

## Runtime Environment Variables

- `OPENARCHITECTO_DIAGRAMS_DIR`: Directory where JSON diagrams are read/saved (default: `<projectRoot>/diagrams`).
- `PORT` / `OPENARCHITECTO_PORT`: HTTP port for Web Studio (default: `5173`).
- `HOST` / `OPENARCHITECTO_HOST`: Bind address for Web Studio (default: `127.0.0.1`).
- `OPENARCHITECTO_STUDIO_URL`: Base URL returned in tool responses (default: `http://127.0.0.1:5173`).
