import { DiagramTemplate } from '../types';

export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'multi-zone-vpc',
    name: 'Multi-Zona Segura (VPC & Subnets Pro Max)',
    description: 'Segmentación de infraestructura en 3 capas de confianza con marcos vidriados y aislados.',
    category: 'Seguridad & Redes',
    badge: 'Zonas Pro Max',
    nodes: [
      {
        id: 'zone_vpc_root',
        type: 'groupNode',
        position: { x: 20, y: 20 },
        style: { width: 1060, height: 440 },
        data: { 
          label: 'AWS VPC Production Network', 
          sublabel: '10.0.0.0/16 • Región us-east-1 • Multi-AZ', 
          color: '#ff9900', 
          zoneType: 'vpc',
          cidr: '10.0.0.0/16'
        }
      },
      {
        id: 'zone_public',
        type: 'groupNode',
        position: { x: 50, y: 90 },
        style: { width: 300, height: 340 },
        data: { 
          label: 'Subnet Pública (DMZ)', 
          sublabel: '10.0.1.0/24 • Internet-Facing', 
          color: '#0284c7', 
          zoneType: 'public-subnet',
          cidr: '10.0.1.0/24'
        }
      },
      {
        id: 'zone_private',
        type: 'groupNode',
        position: { x: 380, y: 90 },
        style: { width: 330, height: 340 },
        data: { 
          label: 'Subnet Privada (App Tier)', 
          sublabel: '10.0.2.0/24 • Acceso Interno Exclusivo', 
          color: '#0d9488', 
          zoneType: 'private-subnet',
          cidr: '10.0.2.0/24'
        }
      },
      {
        id: 'zone_db',
        type: 'groupNode',
        position: { x: 740, y: 90 },
        style: { width: 310, height: 340 },
        data: { 
          label: 'Subnet Datos Aislada', 
          sublabel: '10.0.3.0/24 • Cero Acceso a Internet', 
          color: '#7c3aed', 
          zoneType: 'isolated-subnet',
          cidr: '10.0.3.0/24'
        }
      },
      {
        id: 'alb_node',
        type: 'techNode',
        position: { x: 90, y: 200 },
        data: { label: 'Application Load Balancer', techId: 'nginx', category: 'backend', description: 'Terminación SSL & AWS WAF', icon: 'Shuffle', color: '#0284c7', port: '443', status: 'secure' }
      },
      {
        id: 'app_backend',
        type: 'techNode',
        position: { x: 420, y: 200 },
        data: { label: 'FastAPI Microservicios', techId: 'fastapi', category: 'backend', description: 'Workers asíncronos en Fargate', icon: 'Zap', color: '#0d9488', port: '8000', status: 'active' }
      },
      {
        id: 'isolated_db',
        type: 'techNode',
        position: { x: 780, y: 200 },
        data: { label: 'AWS Aurora / PostgreSQL', techId: 'postgresql', category: 'database', description: 'Cifrado en reposo KMS (AES-256)', icon: 'Database', color: '#7c3aed', port: '5432', status: 'secure' }
      }
    ],
    edges: [
      { id: 'e_alb_app', source: 'alb_node', target: 'app_backend', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#0d9488', strokeWidth: 2.5 } },
      { id: 'e_app_db', source: 'app_backend', target: 'isolated_db', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#7c3aed', strokeWidth: 2.5 } }
    ]
  },
  {
    id: 'aws-event-driven',
    name: 'AWS Microservicios Serverless',
    description: 'CloudFront -> API Gateway -> Lambdas desacopladas con SQS, DynamoDB y almacenamiento S3.',
    category: 'Cloud / Serverless',
    badge: 'AWS Serverless',
    nodes: [
      {
        id: 'cf',
        type: 'techNode',
        position: { x: 50, y: 150 },
        data: { label: 'CloudFront CDN', techId: 'aws-cloudfront', category: 'aws', platform: 'aws', description: 'Distribución y caché global', icon: 'Globe', color: '#aab7b8', port: '443' }
      },
      {
        id: 'apigw',
        type: 'techNode',
        position: { x: 300, y: 150 },
        data: { label: 'API Gateway', techId: 'aws-apigateway', category: 'aws', platform: 'aws', description: 'Enrutamiento y auth JWT', icon: 'Shuffle', color: '#e7157b', port: '443' }
      },
      {
        id: 'lambda_api',
        type: 'techNode',
        position: { x: 550, y: 90 },
        data: { label: 'Lambda Ingesta', techId: 'aws-lambda', category: 'aws', platform: 'aws', description: 'Handler HTTP serverless', icon: 'Zap', color: '#ff9900' }
      },
      {
        id: 'sqs',
        type: 'techNode',
        position: { x: 800, y: 90 },
        data: { label: 'SQS Queue', techId: 'aws-sqs', category: 'aws', platform: 'aws', description: 'Cola de eventos asíncronos', icon: 'MessageSquare', color: '#ff4f8b' }
      },
      {
        id: 'lambda_worker',
        type: 'techNode',
        position: { x: 1050, y: 90 },
        data: { label: 'Lambda Processor', techId: 'aws-lambda', category: 'aws', platform: 'aws', description: 'Consumidor de cola', icon: 'Zap', color: '#ff9900' }
      },
      {
        id: 'dynamo',
        type: 'techNode',
        position: { x: 1050, y: 240 },
        data: { label: 'DynamoDB', techId: 'aws-dynamodb', category: 'aws', platform: 'aws', description: 'Persistencia NoSQL rápida', icon: 'Table', color: '#3b48cc' }
      },
      {
        id: 's3',
        type: 'techNode',
        position: { x: 550, y: 250 },
        data: { label: 'S3 Assets Bucket', techId: 'aws-s3', category: 'aws', platform: 'aws', description: 'Archivos estáticos y blobs', icon: 'Archive', color: '#569a31' }
      }
    ],
    edges: [
      { id: 'e_cf_api', source: 'cf', target: 'apigw', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#aab7b8', strokeWidth: 2 } },
      { id: 'e_cf_s3', source: 'cf', target: 's3', sourceHandle: 'bottom-source', targetHandle: 'left-target', animated: true, style: { stroke: '#569a31', strokeWidth: 2 } },
      { id: 'e_api_lambda', source: 'apigw', target: 'lambda_api', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#e7157b', strokeWidth: 2 } },
      { id: 'e_lambda_sqs', source: 'lambda_api', target: 'sqs', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#ff4f8b', strokeWidth: 2 } },
      { id: 'e_sqs_worker', source: 'sqs', target: 'lambda_worker', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#ff4f8b', strokeWidth: 2 } },
      { id: 'e_worker_db', source: 'lambda_worker', target: 'dynamo', sourceHandle: 'bottom-source', targetHandle: 'top-target', animated: true, style: { stroke: '#3b48cc', strokeWidth: 2 } }
    ]
  },
  {
    id: 'ai-rag-pipeline',
    name: 'Pipeline RAG & Inteligencia Artificial',
    description: 'Frontend React -> Backend FastAPI -> Embeddings -> Vector DB (Qdrant) + LLM (Gemini/OpenAI).',
    category: 'AI & Data',
    badge: 'AI / RAG',
    nodes: [
      {
        id: 'client_ai',
        type: 'techNode',
        position: { x: 80, y: 140 },
        data: { label: 'React Web UI', techId: 'react', category: 'frontend', description: 'Interfaz de chat y streaming', icon: 'Atom', color: '#0ea5e9', port: '5173' }
      },
      {
        id: 'fastapi_ai',
        type: 'techNode',
        position: { x: 380, y: 140 },
        data: { label: 'FastAPI Orquestador', techId: 'fastapi', category: 'backend', description: 'Pipeline RAG, LangChain/LlamaIndex', icon: 'Zap', color: '#0d9488', port: '8000' }
      },
      {
        id: 'vector_db',
        type: 'techNode',
        position: { x: 720, y: 60 },
        data: { label: 'Vector DB (Qdrant)', techId: 'vector-db', category: 'ai', description: 'Búsqueda de similitud vectorial', icon: 'Network', color: '#8b5cf6', port: '6333' }
      },
      {
        id: 'llm_node',
        type: 'techNode',
        position: { x: 720, y: 220 },
        data: { label: 'LLM (Gemini / OpenAI)', techId: 'llm', category: 'ai', description: 'Inferencia y síntesis generativa', icon: 'Sparkles', color: '#ec4899' }
      },
      {
        id: 'cache_ai',
        type: 'techNode',
        position: { x: 380, y: 300 },
        data: { label: 'Redis Semántico', techId: 'redis', category: 'cache', description: 'Caché de embeddings previos', icon: 'Flame', color: '#dc2626', port: '6379' }
      }
    ],
    edges: [
      { id: 'e_client_api', source: 'client_ai', target: 'fastapi_ai', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#0d9488', strokeWidth: 2.5 } },
      { id: 'e_api_vdb', source: 'fastapi_ai', target: 'vector_db', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: 'e_api_llm', source: 'fastapi_ai', target: 'llm_node', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#ec4899', strokeWidth: 2 } },
      { id: 'e_api_cache', source: 'fastapi_ai', target: 'cache_ai', sourceHandle: 'bottom-source', targetHandle: 'top-target', animated: true, style: { stroke: '#dc2626', strokeWidth: 2 } }
    ]
  },
  {
    id: 'k8s-cluster',
    name: 'Kubernetes Cloud Native Cluster',
    description: 'Ingress Controller Nginx distribuyendo a Microservicios en Pods K8s con PostgreSQL administrado.',
    category: 'DevOps & Containers',
    badge: 'K8S',
    nodes: [
      {
        id: 'ingress',
        type: 'techNode',
        position: { x: 80, y: 150 },
        data: { label: 'K8s Ingress Controller', techId: 'k8s-ingress', category: 'k8s', platform: 'k8s', description: 'TLS Termination y enrutador', icon: 'Shuffle', color: '#326ce5', port: '80/443' }
      },
      {
        id: 'svc_auth',
        type: 'techNode',
        position: { x: 380, y: 70 },
        data: { label: 'Pod: Auth Service', techId: 'k8s-pod', category: 'k8s', platform: 'k8s', description: 'Microservicio Go autenticación', icon: 'Box', color: '#06b6d4' }
      },
      {
        id: 'svc_orders',
        type: 'techNode',
        position: { x: 380, y: 230 },
        data: { label: 'Pod: Orders Service', techId: 'k8s-pod', category: 'k8s', platform: 'k8s', description: 'Microservicio Node.js pedidos', icon: 'Box', color: '#22c55e' }
      },
      {
        id: 'k8s_kafka',
        type: 'techNode',
        position: { x: 680, y: 230 },
        data: { label: 'Apache Kafka Event Bus', techId: 'kafka', category: 'queue', description: 'Bus de eventos entre servicios', icon: 'Activity', color: '#e11d48', port: '9092' }
      },
      {
        id: 'k8s_db',
        type: 'techNode',
        position: { x: 680, y: 70 },
        data: { label: 'PostgreSQL HA Cluster', techId: 'postgresql', category: 'database', description: 'Primary + Read Replicas', icon: 'Database', color: '#3b82f6', port: '5432' }
      }
    ],
    edges: [
      { id: 'e_ing_auth', source: 'ingress', target: 'svc_auth', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#326ce5', strokeWidth: 2 } },
      { id: 'e_ing_orders', source: 'ingress', target: 'svc_orders', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#326ce5', strokeWidth: 2 } },
      { id: 'e_auth_db', source: 'svc_auth', target: 'k8s_db', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
      { id: 'e_orders_kafka', source: 'svc_orders', target: 'k8s_kafka', sourceHandle: 'right-source', targetHandle: 'left-target', animated: true, style: { stroke: '#e11d48', strokeWidth: 2 } }
    ]
  }
];
