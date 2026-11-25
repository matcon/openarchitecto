import React, { useState } from 'react';
import { Copy, Check, X, FileCode } from 'lucide-react';

interface MermaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  mermaidCode: string;
}

export const MermaidModal: React.FC<MermaidModalProps> = ({ isOpen, onClose, mermaidCode }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-teal-400">
            <FileCode className="w-5 h-5" />
            <h3 className="text-base font-semibold text-slate-100">Código Mermaid del Diagrama</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-auto">
          <p className="text-xs text-slate-400 mb-3">
            Puedes copiar este código y pegarlo directamente en cualquier archivo Markdown (.md), Notion, GitHub, o en mermaid.live para compartirlo.
          </p>
          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-teal-300 overflow-x-auto leading-relaxed select-text">
            {mermaidCode}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            Cerrar
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition shadow-lg shadow-teal-700/30"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar Código Mermaid'}
          </button>
        </div>
      </div>
    </div>
  );
};
