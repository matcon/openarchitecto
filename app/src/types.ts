export type TechCategory = 
  | 'frontend' 
  | 'backend' 
  | 'database' 
  | 'cache' 
  | 'queue' 
  | 'cloud' 
  | 'ai'
  | 'aws'
  | 'gcp'
  | 'azure'
  | 'k8s'
  | 'devops'
  | 'security'
  | 'custom';

export type PlatformType = 'aws' | 'gcp' | 'azure' | 'k8s' | 'generic';

export interface TechItem {
  id: string;
  name: string;
  category: TechCategory;
  platform?: PlatformType;
  description: string;
  icon: string;
  color: string;
  defaultPort?: string;
}

export interface TechNodeData extends Record<string, unknown> {
  label: string;
  techId: string;
  category: TechCategory;
  platform?: PlatformType;
  description: string;
  icon: string;
  color: string;
  port?: string;
  notes?: string;
  status?: 'active' | 'beta' | 'secure' | 'warning';
}

export type ZoneType = 'vpc' | 'public-subnet' | 'private-subnet' | 'isolated-subnet' | 'cluster' | 'security' | 'custom';

export interface GroupNodeData extends Record<string, unknown> {
  label: string;
  sublabel?: string;
  color?: string;
  zoneType?: ZoneType;
  cidr?: string;
  badge?: string;
  styleVariant?: 'glass' | 'dashed' | 'minimal';
}

export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  badge: string;
  nodes: any[];
  edges: any[];
}
