import { TechItem } from '../types';

export const TECH_CATALOG: TechItem[] = [
  // =================== AWS (Amazon Web Services) ===================
  { id: 'aws-ec2', name: 'AWS EC2', category: 'aws', platform: 'aws', description: 'Instancias virtuales de cómputo elástico', icon: 'Server', color: '#ff9900', defaultPort: '80/443' },
  { id: 'aws-lambda', name: 'AWS Lambda', category: 'aws', platform: 'aws', description: 'Cómputo serverless basado en eventos', icon: 'Zap', color: '#ff9900' },
  { id: 'aws-s3', name: 'AWS S3', category: 'aws', platform: 'aws', description: 'Almacenamiento de objetos escalable', icon: 'Archive', color: '#569a31' },
  { id: 'aws-rds', name: 'AWS RDS', category: 'aws', platform: 'aws', description: 'Base de datos relacional administrada (Postgres/MySQL)', icon: 'Database', color: '#3b48cc', defaultPort: '5432' },
  { id: 'aws-dynamodb', name: 'AWS DynamoDB', category: 'aws', platform: 'aws', description: 'Base de datos NoSQL de latencia de milisegundos', icon: 'Table', color: '#3b48cc' },
  { id: 'aws-ecs', name: 'AWS ECS / Fargate', category: 'aws', platform: 'aws', description: 'Orquestación de contenedores Docker', icon: 'Boxes', color: '#ff9900' },
  { id: 'aws-apigateway', name: 'AWS API Gateway', category: 'aws', platform: 'aws', description: 'Gestión y enrutamiento seguro de APIs', icon: 'Shuffle', color: '#e7157b', defaultPort: '443' },
  { id: 'aws-cloudfront', name: 'AWS CloudFront', category: 'aws', platform: 'aws', description: 'Red de distribución de contenido global (CDN)', icon: 'Globe', color: '#aab7b8' },
  { id: 'aws-sqs', name: 'AWS SQS', category: 'aws', platform: 'aws', description: 'Cola de mensajes administrada', icon: 'MessageSquare', color: '#ff4f8b' },
  { id: 'aws-sns', name: 'AWS SNS', category: 'aws', platform: 'aws', description: 'Notificaciones pub/sub masivas', icon: 'Bell', color: '#ff4f8b' },
  { id: 'aws-iam', name: 'AWS IAM / Cognito', category: 'aws', platform: 'aws', description: 'Control de acceso, identidades y autenticación', icon: 'Key', color: '#dd344c' },
  { id: 'aws-cloudwatch', name: 'AWS CloudWatch', category: 'aws', platform: 'aws', description: 'Monitoreo, métricas y logs en tiempo real', icon: 'Activity', color: '#e7157b' },

  // =================== GCP (Google Cloud Platform) ===================
  { id: 'gcp-cloudrun', name: 'GCP Cloud Run', category: 'gcp', platform: 'gcp', description: 'Contenedores serverless administrados', icon: 'Zap', color: '#4285f4' },
  { id: 'gcp-gke', name: 'Google Kubernetes Engine (GKE)', category: 'gcp', platform: 'gcp', description: 'Clústeres Kubernetes administrados por Google', icon: 'Boxes', color: '#4285f4' },
  { id: 'gcp-storage', name: 'Google Cloud Storage', category: 'gcp', platform: 'gcp', description: 'Almacenamiento de buckets para archivos', icon: 'Archive', color: '#34a853' },
  { id: 'gcp-bigquery', name: 'BigQuery', category: 'gcp', platform: 'gcp', description: 'Data Warehouse analítico a escala de petabytes', icon: 'Database', color: '#4285f4' },
  { id: 'gcp-pubsub', name: 'GCP Pub/Sub', category: 'gcp', platform: 'gcp', description: 'Ingesta de eventos y mensajería en tiempo real', icon: 'Radio', color: '#ea4335' },
  { id: 'gcp-vertex', name: 'Vertex AI', category: 'gcp', platform: 'gcp', description: 'Plataforma unificada de Machine Learning y LLM', icon: 'Sparkles', color: '#fbbc05' },

  // =================== Azure (Microsoft) ===================
  { id: 'azure-appservice', name: 'Azure App Service', category: 'azure', platform: 'azure', description: 'Hospedaje PaaS de aplicaciones web', icon: 'Globe', color: '#0089d6', defaultPort: '443' },
  { id: 'azure-functions', name: 'Azure Functions', category: 'azure', platform: 'azure', description: 'Ejecución serverless orientada a eventos', icon: 'Zap', color: '#f2c811' },
  { id: 'azure-aks', name: 'Azure Kubernetes Service (AKS)', category: 'azure', platform: 'azure', description: 'Orquestación de clústeres K8s en Azure', icon: 'Boxes', color: '#0089d6' },
  { id: 'azure-cosmos', name: 'Azure Cosmos DB', category: 'azure', platform: 'azure', description: 'Base NoSQL distribuida globalmente', icon: 'Database', color: '#0089d6' },
  { id: 'azure-blob', name: 'Azure Blob Storage', category: 'azure', platform: 'azure', description: 'Almacenamiento masivo no estructurado', icon: 'Archive', color: '#0089d6' },
  { id: 'azure-entra', name: 'Microsoft Entra ID', category: 'azure', platform: 'azure', description: 'Gestión de accesos e identidades SSO', icon: 'ShieldCheck', color: '#0078d4' },

  // =================== Kubernetes & Cloud Native ===================
  { id: 'k8s-ingress', name: 'K8s Ingress (Nginx/Traefik)', category: 'k8s', platform: 'k8s', description: 'Enrutador HTTP/S de entrada al clúster', icon: 'Shuffle', color: '#326ce5', defaultPort: '80/443' },
  { id: 'k8s-pod', name: 'K8s Pod / Deployment', category: 'k8s', platform: 'k8s', description: 'Carga de trabajo en contenedores', icon: 'Box', color: '#326ce5' },
  { id: 'k8s-service', name: 'K8s ClusterIP / NodePort', category: 'k8s', platform: 'k8s', description: 'Balanceo interno de red entre pods', icon: 'Network', color: '#326ce5' },
  { id: 'k8s-argocd', name: 'ArgoCD (GitOps)', category: 'devops', platform: 'k8s', description: 'Despliegues continuos declarativos', icon: 'Repeat', color: '#ef7b4d' },

  // =================== Observabilidad & DevOps ===================
  { id: 'grafana', name: 'Grafana', category: 'devops', description: 'Dashboards analíticos y visualización', icon: 'BarChart3', color: '#f46800', defaultPort: '3000' },
  { id: 'prometheus', name: 'Prometheus', category: 'devops', description: 'Recolección de métricas temporales y alertas', icon: 'Flame', color: '#e6522c', defaultPort: '9090' },
  { id: 'terraform', name: 'Terraform IaC', category: 'devops', description: 'Infraestructura como código declarativa', icon: 'FileCode2', color: '#844fba' },
  { id: 'github-actions', name: 'GitHub Actions CI/CD', category: 'devops', description: 'Automatización de pipelines de build y test', icon: 'Workflow', color: '#2088ff' },

  // =================== Frontend ===================
  { id: 'react', name: 'React', category: 'frontend', description: 'Biblioteca UI por componentes', icon: 'Atom', color: '#0ea5e9', defaultPort: '5173' },
  { id: 'nextjs', name: 'Next.js', category: 'frontend', description: 'Framework Fullstack React / SSR', icon: 'Globe', color: '#ffffff', defaultPort: '3000' },
  { id: 'vue', name: 'Vue.js', category: 'frontend', description: 'Framework progresivo UI', icon: 'Compass', color: '#10b981', defaultPort: '5173' },
  { id: 'angular', name: 'Angular', category: 'frontend', description: 'Plataforma enterprise de Google', icon: 'Shield', color: '#ef4444', defaultPort: '4200' },
  { id: 'mobile', name: 'Mobile App (Flutter/RN)', category: 'frontend', description: 'App móvil iOS & Android nativa', icon: 'Smartphone', color: '#8b5cf6' },
  { id: 'web-client', name: 'Web Browser Client', category: 'frontend', description: 'Navegador cliente SPA / PWA', icon: 'Monitor', color: '#38bdf8' },

  // =================== Backend ===================
  { id: 'fastapi', name: 'FastAPI', category: 'backend', description: 'API REST ultrarrápida en Python', icon: 'Zap', color: '#0d9488', defaultPort: '8000' },
  { id: 'nodejs', name: 'Node.js / Express', category: 'backend', description: 'Runtime JS asíncrono para APIs', icon: 'Server', color: '#22c55e', defaultPort: '3000' },
  { id: 'django', name: 'Django', category: 'backend', description: 'Framework web robusto en Python', icon: 'Layers', color: '#15803d', defaultPort: '8000' },
  { id: 'golang', name: 'Go Microservice', category: 'backend', description: 'Microservicio concurrente en Go', icon: 'Cpu', color: '#06b6d4', defaultPort: '8080' },
  { id: 'nest', name: 'NestJS', category: 'backend', description: 'Framework TypeScript modular', icon: 'Boxes', color: '#e11d48', defaultPort: '3000' },
  { id: 'spring', name: 'Spring Boot', category: 'backend', description: 'Framework Java enterprise', icon: 'Coffee', color: '#16a34a', defaultPort: '8080' },
  { id: 'nginx', name: 'Nginx / Reverse Proxy', category: 'backend', description: 'Balanceador de carga y proxy inverso', icon: 'Shuffle', color: '#009639', defaultPort: '80/443' },

  // =================== Databases & Cache ===================
  { id: 'postgresql', name: 'PostgreSQL', category: 'database', description: 'Base de datos relacional ACID', icon: 'Database', color: '#3b82f6', defaultPort: '5432' },
  { id: 'mysql', name: 'MySQL / MariaDB', category: 'database', description: 'Base de datos relacional estándar', icon: 'Database', color: '#f97316', defaultPort: '3306' },
  { id: 'sqlite', name: 'SQLite', category: 'database', description: 'Base embebida sin servidor', icon: 'HardDrive', color: '#6366f1' },
  { id: 'mongodb', name: 'MongoDB', category: 'database', description: 'Base NoSQL documental', icon: 'FolderGit2', color: '#10b981', defaultPort: '27017' },
  { id: 'redis', name: 'Redis', category: 'cache', description: 'Caché en memoria y pub/sub', icon: 'Flame', color: '#dc2626', defaultPort: '6379' },

  // =================== Queues & Streaming ===================
  { id: 'rabbitmq', name: 'RabbitMQ', category: 'queue', description: 'Broker de mensajería AMQP', icon: 'MessageSquare', color: '#ea580c', defaultPort: '5672' },
  { id: 'kafka', name: 'Apache Kafka', category: 'queue', description: 'Streaming distribuido de eventos', icon: 'Activity', color: '#e11d48', defaultPort: '9092' },

  // =================== AI & Vector ===================
  { id: 'llm', name: 'LLM (OpenAI / Gemini / Claude)', category: 'ai', description: 'Modelo fundacional de IA generativa', icon: 'Sparkles', color: '#ec4899' },
  { id: 'vector-db', name: 'Vector DB (Qdrant/Chroma)', category: 'ai', description: 'Base vectorial para RAG y embeddings', icon: 'Network', color: '#8b5cf6', defaultPort: '6333' }
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  aws: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40' },
  gcp: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/40' },
  azure: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/40' },
  k8s: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/40' },
  devops: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/40' },
  frontend: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  backend: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  database: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  cache: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  queue: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  cloud: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  ai: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
  custom: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
};
