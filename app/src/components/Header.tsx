import React from 'react';
import { 
  Sparkles, Download, FileCode, Trash2, LayoutGrid, 
  LayoutTemplate, Image as ImageIcon, Box, ArrowRightLeft, ArrowDownUp,
  Shield, Layers
} from 'lucide-react';

interface HeaderProps {
  onOpenPrompt: () => void;
  onOpenTemplates: () => void;
  onOpenMermaid: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onClear: () => void;
  onAutoLayout: () => void;
  onToggleOrientation: () => void;
  isVertical: boolean;
  nodeCount: number;
  edgeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPrompt,
  onOpenTemplates,
  onOpenMermaid,
  onExportPng,
  onExportSvg,
  onClear,
  onAutoLayout,
  onToggleOrientation,
  isVertical,
  nodeCount,
  edgeCount,
}) => {
  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-5 flex items-center justify-between z-30 relative backdrop-blur-md">
      {/* Brand with UI/UX Pro Max gradient badge */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white font-black text-lg">
          O
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-100 tracking-tight">OpenArchitecto</h1>
            <span className="text-[10px] font-extrabold bg-teal-500/15 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30 uppercase tracking-wider">
              PRO MAX
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Diseñador Multi-Cloud & Zonas de Confianza</p>
        </div>
      </div>

      {/* Center status */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-950/60 rounded-full border border-slate-800 text-xs text-slate-400">
        <span>Componentes: <strong className="text-teal-400 font-mono">{nodeCount}</strong></span>
        <span>•</span>
        <span>Conexiones: <strong className="text-teal-400 font-mono">{edgeCount}</strong></span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Templates */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-teal-300 border border-teal-500/30 transition shadow-sm"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">Plantillas</span>
        </button>

        {/* Prompt generator */}
        <button
          onClick={onOpenPrompt}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-teal-700/25 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generar con Texto</span>
        </button>

        {/* Layout Orientation */}
        <button
          onClick={onToggleOrientation}
          title={isVertical ? "Cambiar a flujo Horizontal" : "Cambiar a flujo Vertical"}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition"
        >
          {isVertical ? <ArrowDownUp className="w-3.5 h-3.5 text-amber-400" /> : <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />}
          <span className="hidden sm:inline">{isVertical ? 'Vertical' : 'Horizontal'}</span>
        </button>

        {/* Auto Layout */}
        <button
          onClick={onAutoLayout}
          title="Organizar nodos automáticamente"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">Organizar</span>
        </button>

        {/* Export Dropdown / Buttons */}
        <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-lg border border-slate-700/80">
          <button
            onClick={onExportPng}
            title="Descargar imagen PNG de alta resolución"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>PNG</span>
          </button>

          <button
            onClick={onExportSvg}
            title="Descargar vector SVG escalable"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>SVG</span>
          </button>

          <button
            onClick={onOpenMermaid}
            title="Ver y copiar código Mermaid"
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Mermaid</span>
          </button>
        </div>

        {/* Clear */}
        <button
          onClick={onClear}
          title="Limpiar lienzo"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
