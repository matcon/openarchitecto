import React from 'react';
import { LayoutTemplate, X, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { DIAGRAM_TEMPLATES } from '../data/templates';
import { DiagramTemplate } from '../types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: DiagramTemplate) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5 text-teal-400">
            <LayoutTemplate className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Plantillas de Arquitectura Listas</h3>
              <p className="text-xs text-slate-400">Selecciona un tipo de diagrama para cargar su estructura completa</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
          {DIAGRAM_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl);
                onClose();
              }}
              className="group cursor-pointer p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/50 transition-all flex flex-col justify-between shadow-sm hover:shadow-teal-500/10"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-wider">
                    {tmpl.badge}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {tmpl.nodes.length} nodos • {tmpl.edges.length} conexiones
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition">
                  {tmpl.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-teal-400 group-hover:translate-x-1 transition-transform">
                <span>Cargar este diagrama</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
