import { Node, Edge } from '@xyflow/react';
import { TECH_CATALOG } from '../data/techCatalog';
import { TechItem } from '../types';

export function parsePromptToDiagram(prompt: string): { nodes: Node[]; edges: Edge[] } {
  const text = prompt.toLowerCase();
  const matchedTechs: TechItem[] = [];

  // Match known technologies
  for (const tech of TECH_CATALOG) {
    const techName = tech.name.toLowerCase();
    const techId = tech.id.toLowerCase();
    
    // Check various keywords
    if (text.includes(techId) || text.includes(techName)) {
      if (!matchedTechs.some((m) => m.id === tech.id)) {
        matchedTechs.push(tech);
      }
    }
  }

  // Fallbacks if user wrote generic terms
  if (matchedTechs.length === 0) {
    if (text.includes('front') || text.includes('web') || text.includes('ui') || text.includes('cliente')) {
      matchedTechs.push(TECH_CATALOG.find((t) => t.id === 'react')!);
    }
    if (text.includes('back') || text.includes('api') || text.includes('servidor')) {
      matchedTechs.push(TECH_CATALOG.find((t) => t.id === 'fastapi')!);
    }
    if (text.includes('base de datos') || text.includes('bd') || text.includes('datos')) {
      matchedTechs.push(TECH_CATALOG.find((t) => t.id === 'postgresql')!);
    }
    if (text.includes('cache') || text.includes('caché')) {
      matchedTechs.push(TECH_CATALOG.find((t) => t.id === 'redis')!);
    }
  }

  // If still nothing, default to standard starter
  if (matchedTechs.length === 0) {
    matchedTechs.push(
      TECH_CATALOG.find((t) => t.id === 'react')!,
      TECH_CATALOG.find((t) => t.id === 'fastapi')!,
      TECH_CATALOG.find((t) => t.id === 'postgresql')!
    );
  }

  // Group by layer/category
  const frontends = matchedTechs.filter((t) => t.category === 'frontend');
  const backends = matchedTechs.filter((t) => t.category === 'backend');
  const databases = matchedTechs.filter((t) => t.category === 'database' || t.category === 'cache');
  const others = matchedTechs.filter((t) => !['frontend', 'backend', 'database', 'cache'].includes(t.category));

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Layout positions: Left-to-Right
  // Col 1: Frontend (X: 80)
  // Col 2: Backend (X: 380)
  // Col 3: Storage/Queue/AI (X: 680)
  const NODE_HEIGHT = 110;
  const START_Y = 100;

  const createdFrontIds: string[] = [];
  frontends.forEach((tech, idx) => {
    const id = `${tech.id}_${Date.now()}_${idx}`;
    createdFrontIds.push(id);
    nodes.push({
      id,
      type: 'techNode',
      position: { x: 80, y: START_Y + idx * NODE_HEIGHT },
      data: {
        label: tech.name,
        techId: tech.id,
        category: tech.category,
        description: tech.description,
        icon: tech.icon,
        color: tech.color,
        port: tech.defaultPort,
      },
    });
  });

  const createdBackIds: string[] = [];
  backends.forEach((tech, idx) => {
    const id = `${tech.id}_${Date.now()}_${idx}`;
    createdBackIds.push(id);
    nodes.push({
      id,
      type: 'techNode',
      position: { x: 380, y: START_Y + idx * NODE_HEIGHT },
      data: {
        label: tech.name,
        techId: tech.id,
        category: tech.category,
        description: tech.description,
        icon: tech.icon,
        color: tech.color,
        port: tech.defaultPort,
      },
    });
  });

  const createdTargetIds: string[] = [];
  [...databases, ...others].forEach((tech, idx) => {
    const id = `${tech.id}_${Date.now()}_${idx}`;
    createdTargetIds.push(id);
    nodes.push({
      id,
      type: 'techNode',
      position: { x: 680, y: START_Y + idx * NODE_HEIGHT },
      data: {
        label: tech.name,
        techId: tech.id,
        category: tech.category,
        description: tech.description,
        icon: tech.icon,
        color: tech.color,
        port: tech.defaultPort,
      },
    });
  });

  // Connect Frontends -> Backends
  createdFrontIds.forEach((fId) => {
    createdBackIds.forEach((bId) => {
      edges.push({
        id: `e_${fId}_${bId}`,
        source: fId,
        target: bId,
        sourceHandle: 'right-source',
        targetHandle: 'left-target',
        animated: true,
        style: { stroke: '#0d9488', strokeWidth: 2 },
      });
    });
  });

  // Connect Backends -> Storage/Others
  createdBackIds.forEach((bId) => {
    createdTargetIds.forEach((tId) => {
      edges.push({
        id: `e_${bId}_${tId}`,
        source: bId,
        target: tId,
        sourceHandle: 'right-source',
        targetHandle: 'left-target',
        animated: true,
        style: { stroke: '#0284c7', strokeWidth: 2 },
      });
    });
  });

  // If no backends were specified, connect front directly to targets
  if (createdBackIds.length === 0) {
    createdFrontIds.forEach((fId) => {
      createdTargetIds.forEach((tId) => {
        edges.push({
          id: `e_${fId}_${tId}`,
          source: fId,
          target: tId,
          sourceHandle: 'right-source',
          targetHandle: 'left-target',
          animated: true,
          style: { stroke: '#0d9488', strokeWidth: 2 },
        });
      });
    });
  }

  return { nodes, edges };
}

export function generateMermaid(nodes: Node[], edges: Edge[]): string {
  let code = 'flowchart LR\n';
  
  // Define subgraphs or styling if needed
  nodes.forEach((node) => {
    const label = (node.data?.label as string) || node.id;
    const cat = (node.data?.category as string) || 'Tech';
    const cleanId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `  ${cleanId}["${label} (${cat})"]\n`;
  });

  code += '\n';

  edges.forEach((edge) => {
    const cleanSrc = edge.source.replace(/[^a-zA-Z0-9_]/g, '_');
    const cleanDst = edge.target.replace(/[^a-zA-Z0-9_]/g, '_');
    code += `  ${cleanSrc} --> ${cleanDst}\n`;
  });

  return code;
}
