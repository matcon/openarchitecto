#!/usr/bin/env node
/**
 * OpenArchitecto — Cross-Platform MCP Server (Model Context Protocol)
 * Runs natively over Stdio (JSON-RPC 2.0) on Node.js >= 18 and Bun (Linux, macOS, Windows).
 * Exposes Tools, Resources, and Prompts for Multi-Cloud, BPMN 2.0, UML 2.5, C4 Model, ERD, and Flowcharts.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  escapeDrawioLabel,
  escapeXml,
  finiteNum,
  getRuntimeConfig,
  resolveSafeDiagramPath,
  sanitizeColor,
  sanitizeDiagramStem,
} from "./shared.js";

const config = getRuntimeConfig(import.meta.url);
const DIAGRAMS_DIR = config.diagramsDir;
await mkdir(DIAGRAMS_DIR, { recursive: true });

// ==================== 1. CATÁLOGOS MULTI-DOMINIO ====================
const CATALOGS = {
  cloud: {
    aws: [
      { id: "users", name: "Usuarios / Clientes", role: "Web PWA / Mobile Users", color: "#232F3E" },
      { id: "ec2", name: "Amazon EC2", role: "Compute Instance", color: "#ED7100" },
      { id: "lambda", name: "AWS Lambda", role: "Serverless Function", color: "#ED7100" },
      { id: "ecs", name: "Amazon ECS", role: "Contenedor OCI / Backend", color: "#ED7100" },
      { id: "fargate", name: "AWS Fargate", role: "Serverless Container Web", color: "#ED7100" },
      { id: "eks", name: "Amazon EKS", role: "Managed Kubernetes", color: "#ED7100" },
      { id: "alb", name: "Application Load Balancer", role: "Reverse Proxy TLS 1.3", color: "#8C4FFF" },
      { id: "cloudfront", name: "Amazon CloudFront", role: "CDN & Edge Relay", color: "#8C4FFF" },
      { id: "route53", name: "Amazon Route 53", role: "DNS Anycast & Failover", color: "#8C4FFF" },
      { id: "apigw", name: "API Gateway", role: "REST & WebSocket Gateway", color: "#8C4FFF" },
      { id: "rds", name: "Amazon RDS / Aurora", role: "PostgreSQL HA / Relational", color: "#C925D1" },
      { id: "dynamodb", name: "Amazon DynamoDB", role: "NoSQL Single-Table", color: "#C925D1" },
      { id: "redis", name: "ElastiCache Redis", role: "In-Memory Session & Cache", color: "#C925D1" },
      { id: "s3", name: "Amazon S3", role: "Object Lock WORM Storage", color: "#7AA116" },
      { id: "waf", name: "AWS WAF / Shield", role: "DDoS & OWASP Protection", color: "#DD344C" },
      { id: "kms", name: "AWS KMS / HSM", role: "Cifrado Envelope & Firma FEA", color: "#DD344C" },
      { id: "sqs", name: "Amazon SQS", role: "Queue & DLQ Asincrónica", color: "#E7157B" },
      { id: "bedrock", name: "Amazon Bedrock", role: "Modelos Fundacionales Generativos", color: "#01A88D" }
    ],
    gcp: [
      { id: "gcp_cloudrun", name: "GCP Cloud Run", role: "Contenedores Serverless", color: "#4285F4" },
      { id: "gcp_gke", name: "Google GKE", role: "Kubernetes Engine Autopilot", color: "#4285F4" },
      { id: "gcp_storage", name: "Google Cloud Storage", role: "Almacenamiento de Objetos", color: "#34A853" },
      { id: "gcp_bigquery", name: "BigQuery", role: "Data Warehouse Analítico Serverless", color: "#4285F4" },
      { id: "gcp_pubsub", name: "Google Cloud Pub/Sub", role: "Bus de Mensajería Global", color: "#EA4335" }
    ],
    azure: [
      { id: "az_appservice", name: "Azure App Service", role: "PaaS Web Hosting", color: "#0078D4" },
      { id: "az_functions", name: "Azure Functions", role: "Serverless Event-Driven", color: "#F2C811" },
      { id: "az_cosmos", name: "Azure Cosmos DB", role: "Base NoSQL Multimodelo", color: "#0078D4" },
      { id: "az_aks", name: "Azure AKS", role: "Kubernetes Service", color: "#0078D4" }
    ],
    kubernetes: [
      { id: "k8s_ingress", name: "K8s Ingress Controller", role: "Nginx / Traefik Gateway", color: "#326CE5" },
      { id: "k8s_pod", name: "Kubernetes Pod / Deployment", role: "Carga de Trabajo / Microservicio", color: "#326CE5" },
      { id: "docker", name: "Docker Container", role: "Contenedor OCI / Docker Engine", color: "#2496ED" },
      { id: "kafka", name: "Apache Kafka", role: "Streaming Event Hub", color: "#231F20" },
      { id: "fastapi", name: "FastAPI Backend", role: "API REST Async Python", color: "#009688" },
      { id: "react", name: "React Frontend", role: "Single Page App Client", color: "#61DAFB" }
    ]
  },
  uml: [
    { id: "uml_class", name: "Clase UML", role: "Entidad con Atributos y Métodos", color: "#2563EB" },
    { id: "uml_interface", name: "Interfaz UML", role: "<<interface>> Contrato de Métodos", color: "#0284C7" },
    { id: "uml_actor", name: "Actor UML", role: "Usuario o Sistema Externo", color: "#475569" },
    { id: "uml_usecase", name: "Caso de Uso UML", role: "Objetivo o Flujo de Negocio", color: "#7C3AED" },
    { id: "uml_lifeline", name: "Línea de Vida (Secuencia)", role: "Participante :Objeto en el tiempo", color: "#0D9488" },
    { id: "uml_state", name: "Estado UML", role: "Estado de Máquina de Estados", color: "#D97706" },
    { id: "uml_component", name: "Componente UML", role: "Subsistema con Puertos", color: "#059669" }
  ],
  bpmn: [
    { id: "bpmn_start", name: "Evento de Inicio Simple", role: "Start Event (Círculo Verde)", color: "#16A34A" },
    { id: "bpmn_start_msg", name: "Inicio por Mensaje", role: "Disparado por API / Evento", color: "#16A34A" },
    { id: "bpmn_start_timer", name: "Inicio por Temporizador", role: "Cron / Programado", color: "#16A34A" },
    { id: "bpmn_timer", name: "Evento Temporizador Intermedio", role: "Intermediate Timer Event", color: "#D97706" },
    { id: "bpmn_msg", name: "Evento Mensaje Intermedio", role: "Message Catching / Throwing", color: "#0284C7" },
    { id: "bpmn_error", name: "Captura de Error Intermedio", role: "Boundary Error Event", color: "#DC2626" },
    { id: "bpmn_link", name: "Enlace de Flujo Intermedio", role: "Link Intermediate Event", color: "#475569" },
    { id: "bpmn_end", name: "Evento de Fin Simple", role: "End Event (Círculo Rojo)", color: "#DC2626" },
    { id: "bpmn_end_msg", name: "Fin con Mensaje", role: "Notificación de Término", color: "#DC2626" },
    { id: "bpmn_end_term", name: "Fin de Terminación (Abortivo)", role: "Terminate End Event", color: "#DC2626" },
    { id: "bpmn_end_error", name: "Fin por Error", role: "Lanza Excepción Crítica", color: "#DC2626" },
    { id: "bpmn_user_task", name: "Tarea de Usuario", role: "User Task (Acción Humana / Formulario)", color: "#3B82F6" },
    { id: "bpmn_service_task", name: "Tarea de Servicio", role: "Service Task (Automática / API / Backend)", color: "#6366F1" },
    { id: "bpmn_send_task", name: "Tarea de Envío", role: "Send Task (Emite Mensaje / Email)", color: "#2563EB" },
    { id: "bpmn_recv_task", name: "Tarea de Recepción", role: "Receive Task (Espera Mensaje)", color: "#0284C7" },
    { id: "bpmn_script_task", name: "Tarea de Script", role: "Script Task (Ejecución de Código)", color: "#8B5CF6" },
    { id: "bpmn_rule_task", name: "Regla de Negocio (DMN)", role: "Business Rule Task (Matriz de Decisión)", color: "#0D9488" },
    { id: "bpmn_manual_task", name: "Tarea Manual", role: "Manual Task (Acción Física sin IT)", color: "#475569" },
    { id: "bpmn_gw_xor", name: "Compuerta Exclusiva (XOR)", role: "Decisión bifurcada 1 de N", color: "#EAB308" },
    { id: "bpmn_gw_and", name: "Compuerta Paralela (AND)", role: "Bifurcación / Unión Simultánea", color: "#EAB308" },
    { id: "bpmn_gw_or", name: "Compuerta Inclusiva (OR)", role: "Uno o más caminos activos", color: "#EAB308" },
    { id: "bpmn_gw_event", name: "Compuerta Basada en Eventos", role: "Espera de eventos múltiples", color: "#EAB308" },
    { id: "bpmn_gw_complex", name: "Compuerta Compleja", role: "Condición avanzada / Mincount", color: "#EAB308" },
    { id: "bpmn_data_object", name: "Objeto de Datos (Documento)", role: "Data Object (Ficha / Archivo / Receta)", color: "#475569" },
    { id: "bpmn_data_store", name: "Almacén de Datos (Data Store)", role: "Data Store (Base de Datos / Repositorio)", color: "#475569" },
    { id: "bpmn_annotation", name: "Anotación de Texto", role: "Text Annotation (Comentario / Nota)", color: "#64748B" }
  ],
  c4: [
    { id: "c4_person", name: "Persona C4", role: "[Person] Usuario o Actor del Sistema", color: "#08427B" },
    { id: "c4_system", name: "Sistema de Software C4", role: "[Software System] Sistema Central o Externo", color: "#1168BD" },
    { id: "c4_container", name: "Contenedor C4", role: "[Container] Web App, API, Worker", color: "#438DD5" },
    { id: "c4_db", name: "Base de Datos C4", role: "[Container: Database] RDBMS o NoSQL", color: "#438DD5" },
    { id: "c4_comp", name: "Componente C4", role: "[Component] Módulo, Servicio o Controller", color: "#85BBF0" }
  ],
  erd: [
    { id: "erd_table", name: "Entidad / Tabla Relacional", role: "Tabla con PK, FK y Columnas", color: "#0F766E" },
    { id: "erd_rel", name: "Relación ERD", role: "Rombo de Asociación y Cardinalidad", color: "#0F766E" }
  ],
  flowchart: [
    { id: "fc_process", name: "Paso de Proceso", role: "Acción, Operación o Transformación", color: "#2563EB" },
    { id: "fc_decision", name: "Decisión (Rombo)", role: "Condición booleana ¿Sí o No?", color: "#D97706" },
    { id: "fc_io", name: "Entrada / Salida", role: "Lectura de Datos o Emisión de Resultado", color: "#059669" },
    { id: "fc_term", name: "Inicio / Fin (Terminador)", role: "Punto de Entrada o Salida del Flujo", color: "#7C3AED" },
    { id: "fc_doc", name: "Documento", role: "Generación de Documento o Reporte", color: "#0891B2" }
  ],
  groups: [
    { type: "aws_cloud", name: "AWS Cloud", stroke: "#232F3E", sub: "Perímetro Cloud Principal" },
    { type: "vpc", name: "VPC Network", stroke: "#8C4FFF", sub: "10.0.0.0/16 Virtual Network" },
    { type: "public_subnet", name: "Public Subnet (DMZ)", stroke: "#7AA116", sub: "10.0.1.0/24 Subnet Pública" },
    { type: "private_subnet", name: "Private Subnet", stroke: "#00A4A6", sub: "10.0.2.0/24 Subnet Privada" },
    { type: "k8s_cluster", name: "Kubernetes Cluster / Namespace", stroke: "#326CE5", sub: "Cluster de Carga K8s" },
    { type: "region", name: "Region / Multi-AZ", stroke: "#00A4A6", sub: "us-east-1 / sa-east-1" },
    { type: "datacenter", name: "Data Center On-Premises", stroke: "#5A6C86", sub: "Infraestructura Local" },
    { type: "bpmn_pool", name: "BPMN Pool / Proceso", stroke: "#334155", sub: "Límite Organizacional o de Entidad" },
    { type: "bpmn_lane", name: "BPMN Swimlane / Carril", stroke: "#64748B", sub: "Carril de Rol" },
    { type: "bpmn_subproc", name: "BPMN Subproceso Embebido", stroke: "#334155", sub: "Actividad Contenedora [+]" },
    { type: "bpmn_trans", name: "BPMN Transacción / Límite", stroke: "#0284C7", sub: "Transacción ACID / Cancelable" },
    { type: "c4_boundary", name: "C4 System Boundary", stroke: "#1E40AF", sub: "Límite del Sistema de Software" },
    { type: "uml_package", name: "UML Package / Módulo", stroke: "#0369A1", sub: "Espacio de Nombres de Clases" }
  ]
};

// ==================== 2. PLANTILLAS PROFESIONALES ====================
const TEMPLATES_MAP: Record<string, any> = {
  "medicapp-cloud": {
    id: "medicapp-cloud",
    title: "MedicApp — Arquitectura Cloud Zero Trust & Target HA",
    diagramType: "cloud",
    desc: "Arquitectura Cloud Zero Trust: Cloudflare, DMZ, Backend Rust Axum, Data VLAN 30 y S3 WORM.",
    groups: [
      { id: "g_cloud", type: "aws_cloud", name: "Cloud Infrastructure — MedicApp (Zero Trust)", sub: "Defensa en Profundidad", x: 340, y: 40, w: 980, h: 770 },
      { id: "g_vpc", type: "vpc", name: "VPC / Host Hardened AZ1", sub: "8 vCPU • 32 GB ECC • Rootless", x: 365, y: 85, w: 930, h: 485 },
      { id: "g_dmz", type: "public_subnet", name: "DMZ Pública (dmz_net)", sub: "10.0.1.0/24 • nftables", x: 385, y: 135, w: 230, h: 415 },
      { id: "g_app", type: "private_subnet", name: "Servicios (app_net)", sub: "10.0.2.0/24 • Aislada", x: 645, y: 135, w: 280, h: 415 },
      { id: "g_data", type: "private_subnet", name: "Datos (data_net / VLAN 30)", sub: "10.0.3.0/24 • 0.0.0.0/0 DROP", x: 955, y: 135, w: 320, h: 415 }
    ],
    nodes: [
      { id: "n_users", tpl: "users", name: "Pacientes / Médicos", sub1: "Web PWA / Móvil", x: 40, y: 200 },
      { id: "n_cf", tpl: "waf", name: "Cloudflare Pro", sub1: "DNSSEC • DDoS • WAF", x: 195, y: 200 },
      { id: "n_caddy", tpl: "alb", name: "Caddy 2.7 + Coraza", sub1: "TLS 1.3 • TCP 443", x: 468, y: 200 },
      { id: "n_back", tpl: "ecs", name: "Backend Rust Axum", sub1: "TCP 3000 • Tokio WSS", x: 753, y: 315 },
      { id: "n_pg", tpl: "rds", name: "PostgreSQL 15.4", sub1: "TCP 5432 • ZFS", x: 1083, y: 185 },
      { id: "n_minio", tpl: "s3", name: "MinIO S3 WORM", sub1: "15 Años (Inmutable)", x: 1083, y: 440 }
    ],
    edges: [
      { id: "e1", source: "n_users", target: "n_cf", label: "TLS 1.3", style: "primary", step: "1" },
      { id: "e2", source: "n_cf", target: "n_caddy", label: "HTTPS 443", style: "primary", step: "2" },
      { id: "e3", source: "n_caddy", target: "n_back", label: "TCP 3000", style: "primary", step: "3" },
      { id: "e4", source: "n_back", target: "n_pg", label: "SQLx mTLS 5432", style: "primary", step: "4" },
      { id: "e5", source: "n_back", target: "n_minio", label: "S3 WORM 9000", style: "primary", step: "5" }
    ]
  },
  "uml-class-medicapp": {
    id: "uml-class-medicapp",
    title: "UML — Diagrama de Clases (Plataforma Médica)",
    diagramType: "uml",
    desc: "Modelo de dominio con clases Paciente, FichaClinica, Atencion, RecetaDigital y FirmaElectronica.",
    groups: [
      { id: "g_domain", type: "uml_package", name: "Package: Dominio Clínico", sub: "Modelos de Entidad y Reglas de Negocio", x: 60, y: 50, w: 980, h: 560 }
    ],
    nodes: [
      { id: "u_pac", tpl: "uml_class", name: "Paciente", sub1: "+ id: UUID\n+ nombres: String\n+ cobertura: Enum", x: 100, y: 140 },
      { id: "u_fic", tpl: "uml_class", name: "FichaClinica", sub1: "+ id: UUID\n+ fecha_apertura: Date\n+ getHistorial(): List", x: 400, y: 140 },
      { id: "u_ate", tpl: "uml_class", name: "AtencionTelemedica", sub1: "+ sala_webrtc: String\n+ iniciarLlamada(): Void\n+ finalizar(): Void", x: 400, y: 380 },
      { id: "u_rec", tpl: "uml_class", name: "RecetaDigital", sub1: "+ folio: String\n+ medicamentos: Array\n+ emitida: Boolean", x: 730, y: 140 },
      { id: "u_fea", tpl: "uml_class", name: "FirmaElectronicaAvanzada", sub1: "+ certificado: X509\n+ firmarDocumento(): ByteArr", x: 730, y: 380 },
      { id: "u_iface", tpl: "uml_interface", name: "<<interface>> IFirmaService", sub1: "+ firmarToken(): JWT\n+ validarCertificado(): Bool", x: 730, y: 500 }
    ],
    edges: [
      { id: "ue1", source: "u_pac", target: "u_fic", label: "1 tiene 1..*", style: "primary", step: "1" },
      { id: "ue2", source: "u_fic", target: "u_ate", label: "1 registra 0..*", style: "primary", step: "2" },
      { id: "ue3", source: "u_ate", target: "u_rec", label: "1 emite 0..1", style: "primary", step: "3" },
      { id: "ue4", source: "u_rec", target: "u_fea", label: "requiere firma", style: "sec", step: "4" },
      { id: "ue5", source: "u_fea", target: "u_iface", label: "implements", style: "async", step: "5" }
    ]
  },
  "uml-sequence-auth": {
    id: "uml-sequence-auth",
    title: "UML — Diagrama de Secuencia (Autenticación OAuth2 / JWT + MFA)",
    diagramType: "uml",
    desc: "Flujo temporal entre Usuario, API Gateway, Servicio de Identidad y Base de Datos.",
    groups: [],
    nodes: [
      { id: "seq_usr", tpl: "uml_lifeline", name: "Usuario: Cliente", sub1: "Línea de Vida Navegador", x: 80, y: 80 },
      { id: "seq_gw", tpl: "uml_lifeline", name: "API Gateway: Caddy", sub1: "Reverse Proxy TLS 1.3", x: 340, y: 80 },
      { id: "seq_auth", tpl: "uml_lifeline", name: "AuthService: Rust Axum", sub1: "Servicio de Tokens JWT", x: 600, y: 80 },
      { id: "seq_db", tpl: "uml_lifeline", name: "Database: PostgreSQL", sub1: "Tabla Credenciales", x: 860, y: 80 }
    ],
    edges: [
      { id: "se1", source: "seq_usr", target: "seq_gw", label: "POST /auth/login", style: "primary", step: "1" },
      { id: "se2", source: "seq_gw", target: "seq_auth", label: "Proxy Request mTLS", style: "primary", step: "2" },
      { id: "se3", source: "seq_auth", target: "seq_db", label: "SELECT hash_argon2id", style: "primary", step: "3" },
      { id: "se4", source: "seq_db", target: "seq_auth", label: "Credenciales Válidas [OK]", style: "async", step: "4" },
      { id: "se5", source: "seq_auth", target: "seq_usr", label: "Retorna Token JWT (exp: 15m)", style: "sec", step: "5" }
    ]
  },
  "bpmn-telemedicina": {
    id: "bpmn-telemedicina",
    title: "BPMN 2.0 — Proceso de Atención y Videoconsulta Médica",
    diagramType: "bpmn",
    desc: "Flujo BPMN con Swimlanes para Paciente, Admisión / Triage y Médico Especialista.",
    groups: [
      { id: "g_pool", type: "bpmn_pool", name: "Pool: Proceso de Telemedicina", sub: "Flujo Clínico E2E", x: 60, y: 50, w: 1040, h: 560 },
      { id: "g_lane_pac", type: "bpmn_lane", name: "Carril: Paciente", sub: "Portal Web / PWA", x: 90, y: 90, w: 980, h: 140 },
      { id: "g_lane_tri", type: "bpmn_lane", name: "Carril: Admisión & Triage", sub: "Validación Cobertura", x: 90, y: 250, w: 980, h: 150 },
      { id: "g_lane_med", type: "bpmn_lane", name: "Carril: Médico Especialista", sub: "Box Virtual WebRTC", x: 90, y: 420, w: 980, h: 160 }
    ],
    nodes: [
      { id: "bp_start", tpl: "bpmn_start", name: "Inicio Consulta", sub1: "Solicitud del Paciente", x: 120, y: 130 },
      { id: "bp_t1", tpl: "bpmn_user_task", name: "Ingresar Síntomas", sub1: "Formulario de Admisión", x: 260, y: 130 },
      { id: "bp_t2", tpl: "bpmn_service_task", name: "Validar Cobertura", sub1: "API Previsional", x: 260, y: 290 },
      { id: "bp_gw1", tpl: "bpmn_gw_xor", name: "¿Habilitado?", sub1: "Bifurcación XOR", x: 440, y: 290 },
      { id: "bp_t3", tpl: "bpmn_user_task", name: "Realizar Videoconsulta", sub1: "WebRTC Peer-to-Peer", x: 630, y: 460 },
      { id: "bp_doc", tpl: "bpmn_data_object", name: "Ficha Médica", sub1: "Documento [en curso]", x: 630, y: 290 },
      { id: "bp_t4", tpl: "bpmn_service_task", name: "Emitir Receta", sub1: "Firma Electrónica HSM", x: 820, y: 460 },
      { id: "bp_end", tpl: "bpmn_end_term", name: "Fin de Atención", sub1: "Cierre de Ficha", x: 990, y: 460 }
    ],
    edges: [
      { id: "bpe1", source: "bp_start", target: "bp_t1", label: "Inicia", style: "primary", step: "1" },
      { id: "bpe2", source: "bp_t1", target: "bp_t2", label: "Envía datos", style: "primary", step: "2" },
      { id: "bpe3", source: "bp_t2", target: "bp_gw1", label: "Resultado", style: "primary", step: "3" },
      { id: "bpe4", source: "bp_gw1", target: "bp_t3", label: "Sí (Habilitado)", style: "primary", step: "4" },
      { id: "bpe5", source: "bp_t3", target: "bp_doc", label: "Registra", style: "async", step: "5" },
      { id: "bpe6", source: "bp_t3", target: "bp_t4", label: "Diagnóstico", style: "primary", step: "6" },
      { id: "bpe7", source: "bp_t4", target: "bp_end", label: "Receta enviada", style: "primary", step: "7" }
    ]
  },
  "c4-medicapp-containers": {
    id: "c4-medicapp-containers",
    title: "C4 Model — Diagrama de Contenedores",
    diagramType: "c4",
    desc: "Diagrama C4 Nivel 2: Sistema principal, Contenedores SPA, API Gateway, Base de Datos y Sistemas Externos.",
    groups: [
      { id: "c4_bound", type: "c4_boundary", name: "System Boundary: Plataforma Digital", sub: "Arquitectura de Contenedores", x: 260, y: 60, w: 760, h: 540 }
    ],
    nodes: [
      { id: "c4_usr", tpl: "c4_person", name: "Usuario / Operador", sub1: "[Person]\nAccede vía Web/Móvil", x: 60, y: 220 },
      { id: "c4_spa", tpl: "c4_container", name: "Single-Page App", sub1: "[Container: React / Next.js]\nInterfaz de usuario", x: 310, y: 220 },
      { id: "c4_api", tpl: "c4_container", name: "API Backend", sub1: "[Container: Rust Axum]\nLógica de negocio", x: 570, y: 220 },
      { id: "c4_db", tpl: "c4_db", name: "Base de Datos", sub1: "[Container: PostgreSQL]\nDatos transaccionales", x: 830, y: 150 },
      { id: "c4_s3", tpl: "c4_db", name: "Storage MinIO", sub1: "[Container: S3 WORM]\nArchivos inmutables", x: 830, y: 310 },
      { id: "c4_ext", tpl: "c4_system", name: "Sistemas Externos", sub1: "[Software System]\nPagos, SSO, HSM", x: 1080, y: 220 }
    ],
    edges: [
      { id: "c4e1", source: "c4_usr", target: "c4_spa", label: "Visita app [HTTPS]", style: "primary", step: "1" },
      { id: "c4e2", source: "c4_spa", target: "c4_api", label: "Llamadas API [JSON/WSS]", style: "primary", step: "2" },
      { id: "c4e3", source: "c4_api", target: "c4_db", label: "Lee y escribe [SQLx]", style: "primary", step: "3" },
      { id: "c4e4", source: "c4_api", target: "c4_s3", label: "Guarda PDFs [S3 API]", style: "primary", step: "4" },
      { id: "c4e5", source: "c4_api", target: "c4_ext", label: "Verificación y Pagos [REST]", style: "sec", step: "5" }
    ]
  },
  "erd-hospital": {
    id: "erd-hospital",
    title: "ERD — Modelo Relacional de Historias Clínicas",
    diagramType: "erd",
    desc: "Diagrama Entidad-Relación de tablas: usuarios, fichas, atenciones y recetas.",
    groups: [],
    nodes: [
      { id: "erd_u", tpl: "erd_table", name: "usuarios", sub1: "PK id: UUID\nidentificador: VARCHAR(20) UNIQUE\nemail: VARCHAR(120)\nrol: ENUM('cliente','operador')", x: 80, y: 160 },
      { id: "erd_f", tpl: "erd_table", name: "fichas_clinicas", sub1: "PK id: UUID\nFK usuario_id: UUID\nfecha_creacion: TIMESTAMP\nestado: VARCHAR(20)", x: 380, y: 160 },
      { id: "erd_a", tpl: "erd_table", name: "atenciones", sub1: "PK id: UUID\nFK ficha_id: UUID\nFK especialista_id: UUID\nnotas: TEXT", x: 680, y: 160 },
      { id: "erd_r", tpl: "erd_table", name: "recetas_digitales", sub1: "PK id: UUID\nFK atencion_id: UUID\nfolio: VARCHAR(30)\ntoken_hash: VARCHAR(256)", x: 980, y: 160 }
    ],
    edges: [
      { id: "erde1", source: "erd_u", target: "erd_f", label: "1 a N", style: "primary", step: "1" },
      { id: "erde2", source: "erd_f", target: "erd_a", label: "1 a N", style: "primary", step: "2" },
      { id: "erde3", source: "erd_a", target: "erd_r", label: "1 a 0..1", style: "primary", step: "3" }
    ]
  },
  "flowchart-triage": {
    id: "flowchart-triage",
    title: "Flowchart — Algoritmo de Clasificación de Urgencia",
    diagramType: "flowchart",
    desc: "Diagrama de flujo del algoritmo de clasificación clínica de urgencias.",
    groups: [],
    nodes: [
      { id: "fc_1", tpl: "fc_term", name: "Llegada Paciente", sub1: "Inicio de Triage", x: 100, y: 220 },
      { id: "fc_2", tpl: "fc_io", name: "Ingresar Constantes Vitales", sub1: "PA, FC, SatO2, Temp", x: 280, y: 220 },
      { id: "fc_3", tpl: "fc_decision", name: "¿Riesgo Vital Inmediato?", sub1: "Paro / Shock / Coma", x: 490, y: 200 },
      { id: "fc_4", tpl: "fc_process", name: "Asignar Nivel C1 (Reanimación)", sub1: "Atención Inmediata", x: 740, y: 80 },
      { id: "fc_5", tpl: "fc_decision", name: "¿Dolor Severo o Alteración?", sub1: "Escala EVA > 7", x: 740, y: 320 },
      { id: "fc_6", tpl: "fc_process", name: "Asignar Nivel C2 (Emergencia)", sub1: "Atención <= 15 minutos", x: 1000, y: 230 },
      { id: "fc_7", tpl: "fc_process", name: "Asignar Nivel C3/C4 (Urgencia Menor)", sub1: "Sala de Espera Controlada", x: 1000, y: 410 }
    ],
    edges: [
      { id: "fce1", source: "fc_1", target: "fc_2", label: "", style: "primary", step: "1" },
      { id: "fce2", source: "fc_2", target: "fc_3", label: "", style: "primary", step: "2" },
      { id: "fce3", source: "fc_3", target: "fc_4", label: "Sí (Crítico)", style: "sec", step: "3a" },
      { id: "fce4", source: "fc_3", target: "fc_5", label: "No", style: "primary", step: "3b" },
      { id: "fce5", source: "fc_5", target: "fc_6", label: "Sí", style: "sec", step: "4a" },
      { id: "fce6", source: "fc_5", target: "fc_7", label: "No", style: "async", step: "4b" }
    ]
  }
};

// ==================== 3. GENERADOR INTELIGENTE DE DIAGRAMAS POR TEXTO ====================
function inferStencilForText(label: string, diagramType: string): { tpl: string; sub1: string } {
  const s = label.toLowerCase();

  if (diagramType === "bpmn") {
    if (/(inicio|start|comienzo|llegada)/.test(s)) return { tpl: "bpmn_start", sub1: "Start Event" };
    if (/(fin|end|cierre|termina)/.test(s)) return { tpl: "bpmn_end_term", sub1: "End Event" };
    if (/(xor|\?|decision|decisión|validar|si\/no|habilitado|aprobar)/.test(s)) return { tpl: "bpmn_gw_xor", sub1: "Gateway XOR" };
    if (/(paralelo|and|simult)/.test(s)) return { tpl: "bpmn_gw_and", sub1: "Gateway AND" };
    if (/(timer|espera|cron|plazo)/.test(s)) return { tpl: "bpmn_timer", sub1: "Timer Event" };
    if (/(documento|ficha|receta|archivo|pdf)/.test(s)) return { tpl: "bpmn_data_object", sub1: "Data Object" };
    if (/(base de datos|almacen|almacén|bd|db|postgres)/.test(s)) return { tpl: "bpmn_data_store", sub1: "Data Store" };
    if (/(api|servicio|auto|webhook|notific|emitir|sistema)/.test(s)) return { tpl: "bpmn_service_task", sub1: "Service Task" };
    return { tpl: "bpmn_user_task", sub1: "User Task" };
  }

  if (diagramType === "c4") {
    if (/(usuario|persona|cliente|paciente|medico|médico|actor)/.test(s)) return { tpl: "c4_person", sub1: "[Person]" };
    if (/(postgres|mysql|mongo|db|base de datos|redis|s3|minio|storage)/.test(s)) return { tpl: "c4_db", sub1: "[Container: DB]" };
    if (/(extern|stripe|oauth|fonasa|pasarela|correo)/.test(s)) return { tpl: "c4_system", sub1: "[Software System]" };
    return { tpl: "c4_container", sub1: "[Container]" };
  }

  if (diagramType === "uml") {
    if (/(interface|interfaz)/.test(s)) return { tpl: "uml_interface", sub1: "<<interface>>" };
    if (/(usuario|actor|cliente|paciente)/.test(s)) return { tpl: "uml_actor", sub1: "Actor" };
    if (/(secuencia|lifeline|gateway|service)/.test(s)) return { tpl: "uml_lifeline", sub1: ":Participant" };
    return { tpl: "uml_class", sub1: "+ id: UUID\n+ execute(): void" };
  }

  if (diagramType === "erd") {
    return { tpl: "erd_table", sub1: "PK id: UUID\ncreated_at: TIMESTAMP" };
  }

  if (diagramType === "flowchart") {
    if (/(inicio|fin|start|end)/.test(s)) return { tpl: "fc_term", sub1: "Terminator" };
    if (/(\?|si|sí|no|decision|decisión|validar)/.test(s)) return { tpl: "fc_decision", sub1: "Decision" };
    if (/(leer|ingresar|input|output|imprimir)/.test(s)) return { tpl: "fc_io", sub1: "I/O" };
    if (/(reporte|documento|pdf)/.test(s)) return { tpl: "fc_doc", sub1: "Document" };
    return { tpl: "fc_process", sub1: "Process" };
  }

  // Cloud & Infrastructure heuristics
  if (/(usuario|user|cliente|browser|m[oó]vil|paciente)/.test(s)) return { tpl: "users", sub1: "Client / Browser" };
  if (/(cloudflare|waf|shield|firewall|ddos)/.test(s)) return { tpl: "waf", sub1: "WAF / Edge Security" };
  if (/(cloudfront|cdn)/.test(s)) return { tpl: "cloudfront", sub1: "CDN Edge" };
  if (/(route53|dns)/.test(s)) return { tpl: "route53", sub1: "DNS Anycast" };
  if (/(alb|caddy|nginx|traefik|balanceador|proxy)/.test(s)) return { tpl: "alb", sub1: "Reverse Proxy / LB" };
  if (/(api gateway|apigw)/.test(s)) return { tpl: "apigw", sub1: "API Gateway" };
  if (/(ingress)/.test(s)) return { tpl: "k8s_ingress", sub1: "K8s Ingress" };
  if (/(lambda|serverless|function)/.test(s)) return { tpl: "lambda", sub1: "Serverless Function" };
  if (/(fargate)/.test(s)) return { tpl: "fargate", sub1: "Serverless Container" };
  if (/(eks|gke|aks|kubernetes|k8s)/.test(s)) return { tpl: "k8s_pod", sub1: "K8s Workload" };
  if (/(fastapi|python)/.test(s)) return { tpl: "fastapi", sub1: "FastAPI Service" };
  if (/(react|next|vue|frontend|spa)/.test(s)) return { tpl: "react", sub1: "Frontend SPA" };
  if (/(kafka|stream|event)/.test(s)) return { tpl: "kafka", sub1: "Event Streaming" };
  if (/(sqs|pubsub|queue|cola)/.test(s)) return { tpl: "sqs", sub1: "Message Queue" };
  if (/(redis|elasticache|cache|mem)/.test(s)) return { tpl: "redis", sub1: "In-Memory Cache" };
  if (/(postgres|mysql|rds|aurora|sql|db|database)/.test(s)) return { tpl: "rds", sub1: "Relational DB" };
  if (/(dynamo|mongo|cosmos|nosql)/.test(s)) return { tpl: "dynamodb", sub1: "NoSQL DB" };
  if (/(s3|minio|storage|bucket|blob)/.test(s)) return { tpl: "s3", sub1: "Object Storage" };
  if (/(kms|hsm|vault|secret)/.test(s)) return { tpl: "kms", sub1: "KMS / Security" };
  if (/(bedrock|ai|llm|openai|gemini)/.test(s)) return { tpl: "bedrock", sub1: "AI / LLM Engine" };
  if (/(docker|container)/.test(s)) return { tpl: "docker", sub1: "Container" };
  if (/(cloud run|cloudrun)/.test(s)) return { tpl: "gcp_cloudrun", sub1: "Cloud Run" };
  if (/(bigquery)/.test(s)) return { tpl: "gcp_bigquery", sub1: "Data Warehouse" };
  return { tpl: "ecs", sub1: "Compute / Service" };
}

function generateFromText(promptText: string, preferredType?: string): any {
  const lower = promptText.toLowerCase();

  let type = preferredType || "cloud";
  if (!preferredType) {
    if (/(bpmn|swimlane|pool|tarea de|compuerta)/.test(lower)) type = "bpmn";
    else if (/(uml|clase|secuencia|caso de uso)/.test(lower)) type = "uml";
    else if (/(c4|software system|boundary)/.test(lower)) type = "c4";
    else if (/(erd|entidad|tabla relacional|clave foranea|pk |fk )/.test(lower)) type = "erd";
    else if (/(flujo|flowchart|algoritmo|decision|decisión)/.test(lower)) type = "flowchart";
  }

  // Extract explicit flow steps when prompt uses arrows (->, =>, -->, →) or separators (;)
  const arrowParts = promptText
    .split(/\s*(?:-->|->|=>|→|;)\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (arrowParts.length >= 2) {
    const cols = 4;
    const xStart = 120;
    const yStart = 160;
    const xStep = 230;
    const yStep = 170;

    const nodes = arrowParts.map((rawName, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const { tpl, sub1 } = inferStencilForText(rawName, type);
      return {
        id: `n_${idx + 1}`,
        tpl,
        name: rawName.slice(0, 60),
        sub1,
        x: xStart + col * xStep,
        y: yStart + row * yStep,
      };
    });

    const edges = nodes.slice(0, -1).map((src, idx) => ({
      id: `e_${idx + 1}`,
      source: src.id,
      target: nodes[idx + 1].id,
      label: type === "bpmn" ? "Siguiente" : "Flujo",
      style: "primary" as const,
      step: String(idx + 1),
    }));

    const maxX = Math.max(...nodes.map((n) => n.x)) + 200;
    const maxY = Math.max(...nodes.map((n) => n.y)) + 160;
    const groupType =
      type === "bpmn" ? "bpmn_pool" :
      type === "c4" ? "c4_boundary" :
      type === "uml" ? "uml_package" :
      type === "cloud" ? "vpc" : null;

    const groups = groupType
      ? [{
          id: "g_main",
          type: groupType,
          name: `${type.toUpperCase()} — ${promptText.slice(0, 48)}`,
          sub: "Generado automáticamente desde especificación",
          x: 60,
          y: 70,
          w: Math.max(520, maxX - 40),
          h: Math.max(300, maxY - 40),
        }]
      : [];

    return {
      id: `diag_${Date.now()}`,
      title: `Arquitectura: ${promptText.slice(0, 64)}`,
      diagramType: type,
      updatedAt: new Date().toISOString(),
      groups,
      nodes,
      edges,
    };
  }

  // Fallback to rich preset template when prompt asks generally for a discipline
  const clone = (tplObj: any) => JSON.parse(JSON.stringify(tplObj));
  if (type === "bpmn") return clone(TEMPLATES_MAP["bpmn-telemedicina"]);
  if (type === "c4") return clone(TEMPLATES_MAP["c4-medicapp-containers"]);
  if (type === "erd") return clone(TEMPLATES_MAP["erd-hospital"]);
  if (type === "flowchart") return clone(TEMPLATES_MAP["flowchart-triage"]);
  if (lower.includes("secuencia")) return clone(TEMPLATES_MAP["uml-sequence-auth"]);
  if (lower.includes("clase") || type === "uml") return clone(TEMPLATES_MAP["uml-class-medicapp"]);
  return clone(TEMPLATES_MAP["medicapp-cloud"]);
}

// ==================== 4. EXPORTADORES (DRAW.IO XML / SVG) ====================
function getDrawioNodeStyle(tpl: string): { style: string; w: number; h: number } {
  if (tpl.startsWith("bpmn_task") || tpl.endsWith("_task") || tpl === "bpmn_rule_task") {
    return { style: "rounded=1;arcSize=10;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#475569;strokeWidth=1.5;fontStyle=1;", w: 140, h: 65 };
  }
  if (tpl.startsWith("bpmn_gw")) {
    return { style: "rhombus;whiteSpace=wrap;html=1;fillColor=#FEF08A;strokeColor=#CA8A04;fontStyle=1;", w: 60, h: 60 };
  }
  if (tpl === "bpmn_end_term") {
    return { style: "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#FEE2E2;strokeColor=#DC2626;strokeWidth=5;fontStyle=1;", w: 50, h: 50 };
  }
  if (tpl.startsWith("bpmn_start")) {
    return { style: "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#DCFCE7;strokeColor=#16A34A;strokeWidth=2;fontStyle=1;", w: 50, h: 50 };
  }
  if (tpl.startsWith("bpmn_end")) {
    return { style: "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#FEE2E2;strokeColor=#DC2626;strokeWidth=3;fontStyle=1;", w: 50, h: 50 };
  }
  if (tpl.startsWith("bpmn_timer") || tpl.startsWith("bpmn_msg") || tpl === "bpmn_error" || tpl === "bpmn_link") {
    return { style: "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=2;fontStyle=1;", w: 50, h: 50 };
  }
  if (tpl === "bpmn_data_object") {
    return { style: "shape=note;whiteSpace=wrap;html=1;size=14;verticalAlign=top;align=left;spacingLeft=5;fillColor=#F8FAFC;strokeColor=#475569;", w: 90, h: 70 };
  }
  if (tpl === "bpmn_data_store") {
    return { style: "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#F8FAFC;strokeColor=#475569;", w: 90, h: 70 };
  }
  if (tpl === "bpmn_annotation") {
    return { style: "shape=singleBracket;whiteSpace=wrap;html=1;rounded=0;strokeColor=#64748B;fillColor=none;align=left;verticalAlign=top;", w: 120, h: 60 };
  }
  if (tpl === "uml_actor") {
    return { style: "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#F8FAFC;strokeColor=#475569;", w: 60, h: 80 };
  }
  if (tpl === "uml_class") {
    return { style: "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=26;horizontalStack=0;resizeParent=1;fillColor=#EFF6FF;strokeColor=#2563EB;", w: 180, h: 90 };
  }
  if (tpl === "uml_interface") {
    return { style: "html=1;whiteSpace=wrap;fillColor=#E0F2FE;strokeColor=#0284C7;fontStyle=1;", w: 170, h: 75 };
  }
  if (tpl === "uml_usecase") {
    return { style: "ellipse;whiteSpace=wrap;html=1;fillColor=#F3E8FF;strokeColor=#7C3AED;fontStyle=1;", w: 140, h: 70 };
  }
  if (tpl === "uml_state") {
    return { style: "rounded=1;arcSize=25;whiteSpace=wrap;html=1;fillColor=#FEF3C7;strokeColor=#D97706;fontStyle=1;", w: 130, h: 60 };
  }
  if (tpl === "uml_component") {
    return { style: "shape=module;align=left;spacingLeft=20;align=center;verticalAlign=top;whiteSpace=wrap;html=1;fillColor=#ECFDF5;strokeColor=#059669;fontStyle=1;", w: 150, h: 70 };
  }
  if (tpl === "uml_lifeline") {
    return { style: "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;fillColor=#F0FDFA;strokeColor=#0D9488;", w: 130, h: 90 };
  }
  if (tpl === "c4_person") {
    return { style: "shape=mxgraph.c4.person2;whiteSpace=wrap;html=1;fillColor=#08427B;strokeColor=#08427B;fontColor=#FFFFFF;", w: 130, h: 80 };
  }
  if (tpl === "c4_system" || tpl === "c4_container" || tpl === "c4_comp" || tpl === "c4_component") {
    return { style: `rounded=1;whiteSpace=wrap;html=1;fillColor=${tpl === "c4_system" ? "#1168BD" : "#438DD5"};strokeColor=#0B4884;fontColor=#FFFFFF;`, w: 140, h: 75 };
  }
  if (tpl === "c4_db") {
    return { style: "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;fillColor=#438DD5;strokeColor=#2E6295;fontColor=#FFFFFF;", w: 120, h: 75 };
  }
  if (tpl === "erd_table") {
    return { style: "shape=table;startSize=28;container=1;collapsible=0;childLayout=tableLayout;fillColor=#F0FDFA;strokeColor=#0F766E;fontStyle=1;", w: 180, h: 95 };
  }
  if (tpl === "erd_rel" || tpl === "fc_decision") {
    return { style: "rhombus;whiteSpace=wrap;html=1;fillColor=#FEF3C7;strokeColor=#D97706;fontStyle=1;", w: 120, h: 75 };
  }
  if (tpl === "fc_term") {
    return { style: "rounded=1;arcSize=50;whiteSpace=wrap;html=1;fillColor=#F3E8FF;strokeColor=#7C3AED;fontStyle=1;", w: 130, h: 55 };
  }
  if (tpl === "fc_io") {
    return { style: "shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#ECFDF5;strokeColor=#059669;", w: 140, h: 65 };
  }
  if (tpl === "fc_doc") {
    return { style: "shape=document;whiteSpace=wrap;html=1;boundedLbl=1;fillColor=#ECFEFF;strokeColor=#0891B2;", w: 130, h: 70 };
  }
  if (tpl === "fc_process") {
    return { style: "rounded=0;whiteSpace=wrap;html=1;fillColor=#EFF6FF;strokeColor=#2563EB;fontStyle=1;", w: 140, h: 65 };
  }
  return { style: "rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#CBD5E1;shadow=1;", w: 120, h: 70 };
}

function exportToDrawio(diagram: any): string {
  const cells: string[] = [
    '<mxCell id="0"/>',
    '<mxCell id="1" parent="0"/>'
  ];

  let nextCellId = 2;
  const idMap = new Map<string, number>();

  for (const g of diagram.groups || []) {
    const cid = nextCellId++;
    idMap.set(String(g.id), cid);

    const gType = String(g.type || "");
    const stroke = sanitizeColor(g.stroke, "#334155");
    const fill = sanitizeColor(g.fill, "#FFFFFF");

    let style = "rounded=0;whiteSpace=wrap;html=1;";
    if (gType === "bpmn_pool" || gType === "bpmn_lane") {
      style = `swimlane;horizontal=0;swimlaneFillColor=#FFFFFF;strokeColor=${stroke};fontStyle=1;${gType === "bpmn_lane" ? "dashed=1;" : ""}`;
    } else if (gType === "bpmn_subproc") {
      style = `rounded=1;arcSize=10;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=${stroke};strokeWidth=1.8;fontStyle=1;`;
    } else if (gType === "bpmn_trans") {
      style = `rounded=1;arcSize=10;whiteSpace=wrap;html=1;fillColor=none;strokeColor=${sanitizeColor(g.stroke, "#0284C7")};strokeWidth=2;dashed=1;`;
    } else if (gType === "c4_boundary") {
      style = `dashed=1;rounded=1;fillColor=none;strokeColor=${sanitizeColor(g.stroke, "#1E40AF")};strokeWidth=2;fontStyle=1;`;
    } else if (gType === "uml_package") {
      style = `shape=folder;fontStyle=1;tabWidth=110;tabHeight=30;tabPosition=left;html=1;fillColor=#F0F9FF;strokeColor=${sanitizeColor(g.stroke, "#0369A1")};`;
    } else if (gType.includes("subnet")) {
      style = `rounded=1;dashed=${g.dashed ? "1" : "0"};fillColor=${fill};strokeColor=${sanitizeColor(g.stroke, "#7AA116")};strokeWidth=1.5;`;
    } else {
      style = `rounded=0;dashed=${g.dashed ? "1" : "0"};fillColor=none;strokeColor=${sanitizeColor(g.stroke, "#232F3E")};strokeWidth=1.5;`;
    }

    const labelText = g.sub ? `${g.name || ""}\n${g.sub}` : String(g.name || "");
    const label = escapeDrawioLabel(labelText);
    const gx = finiteNum(g.x, 40);
    const gy = finiteNum(g.y, 40);
    const gw = Math.max(80, finiteNum(g.w, 300));
    const gh = Math.max(60, finiteNum(g.h, 200));

    cells.push(`<mxCell id="${cid}" value="${label}" style="${escapeXml(style)}" vertex="1" parent="1">
    <mxGeometry x="${gx}" y="${gy}" width="${gw}" height="${gh}" as="geometry"/>
  </mxCell>`);
  }

  for (const n of diagram.nodes || []) {
    const cid = nextCellId++;
    idMap.set(String(n.id), cid);

    const tpl = String(n.tpl || "");
    const { style, w, h } = getDrawioNodeStyle(tpl);
    const labelText = n.sub1 ? `${n.name || ""}\n${n.sub1}` : String(n.name || "");
    const label = escapeDrawioLabel(labelText);
    const nx = finiteNum(n.x, 100);
    const ny = finiteNum(n.y, 100);
    const nw = finiteNum(n.w, w);
    const nh = finiteNum(n.h, h);

    cells.push(`<mxCell id="${cid}" value="${label}" style="${escapeXml(style)}" vertex="1" parent="1">
    <mxGeometry x="${nx}" y="${ny}" width="${nw}" height="${nh}" as="geometry"/>
  </mxCell>`);
  }

  for (const e of diagram.edges || []) {
    const sId = idMap.get(String(e.source));
    const tId = idMap.get(String(e.target));
    if (!sId || !tId) continue;

    const cid = nextCellId++;
    const strokeColor = e.style === "sec" ? "#DD344C" : e.style === "async" ? "#147EBA" : "#232F3E";
    const dashed = e.style === "async" ? "1" : "0";
    const style = `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=${strokeColor};strokeWidth=2;dashed=${dashed};`;
    const rawLabel = `${e.step ? `[${e.step}] ` : ""}${e.label || ""}`.trim();
    const label = escapeDrawioLabel(rawLabel);

    cells.push(`<mxCell id="${cid}" value="${label}" style="${escapeXml(style)}" edge="1" parent="1" source="${sId}" target="${tId}">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>`);
  }

  const diagramTitle = escapeXml(diagram.title || "Architecture");
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="OpenArchitecto" modified="${escapeXml(new Date().toISOString())}" agent="OpenArchitecto/2.1" version="24.7.0" type="device">
  <diagram id="diag_1" name="${diagramTitle}">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1100" background="#FFFFFF">
      <root>
      ${cells.join("\n      ")}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function exportToSvg(diagram: any): string {
  const nodes: any[] = Array.isArray(diagram.nodes) ? diagram.nodes : [];
  const groups: any[] = Array.isArray(diagram.groups) ? diagram.groups : [];
  const edges: any[] = Array.isArray(diagram.edges) ? diagram.edges : [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const x = finiteNum(n.x, 100);
    const y = finiteNum(n.y, 100);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + finiteNum(n.w, 160));
    maxY = Math.max(maxY, y + finiteNum(n.h, 110));
  }
  for (const g of groups) {
    const x = finiteNum(g.x, 40);
    const y = finiteNum(g.y, 40);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + finiteNum(g.w, 300));
    maxY = Math.max(maxY, y + finiteNum(g.h, 200));
  }

  if (!Number.isFinite(minX)) {
    minX = 0; minY = 0; maxX = 800; maxY = 500;
  }

  const pad = 48;
  const headerH = 44;
  const vx = Math.floor(minX - pad);
  const vy = Math.floor(minY - pad - headerH);
  const width = Math.max(800, Math.ceil(maxX - minX + pad * 2));
  const height = Math.max(500, Math.ceil(maxY - minY + pad * 2 + headerH));

  const groupElements = groups.map((g: any) => {
    const gx = finiteNum(g.x, 40);
    const gy = finiteNum(g.y, 40);
    const gw = Math.max(80, finiteNum(g.w, 300));
    const gh = Math.max(60, finiteNum(g.h, 200));
    const stroke = sanitizeColor(g.stroke, "#334155");
    const fill = sanitizeColor(g.fill, "none");
    return `
    <rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-dasharray="${g.dashed ? "6 4" : "none"}"/>
    <text x="${gx + 14}" y="${gy + 22}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="bold" fill="${stroke}">${escapeXml(g.name || "")}</text>`;
  }).join("");

  const edgeElements = edges.map((e: any) => {
    const s = nodes.find((n: any) => n.id === e.source);
    const t = nodes.find((n: any) => n.id === e.target);
    if (!s || !t) return "";
    const sw = finiteNum(s.w, 130), sh = finiteNum(s.h, 65);
    const tw = finiteNum(t.w, 130), th = finiteNum(t.h, 65);
    const x1 = finiteNum(s.x, 0) + sw / 2;
    const y1 = finiteNum(s.y, 0) + sh / 2;
    const x2 = finiteNum(t.x, 0) + tw / 2;
    const y2 = finiteNum(t.y, 0) + th / 2;
    const color = e.style === "sec" ? "#DD344C" : e.style === "async" ? "#147EBA" : "#232F3E";
    const markerId = e.style === "sec" ? "arr-sec" : e.style === "async" ? "arr-async" : "arr-primary";
    const edgeText = `${e.step ? `[${e.step}] ` : ""}${e.label || ""}`.trim();
    return `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" stroke-dasharray="${e.style === "async" ? "5 4" : "none"}" marker-end="url(#${markerId})"/>
      ${edgeText ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" font-family="system-ui, sans-serif" font-size="10.5" font-weight="600" fill="${color}" text-anchor="middle">${escapeXml(edgeText)}</text>` : ""}`;
  }).join("");

  const nodeElements = nodes.map((n: any) => {
    const nx = finiteNum(n.x, 100);
    const ny = finiteNum(n.y, 100);
    const tpl = String(n.tpl || "");
    const stroke = sanitizeColor(n.color, "#CBD5E1");
    const subLines = String(n.sub1 || "").split(/\r?\n/).slice(0, 3);
    const tspans = subLines
      .map((line, i) => `<tspan x="14" dy="${i === 0 ? 0 : 13}">${escapeXml(line.slice(0, 38))}</tspan>`)
      .join("");

    if (tpl.startsWith("bpmn_gw")) {
      return `
      <g transform="translate(${nx}, ${ny})">
        <polygon points="30,0 60,30 30,60 0,30" fill="#FEF08A" stroke="#CA8A04" stroke-width="2"/>
        <text x="30" y="76" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#1E293B" text-anchor="middle">${escapeXml(n.name || "")}</text>
      </g>`;
    }
    if (tpl.startsWith("bpmn_start") || tpl.startsWith("bpmn_end")) {
      const isEnd = tpl.startsWith("bpmn_end");
      return `
      <g transform="translate(${nx}, ${ny})">
        <circle cx="25" cy="25" r="22" fill="${isEnd ? "#FEE2E2" : "#DCFCE7"}" stroke="${isEnd ? "#DC2626" : "#16A34A"}" stroke-width="${isEnd ? 4 : 2.5}"/>
        <text x="25" y="62" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#1E293B" text-anchor="middle">${escapeXml(n.name || "")}</text>
      </g>`;
    }

    const boxW = finiteNum(n.w, 150);
    const boxH = Math.max(68, 44 + subLines.length * 13);
    return `
    <g transform="translate(${nx}, ${ny})">
      <rect width="${boxW}" height="${boxH}" rx="8" fill="#FFFFFF" stroke="${stroke}" stroke-width="1.8"/>
      <text x="14" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" fill="#1E293B">${escapeXml(n.name || "")}</text>
      ${tspans ? `<text x="14" y="42" font-family="system-ui, sans-serif" font-size="10" fill="#475569">${tspans}</text>` : ""}
    </g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <marker id="arr-primary" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#232F3E"/></marker>
    <marker id="arr-async" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#147EBA"/></marker>
    <marker id="arr-sec" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#DD344C"/></marker>
  </defs>
  <rect x="${vx}" y="${vy}" width="${width}" height="${height}" fill="#F8FAFC"/>
  <text x="${vx + pad}" y="${vy + 34}" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#0F172A">${escapeXml(diagram.title || "Architecture Diagram")}</text>
  ${groupElements}
  ${edgeElements}
  ${nodeElements}
</svg>`;
}

// ==================== 5. ESQUEMAS ZOD ESTRICTOS ====================
const GroupInputSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  name: z.string().min(1),
  sub: z.string().optional(),
  x: z.number().finite(),
  y: z.number().finite(),
  w: z.number().finite().positive(),
  h: z.number().finite().positive(),
  stroke: z.string().optional(),
  fill: z.string().optional(),
  dashed: z.boolean().optional(),
}).passthrough();

const NodeInputSchema = z.object({
  id: z.string().min(1),
  tpl: z.string().min(1).describe("Tipo de stencil del nodo (ej: 'ecs', 'uml_class', 'bpmn_user_task', 'c4_container')"),
  name: z.string().min(1),
  sub1: z.string().optional(),
  x: z.number().finite(),
  y: z.number().finite(),
  w: z.number().finite().positive().optional(),
  h: z.number().finite().positive().optional(),
  color: z.string().optional(),
}).passthrough();

const EdgeInputSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1).describe("ID del nodo origen"),
  target: z.string().min(1).describe("ID del nodo destino"),
  label: z.string().optional(),
  style: z.enum(["primary", "async", "sec"]).default("primary"),
  step: z.string().optional(),
}).passthrough();

const DiagramObjectSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  diagramType: z.enum(["cloud", "uml", "bpmn", "c4", "erd", "flowchart"]).optional(),
  groups: z.array(GroupInputSchema).default([]),
  nodes: z.array(NodeInputSchema).default([]),
  edges: z.array(EdgeInputSchema).default([]),
}).passthrough();

// ==================== 6. INICIALIZACIÓN DEL SERVIDOR MCP ====================
const server = new McpServer({
  name: "openarchitecto-mcp-server",
  version: "2.1.0",
});

// Tool 1: list_catalogs
server.registerTool(
  "list_catalogs",
  {
    title: "List Architecture Catalogs",
    description: "Lista todos los componentes, stencils, iconos y zonas disponibles clasificados por dominio (Cloud, UML, BPMN 2.0, C4 Model, ERD, Flowchart, Zonas).",
    inputSchema: {
      domain: z.enum(["all", "cloud", "uml", "bpmn", "c4", "erd", "flowchart", "groups"]).default("all")
        .describe("Dominio a consultar o 'all' para todo el catálogo"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ domain }) => {
    const result = domain === "all" ? CATALOGS : (CATALOGS as any)[domain] || [];
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Tool 2: list_templates
server.registerTool(
  "list_templates",
  {
    title: "List Diagram Templates",
    description: "Lista todas las plantillas preconfiguradas de ingeniería disponibles (Cloud HA, UML Clases, UML Secuencia, BPMN Telemedicina, C4 Container, ERD, Flowchart).",
    inputSchema: {
      diagramType: z.enum(["all", "cloud", "uml", "bpmn", "c4", "erd", "flowchart"]).default("all")
        .describe("Filtrar plantillas por tipo de diagrama o 'all'"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ diagramType }) => {
    const list = Object.values(TEMPLATES_MAP)
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        diagramType: t.diagramType,
        description: t.desc,
        nodeCount: (t.nodes || []).length,
        groupCount: (t.groups || []).length,
        edgeCount: (t.edges || []).length,
      }))
      .filter((t: any) => diagramType === "all" || t.diagramType === diagramType);

    return { content: [{ type: "text", text: JSON.stringify(list, null, 2) }] };
  }
);

// Tool 3: get_template
server.registerTool(
  "get_template",
  {
    title: "Get Diagram Template",
    description: "Obtiene la especificación completa en JSON de una plantilla específica para inspeccionarla o clonarla.",
    inputSchema: {
      templateId: z.string().min(1).describe("ID de la plantilla (ej: 'medicapp-cloud', 'uml-class-medicapp', 'bpmn-telemedicina', 'c4-medicapp-containers', 'erd-hospital', 'flowchart-triage')"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ templateId }) => {
    const tpl = TEMPLATES_MAP[templateId];
    if (!tpl) {
      return {
        isError: true,
        content: [{ type: "text", text: `Plantilla con ID '${templateId}' no encontrada. Usa 'list_templates' para ver disponibles.` }],
      };
    }
    return { content: [{ type: "text", text: JSON.stringify(tpl, null, 2) }] };
  }
);

// Tool 4: create_diagram
server.registerTool(
  "create_diagram",
  {
    title: "Create & Validate Diagram",
    description: "Crea y valida referencialmente un diagrama estructurado con nodos, conexiones ortogonales y zonas/grupos jerárquicos.",
    inputSchema: {
      title: z.string().min(1).describe("Título formal del diagrama"),
      diagramType: z.enum(["cloud", "uml", "bpmn", "c4", "erd", "flowchart"]).default("cloud").describe("Tipo de diagrama"),
      groups: z.array(GroupInputSchema).default([]).describe("Zonas o contenedores"),
      nodes: z.array(NodeInputSchema).min(1).describe("Lista de nodos"),
      edges: z.array(EdgeInputSchema).default([]).describe("Conexiones entre nodos"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async ({ title, diagramType, groups, nodes, edges }) => {
    const nodeIds = new Set<string>();
    const dupNodeIds: string[] = [];
    for (const n of nodes) {
      if (nodeIds.has(n.id)) dupNodeIds.push(n.id);
      nodeIds.add(n.id);
    }
    if (dupNodeIds.length > 0) {
      return {
        isError: true,
        content: [{ type: "text", text: `IDs de nodos duplicados: ${dupNodeIds.join(", ")}` }],
      };
    }

    const brokenEdges = edges.filter((e) => !nodeIds.has(e.source) || !nodeIds.has(e.target));
    if (brokenEdges.length > 0) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Referencias inválidas en edges: ${brokenEdges.map((e) => `${e.id} (${e.source} -> ${e.target})`).join(", ")}. Todos los source/target deben existir en nodes.`,
        }],
      };
    }

    const diagram = {
      id: `diag_${Date.now()}`,
      title,
      diagramType,
      updatedAt: new Date().toISOString(),
      groups,
      nodes,
      edges,
    };
    return { content: [{ type: "text", text: JSON.stringify(diagram, null, 2) }] };
  }
);

// Tool 5: prompt_to_diagram
server.registerTool(
  "prompt_to_diagram",
  {
    title: "Generate Diagram From Prompt",
    description: "Genera un diagrama estructurado a partir de un flujo textual con flechas (ej: 'Usuario -> WAF -> API -> RDS') o de una descripción general de disciplina.",
    inputSchema: {
      prompt: z.string().min(1).describe("Descripción o cadena de flujo (ej: 'Cliente -> Cloudflare -> Caddy -> Rust Axum -> PostgreSQL')"),
      diagramType: z.enum(["cloud", "uml", "bpmn", "c4", "erd", "flowchart"]).optional().describe("Tipo de diagrama sugerido"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async ({ prompt, diagramType }) => {
    const diagram = generateFromText(prompt, diagramType);
    return { content: [{ type: "text", text: JSON.stringify(diagram, null, 2) }] };
  }
);

// Tool 6: export_diagram
server.registerTool(
  "export_diagram",
  {
    title: "Export Diagram (Draw.io / SVG / JSON)",
    description: "Exporta un diagrama a formato Draw.io XML (.drawio nativo compatible con mxGraph), SVG vectorial o JSON.",
    inputSchema: {
      diagram: DiagramObjectSchema.optional().describe("Objeto JSON del diagrama a exportar"),
      templateId: z.string().optional().describe("ID de plantilla preexistente si no se envía 'diagram'"),
      format: z.enum(["drawio", "svg", "json"]).default("drawio").describe("Formato de salida"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ diagram, templateId, format }) => {
    const target = diagram || (templateId ? TEMPLATES_MAP[templateId] : null);
    if (!target) {
      return {
        isError: true,
        content: [{ type: "text", text: "Debe proporcionar el objeto 'diagram' o un 'templateId' válido." }],
      };
    }
    if (format === "drawio") {
      return { content: [{ type: "text", text: exportToDrawio(target) }] };
    }
    if (format === "svg") {
      return { content: [{ type: "text", text: exportToSvg(target) }] };
    }
    return { content: [{ type: "text", text: JSON.stringify(target, null, 2) }] };
  }
);

// Tool 7: save_diagram_to_studio
server.registerTool(
  "save_diagram_to_studio",
  {
    title: "Save Diagram to Studio",
    description: "Guarda el diagrama en el directorio de diagramas configurado para sincronizarlo en vivo con Architect Studio Pro.",
    inputSchema: {
      filename: z.string().min(1).describe("Nombre seguro del archivo sin rutas (ej: 'mi_arquitectura' o 'flujo_triage')"),
      diagram: DiagramObjectSchema.describe("Objeto estructurado del diagrama a guardar"),
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  async ({ filename, diagram }) => {
    try {
      const stem = sanitizeDiagramStem(filename);
      const safe = resolveSafeDiagramPath(DIAGRAMS_DIR, stem);
      if (!safe.ok) {
        return { isError: true, content: [{ type: "text", text: safe.error }] };
      }

      const payload = {
        ...diagram,
        id: diagram.id || stem,
        filename: safe.filename,
        updatedAt: new Date().toISOString(),
      };
      await writeFile(safe.filePath, JSON.stringify(payload, null, 2), "utf-8");
      return {
        content: [{
          type: "text",
          text: `✅ Diagrama '${payload.title || stem}' guardado en '${safe.filePath}'. Visible en ${config.studioUrl}`,
        }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error guardando diagrama: ${(err as Error).message}` }],
      };
    }
  }
);

// Tool 8: load_diagram_from_studio
server.registerTool(
  "load_diagram_from_studio",
  {
    title: "Load or List Studio Diagrams",
    description: "Carga un diagrama guardado en disco o lista todos los diagramas disponibles en el directorio configurado.",
    inputSchema: {
      filename: z.string().optional().describe("Nombre del archivo específico (o vacío para listar todos)"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ filename }) => {
    try {
      if (filename) {
        const safe = resolveSafeDiagramPath(DIAGRAMS_DIR, filename);
        if (!safe.ok) {
          return { isError: true, content: [{ type: "text", text: safe.error }] };
        }
        const raw = await readFile(safe.filePath, "utf-8");
        return { content: [{ type: "text", text: raw }] };
      }
      const files = (await readdir(DIAGRAMS_DIR)).filter((f) => f.endsWith(".json")).sort();
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ diagramsDir: DIAGRAMS_DIR, available_diagrams: files }, null, 2),
        }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error leyendo diagramas: ${(err as Error).message}` }],
      };
    }
  }
);

// Tool 9: delete_diagram_from_studio
server.registerTool(
  "delete_diagram_from_studio",
  {
    title: "Delete Studio Diagram",
    description: "Elimina un archivo JSON de diagrama guardado en el directorio de Architect Studio Pro.",
    inputSchema: {
      filename: z.string().min(1).describe("Nombre seguro del diagrama a eliminar (sin rutas)"),
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  },
  async ({ filename }) => {
    try {
      const safe = resolveSafeDiagramPath(DIAGRAMS_DIR, filename);
      if (!safe.ok) {
        return { isError: true, content: [{ type: "text", text: safe.error }] };
      }
      await unlink(safe.filePath);
      return { content: [{ type: "text", text: `🗑️ Diagrama '${safe.filename}' eliminado correctamente.` }] };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error eliminando diagrama: ${(err as Error).message}` }],
      };
    }
  }
);

// ==================== 7. MCP RESOURCES ====================
server.registerResource(
  "catalogs",
  "openarchitecto://catalogs",
  {
    title: "OpenArchitecto Stencil Catalogs",
    description: "Catálogo completo de nodos y zonas Multi-Cloud, BPMN 2.0, UML 2.5, C4 Model, ERD y Flowchart.",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(CATALOGS, null, 2) }],
  })
);

server.registerResource(
  "template-by-id",
  new ResourceTemplate("openarchitecto://templates/{templateId}", {
    list: async () => ({
      resources: Object.values(TEMPLATES_MAP).map((t: any) => ({
        uri: `openarchitecto://templates/${t.id}`,
        name: t.title,
        description: t.desc,
        mimeType: "application/json",
      })),
    }),
    complete: {
      templateId: async (value) => Object.keys(TEMPLATES_MAP).filter((k) => k.startsWith(value)),
    },
  }),
  {
    title: "Architecture Template Specification",
    description: "Especificación JSON de una plantilla oficial.",
    mimeType: "application/json",
  },
  async (uri, variables) => {
    const id = String(variables.templateId || "");
    const tpl = TEMPLATES_MAP[id];
    if (!tpl) throw new Error(`Template '${id}' not found`);
    return {
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(tpl, null, 2) }],
    };
  }
);

server.registerResource(
  "studio-diagram",
  new ResourceTemplate("openarchitecto://diagrams/{filename}", {
    list: async () => {
      const files = (await readdir(DIAGRAMS_DIR)).filter((f) => f.endsWith(".json")).sort();
      return {
        resources: files.map((f) => ({
          uri: `openarchitecto://diagrams/${f}`,
          name: f.replace(/\.json$/, ""),
          mimeType: "application/json",
        })),
      };
    },
    complete: {
      filename: async (value) => {
        const files = await readdir(DIAGRAMS_DIR);
        return files.filter((f) => f.endsWith(".json") && f.startsWith(value));
      },
    },
  }),
  {
    title: "Saved Studio Diagram",
    description: "Diagrama JSON persistido en Architect Studio Pro.",
    mimeType: "application/json",
  },
  async (uri, variables) => {
    const name = String(variables.filename || "");
    const safe = resolveSafeDiagramPath(DIAGRAMS_DIR, name);
    if (!safe.ok) throw new Error(safe.error);
    const text = await readFile(safe.filePath, "utf-8");
    return { contents: [{ uri: uri.href, mimeType: "application/json", text }] };
  }
);

// ==================== 8. MCP PROMPTS ====================
server.registerPrompt(
  "design-architecture",
  {
    title: "Design System Architecture Diagram",
    description: "Guía estructurada para diseñar un diagrama técnico formal usando OpenArchitecto MCP.",
    argsSchema: {
      domain: z.enum(["cloud", "bpmn", "uml", "c4", "erd", "flowchart"]).describe("Disciplina del diagrama"),
      requirements: z.string().describe("Descripción del sistema, flujo o requisitos a modelar"),
    },
  },
  async ({ domain, requirements }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: [
          `Diseña un diagrama formal de tipo '${domain}' con OpenArchitecto MCP para los siguientes requisitos:`,
          requirements,
          "",
          "Pasos obligatorios:",
          "1. Consulta `list_catalogs` para usar IDs de stencils (`tpl`) y zonas (`groups`) exactos.",
          "2. Modela límites jerárquicos claros (VPC/Subnets para cloud, Pools/Swimlanes para BPMN, Boundary para C4, Package para UML).",
          "3. Asigna `step` secuencial ('1', '2', ...) a cada conexión en `edges` para habilitar el Modo Presentación.",
          "4. Valida integridad con `create_diagram`, guarda con `save_diagram_to_studio` y exporta a Draw.io XML con `export_diagram` si se requiere.",
        ].join("\n"),
      },
    }],
  })
);

server.registerPrompt(
  "design-bpmn-process",
  {
    title: "Model BPMN 2.0 Process with Swimlanes",
    description: "Flujo específico para modelar procesos de negocio BPMN 2.0 con Pools, Swimlanes, Gateways y Data Objects.",
    argsSchema: {
      processName: z.string().describe("Nombre del proceso de negocio"),
      actors: z.string().describe("Actores o roles separados por coma (ej: Cliente, Sistema, Administrador)"),
    },
  },
  async ({ processName, actors }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: [
          `Modela el proceso BPMN 2.0 "${processName}" con carriles para los actores: ${actors}.`,
          "Requisitos estrictos:",
          "- Incluye un `bpmn_pool` contenedor y un `bpmn_lane` horizontal por cada rol.",
          "- Inicia con `bpmn_start` / `bpmn_start_msg` y cierra con `bpmn_end_term` / `bpmn_end`.",
          "- Usa `bpmn_user_task`, `bpmn_service_task`, compuertas `bpmn_gw_xor` / `bpmn_gw_and` y artefactos `bpmn_data_object`.",
          "- Numera cada transición con `step: '1'`, `'2'`, ... y persiste con `save_diagram_to_studio`.",
        ].join("\n"),
      },
    }],
  })
);

// ==================== 9. CONEXIÓN DEL TRANSPORTE STDIO ====================
const transport = new StdioServerTransport();
await server.connect(transport);
