import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, Wand2 } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
}

const EXAMPLES = [
  "Frontend en React que conecta con backend en FastAPI, y este guarda datos en PostgreSQL y usa Redis de caché",
  "App móvil conecta a un API Gateway con Nginx, luego va a un microservicio en Go, y eventos hacia Apache Kafka",
  "Next.js con autenticación OAuth, backend en Node.js, base de datos MongoDB y tareas con RabbitMQ",
  "Web Browser consulta API en Python Django, procesa archivos en AWS S3 y consulta modelo LLM"
];

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate(prompt.trim());
    onClose();
  };

  const handleSelectExample = (ex: string) => {
    setPrompt(ex);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-teal-400">
            <Wand2 className="w-5 h-5" />
            <h3 className="text-base font-semibold text-slate-100">Generador Rápido por Texto</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Escribe las tecnologías de tu arquitectura en lenguaje natural:
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ejemplo: Cliente en React conectado a backend FastAPI con base de datos PostgreSQL y Redis de caché..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 resize-none transition"
              autoFocus
            />
          </div>

          {/* Quick Examples */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Ejemplos rápidos para probar:
            </span>
            <div className="space-y-1.5">
              {EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectExample(ex)}
                  className="w-full text-left text-xs text-slate-300 hover:text-teal-300 bg-slate-800/40 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/30 p-2.5 rounded-lg transition truncate block"
                >
                  ⚡ {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:pointer-events-none text-white transition shadow-lg shadow-teal-700/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generar Diagrama</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
