import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Atom, Globe, Compass, Shield, Smartphone, Monitor, Zap, Server, 
  Layers, Cpu, Boxes, Coffee, Shuffle, Database, HardDrive, 
  FolderGit2, Flame, MessageSquare, Activity, Package, CloudRain, 
  Key, Wrench, Sparkles, Network, X, Edit3, Table, Bell, Radio,
  ShieldCheck, Box, Repeat, BarChart3, FileCode2, Workflow, Archive
} from 'lucide-react';
import { TechNodeData } from '../types';
import { CATEGORY_COLORS } from '../data/techCatalog';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Atom, Globe, Compass, Shield, Smartphone, Monitor, Zap, Server, 
  Layers, Cpu, Boxes, Coffee, Shuffle, Database, HardDrive, 
  FolderGit2, Flame, MessageSquare, Activity, Package, CloudRain, 
  Key, Wrench, Sparkles, Network, Table, Bell, Radio, ShieldCheck,
  Box, Repeat, BarChart3, FileCode2, Workflow, Archive
};

export const TechNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as TechNodeData;
  const IconComponent = ICON_MAP[nodeData.icon] || Server;
  const categoryStyle = CATEGORY_COLORS[nodeData.category] || CATEGORY_COLORS.custom;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('delete-node', { detail: { id } }));
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('edit-node', { detail: { id, data: nodeData } }));
  };

  // Status badge styling
  const statusBadge = nodeData.status === 'secure' 
    ? { text: '🛡️ Seguro', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    : nodeData.status === 'beta' 
    ? { text: '🟡 Beta', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
    : nodeData.status === 'warning'
    ? { text: '⚠️ Revisión', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    : null;

  return (
    <div 
      onDoubleClick={handleEdit}
      className={`relative group px-4 py-3 min-w-[210px] rounded-xl shadow-lg transition-all duration-200 border bg-slate-900/95 backdrop-blur-md cursor-pointer ${
        selected 
          ? 'border-teal-400 ring-2 ring-teal-400/40 shadow-teal-500/20' 
          : 'border-slate-700/80 hover:border-slate-500'
      }`}
      style={{
        boxShadow: selected ? '0 10px 25px -5px rgba(20, 184, 166, 0.25)' : '0 4px 12px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* 4 Handles for flexible connection */}
      <Handle type="target" position={Position.Top} id="top-target" className="!bg-teal-500 hover:!scale-125" />
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-teal-500 opacity-0 group-hover:opacity-100" />
      
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-teal-500 hover:!scale-125" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-teal-500 hover:!scale-125" />
      
      <Handle type="target" position={Position.Left} id="left-target" className="!bg-teal-500 hover:!scale-125" />
      <Handle type="source" position={Position.Left} id="left-source" className="!bg-teal-500 opacity-0 group-hover:opacity-100" />
      
      <Handle type="target" position={Position.Right} id="right-target" className="!bg-teal-500 opacity-0 group-hover:opacity-100" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-teal-500 hover:!scale-125" />

      {/* Action buttons on hover */}
      <div className="absolute -top-2.5 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleEdit}
          title="Editar cuadro"
          className="p-1 rounded-full bg-slate-800 text-teal-300 hover:bg-teal-600 hover:text-white transition shadow-md border border-slate-700"
        >
          <Edit3 className="w-3 h-3" />
        </button>
        <button
          onClick={handleDelete}
          title="Eliminar tecnología"
          className="p-1 rounded-full bg-rose-600 text-white hover:bg-rose-500 transition shadow-md"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Header with Icon, Category & Platform */}
      <div className="flex items-center gap-3">
        <div 
          className="p-2.5 rounded-lg flex items-center justify-center shrink-0 border shadow-inner"
          style={{ 
            backgroundColor: `${nodeData.color}18`, 
            borderColor: `${nodeData.color}45`,
            color: nodeData.color 
          }}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-semibold text-sm text-slate-100 truncate">
              {nodeData.label}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {nodeData.platform && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase tracking-wider border border-slate-700">
                {nodeData.platform}
              </span>
            )}

            <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded border uppercase tracking-wider ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
              {nodeData.category}
            </span>

            {nodeData.port && (
              <span className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1 py-0.2 rounded border border-slate-700">
                :{nodeData.port}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Badge if configured */}
      {statusBadge && (
        <div className="mt-2">
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border inline-block ${statusBadge.bg}`}>
            {statusBadge.text}
          </span>
        </div>
      )}

      {/* Description / Subtext */}
      {nodeData.description && (
        <p className="text-[11px] text-slate-400 mt-2 line-clamp-1 border-t border-slate-800/80 pt-1.5">
          {nodeData.description}
        </p>
      )}

      {/* Custom notes */}
      {nodeData.notes && (
        <p className="text-[10px] text-teal-400/80 italic mt-1 line-clamp-1">
          📌 {nodeData.notes}
        </p>
      )}
    </div>
  );
});
TechNode.displayName = 'TechNode';
