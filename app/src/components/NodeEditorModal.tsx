import React, { useState } from 'react';
import { X, Edit3, Tag, Server, Check } from 'lucide-react';
import { TechNodeData } from '../types';

interface NodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: TechNodeData | null;
  nodeId: string | null;
  onSave: (nodeId: string, updatedData: Partial<TechNodeData>) => void;
}

const PRESET_COLORS = [
  '#0d9488', // Teal
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#10b981', // Emerald
  '#ff9900', // AWS Orange
  '#ffffff', // Clean White
];

export const NodeEditorModal: React.FC<NodeEditorModalProps> = ({
  isOpen,
  onClose,
  nodeData,
  nodeId,
  onSave,
}) => {
  if (!isOpen || !nodeData || !nodeId) return null;

  const [label, setLabel] = useState(nodeData.label || '');
  const [description, setDescription] = useState(nodeData.description || '');
  const [port, setPort] = useState(nodeData.port || '');
  const [notes, setNotes] = useState(nodeData.notes || '');
  const [color, setColor] = useState(nodeData.color || '#0d9488');
  const [status, setStatus] = useState(nodeData.status || 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(nodeId, {
      label,
      description,
      port,
      notes,
      color,
      status: status as any,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 text-teal-400">
            <Edit3 className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-100">Editar Cuadro de Tecnología</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre / Etiqueta del Servicio
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Role / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción / Rol
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ej. API Gateway, Base de datos de pagos..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Port & Status in row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Puerto / Protocolo
              </label>
              <input
                type="text"
                value={port}
                placeholder="ej. 8000, 5432, 443"
                onChange={(e) => setPort(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
              >
                <option value="active">🟢 Activo</option>
                <option value="beta">🟡 En Desarrollo / Beta</option>
                <option value="secure">🛡️ Seguro / Cifrado</option>
                <option value="warning">⚠️ Crítico / Requiere Revisión</option>
              </select>
            </div>
          </div>

          {/* Color Accent Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Color Distintivo
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#ffffff' : 'transparent',
                  }}
                >
                  {color === c && <Check className="w-3 h-3 text-slate-900" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas Adicionales (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles de configuración, variables de entorno, etc."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition shadow-md shadow-teal-700/20"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
