import React, { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { 
  Shield, Cloud, Server, Box, Edit2, Trash2, Check,
  Lock, Network, Globe, Palette, Layers, Eye
} from 'lucide-react';
import { GroupNodeData, ZoneType } from '../types';

const ZONE_CONFIG: Record<ZoneType, { icon: React.FC<{ className?: string }>; badge: string; defaultColor: string }> = {
  vpc: { icon: Cloud, badge: 'VPC CLOUD NETWORK', defaultColor: '#ff9900' },
  'public-subnet': { icon: Globe, badge: 'SUBNET PÚBLICA (DMZ)', defaultColor: '#0284c7' },
  'private-subnet': { icon: Server, badge: 'SUBNET PRIVADA (APP)', defaultColor: '#0d9488' },
  'isolated-subnet': { icon: Lock, badge: 'SUBNET AISLADA (DB/VAULT)', defaultColor: '#7c3aed' },
  cluster: { icon: Box, badge: 'KUBERNETES CLUSTER', defaultColor: '#326ce5' },
  security: { icon: Shield, badge: 'FRONTERA DE CONFIANZA', defaultColor: '#f59e0b' },
  custom: { icon: Layers, badge: 'ZONA DE ARQUITECTURA', defaultColor: '#64748b' },
};

const UI_PRO_PALETTE = [
  '#ff9900', // AWS Orange
  '#0284c7', // Sky Blue
  '#0d9488', // Enterprise Teal
  '#7c3aed', // Secure Violet
  '#326ce5', // K8s Indigo
  '#f59e0b', // Security Amber
  '#10b981', // Emerald
  '#64748b', // Slate Neutral
];

export const GroupNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as GroupNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [label, setLabel] = useState(nodeData.label || 'Zona / Contenedor');
  const [sublabel, setSublabel] = useState(nodeData.sublabel || '');
  const [styleVariant, setStyleVariant] = useState<'glass' | 'dashed' | 'minimal'>(nodeData.styleVariant || 'glass');

  const zoneType = (nodeData.zoneType || 'custom') as ZoneType;
  const config = ZONE_CONFIG[zoneType] || ZONE_CONFIG.custom;
  const IconComp = config.icon;
  const accentColor = nodeData.color || config.defaultColor;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('delete-node', { detail: { id } }));
  };

  const handleBlur = () => {
    setIsEditing(false);
    window.dispatchEvent(
      new CustomEvent('update-node-data', {
        detail: { id, data: { ...nodeData, label, sublabel, color: accentColor, styleVariant } },
      })
    );
  };

  const handleColorChange = (newColor: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker(false);
    window.dispatchEvent(
      new CustomEvent('update-node-data', {
        detail: { id, data: { ...nodeData, color: newColor } },
      })
    );
  };

  const handleToggleStyle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStyle = styleVariant === 'glass' ? 'dashed' : styleVariant === 'dashed' ? 'minimal' : 'glass';
    setStyleVariant(nextStyle);
    window.dispatchEvent(
      new CustomEvent('update-node-data', {
        detail: { id, data: { ...nodeData, styleVariant: nextStyle } },
      })
    );
  };

  // Glassmorphic background & border styles according to UI Pro Max
  const backgroundStyle = styleVariant === 'glass'
    ? {
        backgroundColor: `${accentColor}08`,
        backdropFilter: 'blur(8px)',
        borderColor: selected ? '#14b8a6' : `${accentColor}50`,
        boxShadow: selected ? `0 0 0 2px #14b8a6, 0 12px 30px ${accentColor}15` : `0 8px 24px -4px rgba(0,0,0,0.4)`
      }
    : styleVariant === 'dashed'
    ? {
        backgroundColor: `${accentColor}04`,
        borderColor: selected ? '#14b8a6' : `${accentColor}60`,
        borderStyle: 'dashed' as const,
      }
    : {
        backgroundColor: 'transparent',
        borderColor: selected ? '#14b8a6' : `${accentColor}40`,
      };

  return (
    <div
      className={`relative rounded-2xl w-full h-full min-w-[300px] min-h-[200px] transition-all p-5 border ${
        selected ? 'ring-2 ring-teal-400/40' : ''
      }`}
      style={backgroundStyle}
    >
      <NodeResizer 
        color="#14b8a6" 
        isVisible={selected} 
        minWidth={280} 
        minHeight={160} 
      />

      {/* Glass Header Bar */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-3 select-none">
        <div className="flex items-center gap-3">
          {/* Icon Badge */}
          <div
            className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
            style={{
              backgroundColor: `${accentColor}18`,
              borderColor: `${accentColor}45`,
              color: accentColor,
            }}
          >
            <IconComp className="w-4 h-4" />
          </div>

          <div>
            {isEditing ? (
              <div className="flex flex-col gap-1.5 z-50">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onBlur={handleBlur}
                  autoFocus
                  placeholder="Nombre de la zona..."
                  className="bg-slate-900 border border-teal-500 rounded-md px-2 py-1 text-xs font-bold text-white focus:outline-none shadow-inner"
                />
                <input
                  type="text"
                  value={sublabel}
                  placeholder="ej. 10.0.1.0/24 • Región us-east-1"
                  onChange={(e) => setSublabel(e.target.value)}
                  onBlur={handleBlur}
                  className="bg-slate-900 border border-slate-700 rounded-md px-2 py-0.5 text-[11px] font-mono text-slate-300 focus:outline-none"
                />
              </div>
            ) : (
              <div 
                className="cursor-pointer group/title flex items-center gap-2"
                onClick={() => setIsEditing(true)}
                title="Doble clic para editar nombre y CIDR"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100 tracking-wide">
                      {label}
                    </span>
                    <span 
                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider"
                      style={{
                        backgroundColor: `${accentColor}15`,
                        color: accentColor,
                        borderColor: `${accentColor}35`,
                      }}
                    >
                      {nodeData.badge || config.badge}
                    </span>
                  </div>
                  {sublabel && (
                    <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                      {sublabel}
                    </span>
                  )}
                </div>
                <Edit2 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>

        {/* Quick Toolbar on the right */}
        <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
          {/* Style Toggle */}
          <button
            onClick={handleToggleStyle}
            title={`Estilo visual actual: ${styleVariant}. Clic para alternar (Vidrio / Discontinuo / Mínimo)`}
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Color Palette Picker */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              title="Cambiar color del contenedor"
              className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-sm flex items-center justify-center"
              style={{ color: accentColor }}
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown color picker */}
            {showColorPicker && (
              <div className="absolute right-0 top-8 z-50 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl flex gap-1.5 animate-fade-in">
                {UI_PRO_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={(e) => handleColorChange(color, e)}
                    className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-125 flex items-center justify-center"
                    style={{
                      backgroundColor: color,
                      borderColor: accentColor === color ? '#ffffff' : 'transparent',
                    }}
                  >
                    {accentColor === color && <Check className="w-3 h-3 text-slate-900" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete Group */}
          <button
            onClick={handleDelete}
            title="Eliminar este marco / zona"
            className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-slate-800 transition shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Watermark subtext at bottom right */}
      <div 
        className="absolute bottom-3 right-4 pointer-events-none text-[10px] font-mono uppercase tracking-widest opacity-35"
        style={{ color: accentColor }}
      >
        {nodeData.cidr || 'ZONE ENCLOSURE'}
      </div>
    </div>
  );
});
GroupNode.displayName = 'GroupNode';
