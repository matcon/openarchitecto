import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  BackgroundVariant,
  MiniMap,
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge, 
  Node,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toSvg } from 'html-to-image';

import { TechNode } from './components/TechNode';
import { GroupNode } from './components/GroupNode';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PromptModal } from './components/PromptModal';
import { MermaidModal } from './components/MermaidModal';
import { TemplateModal } from './components/TemplateModal';
import { NodeEditorModal } from './components/NodeEditorModal';
import { TechItem, TechNodeData, DiagramTemplate, ZoneType } from './types';
import { parsePromptToDiagram, generateMermaid } from './utils/diagramParser';
import { DIAGRAM_TEMPLATES } from './data/templates';

const nodeTypes = {
  techNode: TechNode,
  groupNode: GroupNode,
};

// Initial starter template with UI/UX Pro Max Glassmorphic Subnet Zone
const INITIAL_NODES: Node[] = [
  {
    id: 'zone_vpc_init',
    type: 'groupNode',
    position: { x: 40, y: 30 },
    style: { width: 980, height: 380 },
    data: {
      label: 'VPC Producción',
      sublabel: '10.0.0.0/16 • Multi-AZ Cluster',
      color: '#ff9900',
      zoneType: 'vpc',
      cidr: '10.0.0.0/16',
      badge: 'VPC CLOUD NETWORK',
      styleVariant: 'glass',
    },
  },
  {
    id: 'client_1',
    type: 'techNode',
    position: { x: 80, y: 150 },
    data: {
      label: 'React Frontend',
      techId: 'react',
      category: 'frontend',
      description: 'Single Page Application con Tailwind',
      icon: 'Atom',
      color: '#0ea5e9',
      port: '5173',
      status: 'active',
    },
  },
  {
    id: 'api_1',
    type: 'techNode',
    position: { x: 400, y: 150 },
    data: {
      label: 'FastAPI Backend',
      techId: 'fastapi',
      category: 'backend',
      description: 'API REST asíncrona de alta velocidad',
      icon: 'Zap',
      color: '#0d9488',
      port: '8000',
      status: 'active',
    },
  },
  {
    id: 'db_1',
    type: 'techNode',
    position: { x: 720, y: 90 },
    data: {
      label: 'PostgreSQL',
      techId: 'postgresql',
      category: 'database',
      description: 'Base de datos relacional principal',
      icon: 'Database',
      color: '#3b82f6',
      port: '5432',
      status: 'secure',
    },
  },
  {
    id: 'cache_1',
    type: 'techNode',
    position: { x: 720, y: 230 },
    data: {
      label: 'Redis Cache',
      techId: 'redis',
      category: 'cache',
      description: 'Caché de sesiones y queries rápidas',
      icon: 'Flame',
      color: '#dc2626',
      port: '6379',
      status: 'active',
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e_client_api',
    source: 'client_1',
    target: 'api_1',
    sourceHandle: 'right-source',
    targetHandle: 'left-target',
    animated: true,
    style: { stroke: '#0d9488', strokeWidth: 2.5 },
  },
  {
    id: 'e_api_db',
    source: 'api_1',
    target: 'db_1',
    sourceHandle: 'right-source',
    targetHandle: 'left-target',
    animated: true,
    style: { stroke: '#3b82f6', strokeWidth: 2 },
  },
  {
    id: 'e_api_cache',
    source: 'api_1',
    target: 'cache_1',
    sourceHandle: 'right-source',
    targetHandle: 'left-target',
    animated: true,
    style: { stroke: '#dc2626', strokeWidth: 2 },
  },
];

function FlowApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  
  // Modals state
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isMermaidOpen, setIsMermaidOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isVertical, setIsVertical] = useState(false);

  // Node editor state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeData, setEditingNodeData] = useState<TechNodeData | null>(null);

  const [mermaidCode, setMermaidCode] = useState('');
  const flowRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  // Listen for delete & edit events
  useEffect(() => {
    const handleDelete = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string }>;
      const nodeId = customEvent.detail?.id;
      if (nodeId) {
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      }
    };

    const handleEdit = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string; data: TechNodeData }>;
      if (customEvent.detail) {
        setEditingNodeId(customEvent.detail.id);
        setEditingNodeData(customEvent.detail.data);
      }
    };

    const handleUpdateData = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string; data: any }>;
      if (customEvent.detail) {
        const { id, data } = customEvent.detail;
        setNodes((nds) =>
          nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
        );
      }
    };

    window.addEventListener('delete-node', handleDelete);
    window.addEventListener('edit-node', handleEdit);
    window.addEventListener('update-node-data', handleUpdateData);
    return () => {
      window.removeEventListener('delete-node', handleDelete);
      window.removeEventListener('edit-node', handleEdit);
      window.removeEventListener('update-node-data', handleUpdateData);
    };
  }, [setNodes, setEdges]);

  // Handle new connection between handles
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#14b8a6', strokeWidth: 2.5 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Add technology from sidebar
  const handleAddTech = (tech: TechItem) => {
    const id = `${tech.id}_${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'techNode',
      position: { 
        x: 350 + Math.random() * 120, 
        y: 150 + Math.random() * 120 
      },
      data: {
        label: tech.name,
        techId: tech.id,
        category: tech.category,
        platform: tech.platform,
        description: tech.description,
        icon: tech.icon,
        color: tech.color,
        port: tech.defaultPort,
        status: 'active',
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Add Group / Bounding box container (UI/UX Pro Max Edition)
  const handleAddGroup = (type: ZoneType) => {
    const id = `group_${type}_${Date.now()}`;
    const configMap: Record<ZoneType, { label: string; sublabel: string; color: string; badge: string; width: number; height: number }> = {
      vpc: { label: 'VPC Cloud Network', sublabel: '10.0.0.0/16 • Red Aislada Multi-AZ', color: '#ff9900', badge: 'VPC CLOUD NETWORK', width: 700, height: 380 },
      'public-subnet': { label: 'Subnet Pública (DMZ)', sublabel: '10.0.1.0/24 • Internet-Facing', color: '#0284c7', badge: 'SUBNET PÚBLICA (DMZ)', width: 340, height: 280 },
      'private-subnet': { label: 'Subnet Privada (App Tier)', sublabel: '10.0.2.0/24 • Acceso Interno Exclusivo', color: '#0d9488', badge: 'SUBNET PRIVADA (APP)', width: 340, height: 280 },
      'isolated-subnet': { label: 'Subnet Aislada (DB/Vault)', sublabel: '10.0.3.0/24 • Cero Acceso a Internet', color: '#7c3aed', badge: 'SUBNET AISLADA (DB/VAULT)', width: 340, height: 280 },
      cluster: { label: 'Clúster Kubernetes', sublabel: 'Namespace: production • 3 Nodes', color: '#326ce5', badge: 'KUBERNETES CLUSTER', width: 450, height: 320 },
      security: { label: 'Frontera de Confianza (STRIDE)', sublabel: 'Nivel Alto de Aislamiento & mTLS', color: '#f59e0b', badge: 'FRONTERA DE CONFIANZA', width: 400, height: 280 },
      custom: { label: 'Zona Personalizada', sublabel: 'Capa Lógica', color: '#64748b', badge: 'ZONA PERSONALIZADA', width: 320, height: 240 },
    };

    const cfg = configMap[type] || configMap.custom;

    const newGroupNode: Node = {
      id,
      type: 'groupNode',
      position: { x: 100, y: 60 },
      style: { width: cfg.width, height: cfg.height },
      data: {
        label: cfg.label,
        sublabel: cfg.sublabel,
        color: cfg.color,
        zoneType: type,
        badge: cfg.badge,
        styleVariant: 'glass',
      },
    };
    // Put group node in back (z-index)
    setNodes((nds) => [newGroupNode, ...nds]);
  };

  // Save changes from node editor
  const handleSaveNodeData = (nodeId: string, updatedData: Partial<TechNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              ...updatedData,
            },
          };
        }
        return n;
      })
    );
  };

  // Load a complete architecture template
  const handleSelectTemplate = (template: DiagramTemplate) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setTimeout(() => {
      fitView({ padding: 0.15, duration: 600 });
    }, 100);
  };

  // Generate diagram from natural language prompt
  const handleGeneratePrompt = (prompt: string) => {
    const { nodes: newNodes, edges: newEdges } = parsePromptToDiagram(prompt);
    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 600 });
    }, 100);
  };

  // Auto layout: Horizontal or Vertical
  const handleAutoLayout = () => {
    const isVert = isVertical;
    const categoryIndexes: Record<string, number> = {
      frontend: 0,
      backend: 1,
      database: 2,
      cache: 2,
      queue: 2,
      aws: 2,
      gcp: 2,
      azure: 2,
      k8s: 2,
      ai: 3,
      cloud: 3,
      devops: 3,
      custom: 1,
    };

    const counters: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };

    const newNodes = nodes.map((node) => {
      if (node.type === 'groupNode') return node;

      const cat = (node.data?.category as string) || 'custom';
      const colIndex = categoryIndexes[cat] !== undefined ? categoryIndexes[cat] : 1;
      const count = counters[colIndex] || 0;
      counters[colIndex] = count + 1;

      let x = 100;
      let y = 100;

      if (!isVert) {
        // Horizontal: Left-to-Right
        x = 80 + colIndex * 340;
        y = 80 + count * 130;
      } else {
        // Vertical: Top-to-Bottom
        x = 80 + count * 260;
        y = 80 + colIndex * 180;
      }

      return {
        ...node,
        position: { x, y },
      };
    });

    setNodes(newNodes);
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 500 });
    }, 50);
  };

  // Export as PNG
  const handleExportPng = async () => {
    if (!flowRef.current) return;
    const viewport = flowRef.current.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    try {
      const dataUrl = await toPng(viewport, {
        backgroundColor: '#0f172a',
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `arquitectura-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exportando PNG:', err);
    }
  };

  // Export as SVG
  const handleExportSvg = async () => {
    if (!flowRef.current) return;
    const viewport = flowRef.current.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    try {
      const dataUrl = await toSvg(viewport, {
        backgroundColor: '#0f172a',
      });
      const link = document.createElement('a');
      link.download = `arquitectura-${Date.now()}.svg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error exportando SVG:', err);
    }
  };

  // Open Mermaid view
  const handleOpenMermaid = () => {
    const code = generateMermaid(nodes, edges);
    setMermaidCode(code);
    setIsMermaidOpen(true);
  };

  // Clear canvas
  const handleClear = () => {
    if (confirm('¿Deseas limpiar todos los componentes del lienzo?')) {
      setNodes([]);
      setEdges([]);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      <Header
        onOpenPrompt={() => setIsPromptOpen(true)}
        onOpenTemplates={() => setIsTemplateOpen(true)}
        onOpenMermaid={handleOpenMermaid}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onClear={handleClear}
        onAutoLayout={handleAutoLayout}
        onToggleOrientation={() => {
          setIsVertical(!isVertical);
          setTimeout(handleAutoLayout, 50);
        }}
        isVertical={isVertical}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      <div className="flex-1 relative" ref={flowRef}>
        <Sidebar 
          onAddTech={handleAddTech} 
          onAddGroup={handleAddGroup}
        />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.15}
          maxZoom={2.5}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#64748b', strokeWidth: 2 },
          }}
          className="bg-slate-950"
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={24} 
            size={1.5} 
            color="#334155" 
          />
          <Controls 
            className="!bg-slate-900/90 !border-slate-800 !rounded-xl !shadow-xl [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-200 [&>button:hover]:!bg-slate-800"
          />
          <MiniMap 
            nodeColor={(node) => {
              if (node.type === 'groupNode') return 'transparent';
              return (node.data?.color as string) || '#0f766e';
            }}
            maskColor="rgba(15, 23, 42, 0.75)"
            className="!bg-slate-900/90 !border-slate-800 !rounded-xl !shadow-xl hidden sm:block"
          />
        </ReactFlow>
      </div>

      {/* Modals */}
      <PromptModal
        isOpen={isPromptOpen}
        onClose={() => setIsPromptOpen(false)}
        onGenerate={handleGeneratePrompt}
      />

      <TemplateModal
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <MermaidModal
        isOpen={isMermaidOpen}
        onClose={() => setIsMermaidOpen(false)}
        mermaidCode={mermaidCode}
      />

      <NodeEditorModal
        isOpen={!!editingNodeId}
        onClose={() => {
          setEditingNodeId(null);
          setEditingNodeData(null);
        }}
        nodeId={editingNodeId}
        nodeData={editingNodeData}
        onSave={handleSaveNodeData}
      />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowApp />
    </ReactFlowProvider>
  );
}
