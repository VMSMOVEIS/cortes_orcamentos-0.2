
import React, { useState, useEffect } from 'react';
import { Tag, Check, X } from 'lucide-react';

interface ProjectNameModalProps {
  fileName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export const ProjectNameModal: React.FC<ProjectNameModalProps> = ({ fileName, onConfirm, onCancel }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    // Default to filename without extension
    const defaultName = fileName.replace(/\.[^/.]+$/, "");
    setName(defaultName);
  }, [fileName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="bg-slate-50 p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Tag size={24} className="text-blue-600" />
            Nomear Projeto
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Identifique este arquivo para etiquetas e manuais.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Nome do Projeto / Arquivo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-lg font-medium border-2 border-slate-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="Ex: Cozinha, Guarda-Roupa..."
              autoFocus
            />
            <div className="text-xs text-slate-400 mt-2">
              Arquivo original: {fileName}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <X size={18} /> Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} /> Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
