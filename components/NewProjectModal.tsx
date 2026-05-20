
import React, { useState, useEffect } from 'react';
import { RegisteredMaterial } from '../types';
import { FilePlus, Calendar, Hash, Type, Layers, Check, X } from 'lucide-react';

interface NewProjectModalProps {
  materials: RegisteredMaterial[];
  onConfirm: (data: { orderId: string; name: string; date: string; material: RegisteredMaterial }) => void;
  onCancel: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ materials, onConfirm, onCancel }) => {
  const [orderId, setOrderId] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMatId, setSelectedMatId] = useState(materials[0]?.id || '');

  // Efeito para focar no nome ao abrir
  useEffect(() => {
    // Gera um ID de ordem aleatório/sequencial simples sugestivo
    setOrderId(`ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMaterial = materials.find(m => m.id === selectedMatId);
    if (selectedMaterial && name.trim()) {
      onConfirm({
        orderId,
        name,
        date,
        material: selectedMaterial
      });
    } else {
        alert("Preencha o nome do projeto e selecione um material.");
    }
  };

  const currentMat = materials.find(m => m.id === selectedMatId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="bg-slate-50 p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FilePlus size={24} className="text-blue-600" />
            Novo Projeto
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Defina os dados iniciais para começar a inserir peças.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Hash size={12}/> Ordem / Pedido
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none"
                  placeholder="Ex: 12345"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Calendar size={12}/> Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none"
                />
              </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
              <Type size={12}/> Nome do Projeto
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 text-lg font-bold text-slate-800 focus:border-blue-500 outline-none"
              placeholder="Ex: Cozinha Planejada Sr. João"
              autoFocus
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
             <label className="block text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1">
               <Layers size={14}/> Material Padrão Inicial
             </label>
             <div className="flex gap-4 items-center">
                 <select 
                    value={selectedMatId} 
                    onChange={e => setSelectedMatId(e.target.value)}
                    className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                 >
                     {materials.map(m => (
                         <option key={m.id} value={m.id}>{m.name}</option>
                     ))}
                 </select>
                 <div className="w-24 text-center">
                     <span className="block text-[10px] font-bold text-slate-400 uppercase">Espessura</span>
                     <span className="text-lg font-black text-blue-600">{currentMat ? currentMat.thickness : 0}mm</span>
                 </div>
             </div>
             <p className="text-[10px] text-blue-400 mt-2 font-medium">
                 * As peças criadas manualmente iniciarão com este material.
             </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
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
              <Check size={18} /> Criar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
