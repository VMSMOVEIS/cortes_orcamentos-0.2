
import React, { useState } from 'react';
import { RegisteredEdgeBand } from '../types';
import { Plus, Trash2, X, Edit2, Save, Ban, Disc } from 'lucide-react';

interface EdgeBandManagerProps {
  edgeBands: RegisteredEdgeBand[];
  onAdd: (band: RegisteredEdgeBand) => void;
  onUpdate: (band: RegisteredEdgeBand) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  isEmbedded?: boolean;
}

export const EdgeBandManager: React.FC<EdgeBandManagerProps> = ({ edgeBands, onAdd, onUpdate, onRemove, onClose, isEmbedded }) => {
  const [newName, setNewName] = useState('');
  const [newThickness, setNewThickness] = useState(0.45);
  const [newCategory, setNewCategory] = useState('');
  const [newPricePerMeter, setNewPricePerMeter] = useState<number>(0);
  const [newProductionTime, setNewProductionTime] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = () => {
    if (!newName.trim()) return;

    if (editingId) {
        onUpdate({
            id: editingId,
            name: newName.trim(),
            thickness: newThickness,
            colorCategory: newCategory.trim() || undefined,
            pricePerMeter: newPricePerMeter,
            productionTime: newProductionTime
        });
        setEditingId(null);
    } else {
        onAdd({
            id: Date.now().toString(),
            name: newName.trim(),
            thickness: newThickness,
            colorCategory: newCategory.trim() || undefined,
            pricePerMeter: newPricePerMeter,
            productionTime: newProductionTime
        });
    }

    setNewName('');
    setNewThickness(0.45);
    setNewCategory('');
    setNewPricePerMeter(0);
    setNewProductionTime(0);
  };

  const handleEdit = (band: RegisteredEdgeBand) => {
    setEditingId(band.id);
    setNewName(band.name);
    setNewThickness(band.thickness);
    setNewCategory(band.colorCategory || '');
    setNewPricePerMeter(band.pricePerMeter || 0);
    setNewProductionTime(band.productionTime || 0);
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setNewName('');
      setNewThickness(0.45);
      setNewCategory('');
      setNewPricePerMeter(0);
      setNewProductionTime(0);
  };

  const content = (
    <div className={`${isEmbedded ? 'w-full' : 'bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[85vh]'}`}>
      <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Disc className="text-emerald-600" size={20} />
            Catálogo de Fitas de Borda
        </h3>
        {!isEmbedded && (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <X size={20} />
          </button>
        )}
      </div>

      <div className={`p-4 space-y-4 ${isEmbedded ? '' : 'overflow-y-auto custom-scrollbar'}`}>
          <div className={`space-y-4 p-4 rounded-lg border transition-colors ${editingId ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                    {editingId ? 'Editando Fita' : 'Nova Fita'}
                </span>
                {editingId && (
                    <button onClick={handleCancelEdit} className="text-[10px] text-red-500 flex items-center gap-1 hover:underline">
                        <Ban size={10} /> Cancelar
                    </button>
                )}
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nome da Fita / Cor</label>
                    <input 
                        type="text" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Ex: Fita PVC Branca TX"
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Espessura (mm)</label>
                        <select 
                            value={newThickness}
                            onChange={e => setNewThickness(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        >
                            <option value={0.45}>0.45 mm (Fina)</option>
                            <option value={1.0}>1.0 mm</option>
                            <option value={2.0}>2.0 mm (Grossa)</option>
                            <option value={3.0}>3.0 mm</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Categoria (Opcional)</label>
                        <input 
                            type="text" 
                            value={newCategory} 
                            onChange={e => setNewCategory(e.target.value)}
                            placeholder="Ex: Madeirado"
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Preço/Metro (R$)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={newPricePerMeter || ''} 
                            onChange={e => setNewPricePerMeter(Number(e.target.value))}
                            placeholder="0.00"
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tempo Prod. (min/m)</label>
                        <input 
                            type="number" 
                            value={newProductionTime || ''} 
                            onChange={e => setNewProductionTime(Number(e.target.value))}
                            placeholder="0"
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>
            </div>

            <button 
                onClick={handleSave}
                disabled={!newName.trim()}
                className={`w-full px-4 py-2 text-white rounded font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${editingId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-black'}`}
            >
                {editingId ? <Save size={16} /> : <Plus size={16} />} 
                {editingId ? 'Salvar Alterações' : 'Adicionar Fita'}
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Fita</th>
                  <th className="px-3 py-2 text-center">Esp.</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {edgeBands.map(band => (
                  <tr key={band.id} className={`hover:bg-slate-50 ${editingId === band.id ? 'bg-emerald-50' : ''}`}>
                    <td className="px-3 py-2">
                        <div className="font-bold text-slate-700">{band.name}</div>
                        <div className="flex gap-2 items-center">
                            {band.colorCategory && <span className="text-[10px] text-slate-400 font-medium uppercase">{band.colorCategory}</span>}
                            {band.pricePerMeter !== undefined && band.pricePerMeter > 0 && <span className="text-[10px] text-emerald-600 font-bold">R$ {band.pricePerMeter.toFixed(2)}/m</span>}
                            {band.productionTime !== undefined && band.productionTime > 0 && <span className="text-[10px] text-blue-600 font-bold">{band.productionTime} min/m</span>}
                        </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                        <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                            {band.thickness}mm
                        </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(band)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                            title="Editar"
                          >
                             <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => onRemove(band.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {edgeBands.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-slate-400 italic">
                      Nenhuma fita cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );

  return isEmbedded ? content : (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {content}
    </div>
  );
};
