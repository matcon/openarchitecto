# Matriz de Trazabilidad SDD/TDD - OpenArchitecto

| Elemento Fuente | Tipo | Criterio SDD Asociado | Ciclo TDD Requerido |
| --- | --- | --- | --- |
| `RF-01: Generacion de DiagramSpec tipado (nodos, aristas, zonas, proveedor) desde prompt en lenguaje natural con LLM (BYOK).` | Requerimiento Funcional | `CA-BE-01` | RED -> GREEN -> REFACTOR |
| `RF-02: Renderizado determinista (ELK) sobre lienzo interactivo editable (React Flow / Excalidraw) con iconos AWS, GCP, Azure y Kubernetes.` | Requerimiento Funcional | `CA-BE-01` | RED -> GREEN -> REFACTOR |
| `RF-03: Importacion de IaC (Terraform HCL / Docker Compose / K8s YAML) a grafo de arquitectura versionado.` | Requerimiento Funcional | `CA-BE-01` | RED -> GREEN -> REFACTOR |
| `RF-04: Exportacion bidireccional a Terraform HCL, Mermaid, Draw.io XML y PNG/SVG.` | Requerimiento Funcional | `CA-BE-01` | RED -> GREEN -> REFACTOR |
| `RF-05: Analizador STRIDE automatizado vinculado a nodos y aristas del grafo con mitigaciones concretas.` | Requerimiento Funcional | `CA-BE-01` | RED -> GREEN -> REFACTOR |
| `RF-06: Estimador de costos cloud mensual (USD) por nodo/servicio usando catalogo de precios o integracion Infracost.` | Requerimiento Funcional | `CA-BE-01` | RED -> GREEN -> REFACTOR |
| `RF-07: Documentacion viva (ADR + Design Doc Markdown) sincronizada con la version activa del diagrama.` | Requerimiento Funcional | `CA-BE-01` | RED -> GREEN -> REFACTOR |
| `RF-08: Comparador de versiones (Architecture Diff) entre snapshots del grafo con resumen de impacto.` | Requerimiento Funcional | `CA-BE-01` | RED -> GREEN -> REFACTOR |
| `RNF-01: Latencia p95 <= 150 ms en endpoints CRUD/diff y <= 8000 ms en generacion LLM (streaming SSE).` | Requerimiento No Funcional | `CA-FE-03` | Regresion + Medicion |
| `RNF-02: Cobertura de pruebas unitarias de dominio >= 85% y 100% de contratos API en verde.` | Requerimiento No Funcional | `CA-FE-03` | Regresion + Medicion |
| `RNF-03: Accesibilidad WCAG 2.1 AA con 0 violaciones criticas/serias (axe-core) y contraste >= 4.5:1.` | Requerimiento No Funcional | `CA-FE-03` | Regresion + Medicion |
| `RNF-04: Aislamiento de llaves API (BYOK) cifradas en reposo (AES-256-GCM), sin exponer secretos en cliente ni logs.` | Requerimiento No Funcional | `CA-FE-03` | Regresion + Medicion |
| `RNF-05: Despliegue self-hosted en contenedores Docker multi-stage non-root bajo principios Twelve-Factor App.` | Requerimiento No Funcional | `CA-FE-03` | Regresion + Medicion |
| `TC-01: Prompt valido genera DiagramSpec conforme a JSON Schema v2020-12 sin nodos huerfanos.` | Caso de Prueba Documentado | `CA-BE-01` | Automatizado en CI |
| `TC-02: Layout ELK produce coordenadas finitas sin solapamiento de bounding boxes.` | Caso de Prueba Documentado | `CA-BE-01` | Automatizado en CI |
| `TC-03: Parser Terraform extrae recursos AWS/GCP/Azure y genera grafo equivalente.` | Caso de Prueba Documentado | `CA-BE-01` | Automatizado en CI |
| `TC-04: Analizador STRIDE clasifica al menos 1 amenaza por frontera de confianza (trust boundary).` | Caso de Prueba Documentado | `CA-BE-01` | Automatizado en CI |
| `TC-05: Estimador de costos calcula total mensual determinista (>= 0 USD) y desglose por recurso.` | Caso de Prueba Documentado | `CA-BE-01` | Automatizado en CI |
| `TC-06: Diff entre snapshot v1 y v2 detecta nodos agregados, eliminados y modificados con 100% precision.` | Caso de Prueba Documentado | `CA-BE-01` | Automatizado en CI |
| `TC-07: Exportacion a .drawio XML valida estructura mxGraphModel bien formada.` | Caso de Prueba Documentado | `CA-BE-01` | Automatizado en CI |
| `TC-08: Llave API BYOK almacenada cifrada nunca aparece en respuestas HTTP ni trazas.` | Caso de Prueba Documentado | `CA-BE-01` | Automatizado en CI |
