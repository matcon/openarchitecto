# Reporte Consolidado SDD + TDD — OpenArchitecto

## 1. Benchmark Open Source (GitHub) vs. Architecto.dev

No existe hoy un unico repositorio open source que replique el 100% de [Architecto.dev](https://architecto.dev/es/features) (canvas IA + multi-cloud + IaC + STRIDE + FinOps + documentacion viva + diff), pero si bloques abiertos reutilizables:

- **Canvas IA editable:** [Itz-Agasta/OpenDiagram](https://github.com/Itz-Agasta/OpenDiagram) (AGPL-3.0, Excalidraw + ELK + Next.js/Bun), [DayuanJiang/next-ai-draw-io](https://github.com/DayuanJiang/next-ai-draw-io) (Apache-2.0, draw.io + IA + MCP), [dmux/OpenArchFlow](https://github.com/dmux/OpenArchFlow) (MIT, AWS + Terraform + emulador local) y [CodingFeng101/CanvasAnvil](https://github.com/CodingFeng101/CanvasAnvil).
- **Diagram-as-Code / C4:** [likec4/likec4](https://github.com/likec4/likec4), [structurizr/structurizr](https://github.com/structurizr/structurizr) y [mingrammer/diagrams](https://github.com/mingrammer/diagrams) (Python, MIT).
- **IaC a Diagrama:** [patrickchugh/terravision](https://github.com/patrickchugh/terravision) y [mchittineni/tf-arch-diagram-generator](https://github.com/mchittineni/tf-arch-diagram-generator).
- **Modelado de Amenazas STRIDE:** [mrwadams/stride-gpt](https://github.com/mrwadams/stride-gpt) y [OWASP/AI-Threat-Modeler](https://github.com/OWASP/AI-Threat-Modeler/blob/main/docs/owasp-project-application.md).
- **FinOps / Costos Cloud:** [infracost/infracost](https://github.com/infracost/infracost) (Apache-2.0).

## 2. Arquitectura Propuesta para OpenArchitecto

- **Backend (Arquitectura Hexagonal):** FastAPI (Python 3.12), Pydantic v2, PostgreSQL 16, SQLAlchemy 2.0 + Alembic.
- **Frontend (Design-System-First):** Next.js + TypeScript + Tailwind CSS + React Flow / Excalidraw + ELK.js, gobernado por `design-system/openarchitecto/MASTER.md`.
- **Contratos Clave:**
  1. El LLM nunca genera pixeles ni XML libre: emite un `DiagramSpec` JSON tipado validado con JSON Schema.
  2. El motor ELK calcula posiciones deterministas (0 solapamientos).
  3. Los modulos STRIDE, FinOps y Diff operan sobre el mismo grafo versionado (`diagram_snapshots`).
  4. Despliegue self-hosted con Docker multi-stage non-root (Twelve-Factor App) y llaves BYOK cifradas con AES-256-GCM.

## 3. Resultados de Auditoria del Kit

- **SDD (`manifiesto_sdd.json`):** `APROBADO` (11/11 criterios aprobados, 0 avisos de ambiguedad).
- **TDD (`manifiesto_tdd.json`):** `APROBADO` (0 errores en disciplina RED -> GREEN -> REFACTOR).
- **UI/UX Pro Max Gate:** `design-system/openarchitecto/MASTER.md` generado y listo antes de codificar componentes.
