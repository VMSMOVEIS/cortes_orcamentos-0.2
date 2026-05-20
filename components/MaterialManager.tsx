
import React, { useState } from 'react';
import { RegisteredMaterial } from '../types';
import { Plus, Trash2, X, CheckSquare, Edit2, Save, Ban, GripHorizontal, Palette } from 'lucide-react';

interface MaterialManagerProps {
  materials: RegisteredMaterial[];
  onAdd: (mat: RegisteredMaterial) => void;
  onUpdate: (mat: RegisteredMaterial) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  isEmbedded?: boolean;
}

export const MaterialManager: React.FC<MaterialManagerProps> = ({ materials, onAdd, onUpdate, onRemove, onClose, isEmbedded }) => {
  const [newName, setNewName] = useState('');
  const [newThickness, setNewThickness] = useState(15);
  const [newHasEdgeBand, setNewHasEdgeBand] = useState(true);
  const [newEdgeStyle, setNewEdgeStyle] = useState<'solid' | 'dashed'>('solid');
  const [newEdgeColor, setNewEdgeColor] = useState(''); // New State for Color
  const [newCost, setNewCost] = useState<number>(0); // New State for Cost
  const [newSheetArea, setNewSheetArea] = useState<number>(5.04); // Default area for a standard 2.75x1.83 sheet is ~5.04m2
  const [newProductionTime, setNewProductionTime] = useState<number>(0); // New State for Production Time
  const [newCategory, setNewCategory] = useState<'sheet' | 'hardware' | 'component'>('sheet');
  const [newUnit, setNewUnit] = useState<'un' | 'm' | 'm2' | 'kg'>('m2');
  const [editingId, setEditingId] = useState<string | null>(null);

  const m2Price = newSheetArea > 0 ? newCost / newSheetArea : 0;

  const handleSave = () => {
    if (!newName.trim()) return;

    if (editingId) {
        // Update mode
        onUpdate({
            id: editingId,
            name: newName.trim(),
            thickness: newThickness,
            hasEdgeBand: newHasEdgeBand,
            edgeStyle: newEdgeStyle,
            edgeColor: newEdgeColor.trim() || undefined,
            cost: newCost,
            sheetArea: newSheetArea,
            productionTime: newProductionTime,
            category: newCategory,
            unit: newUnit
        });
        setEditingId(null);
    } else {
        // Add mode
        onAdd({
            id: Date.now().toString(),
            name: newName.trim(),
            thickness: newThickness,
            hasEdgeBand: newHasEdgeBand,
            edgeStyle: newEdgeStyle,
            edgeColor: newEdgeColor.trim() || undefined,
            cost: newCost,
            sheetArea: newSheetArea,
            productionTime: newProductionTime,
            category: newCategory,
            unit: newUnit
        });
    }

    // Reset form
    setNewName('');
    setNewThickness(15);
    setNewHasEdgeBand(true);
    setNewEdgeStyle('solid');
    setNewEdgeColor('');
    setNewCost(0);
    setNewSheetArea(5.04);
    setNewProductionTime(0);
    setNewCategory('sheet');
    setNewUnit('m2');
  };

  const handleEdit = (mat: RegisteredMaterial) => {
    setEditingId(mat.id);
    setNewName(mat.name);
    setNewThickness(mat.thickness);
    setNewHasEdgeBand(mat.hasEdgeBand ?? true);
    setNewEdgeStyle(mat.edgeStyle || 'solid');
    setNewEdgeColor(mat.edgeColor || '');
    setNewCost(mat.cost || 0);
    setNewSheetArea(mat.sheetArea || 5.04);
    setNewProductionTime(mat.productionTime || 0);
    setNewCategory(mat.category || 'sheet');
    setNewUnit(mat.unit || 'm2');
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setNewName('');
      setNewThickness(15);
      setNewHasEdgeBand(true);
      setNewEdgeStyle('solid');
      setNewEdgeColor('');
      setNewCost(0);
      setNewSheetArea(5.04);
      setNewProductionTime(0);
      setNewCategory('sheet');
      setNewUnit('m2');
  };

  const content = (
    <div className={`${isEmbedded ? 'w-full' : 'bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[85vh]'}`}>
      <div className="flex justify-between items-center p-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <h3 className="font-bold text-slate-800 text-sm">Gerenciar Materiais</h3>
        {!isEmbedded && (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <X size={18} />
          </button>
        )}
      </div>

      <div className={`p-3 space-y-3 ${isEmbedded ? '' : 'overflow-y-auto custom-scrollbar'}`}>
        <div className={`space-y-2 p-3 rounded-lg border transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                    {editingId ? 'Editando Material' : 'Adicionar Novo'}
                </span>
                {editingId && (
                    <button onClick={handleCancelEdit} className="text-[10px] text-red-500 flex items-center gap-1 hover:underline">
                        <Ban size={10} /> Cancelar
                    </button>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 items-end">
                <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nome</label>
                    <input 
                        type="text" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Ex: MDF Branco"
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Espessura</label>
                    <div className="relative">
                        <input 
                        type="number" 
                        value={newThickness} 
                        onChange={e => setNewThickness(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 text-right pr-6"
                        />
                        <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400">mm</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Categoria</label>
                    <select 
                        value={newCategory} 
                        onChange={e => setNewCategory(e.target.value as any)}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="sheet">Chapa (Padrão)</option>
                        <option value="hardware">Ferragem</option>
                        <option value="component">Componente</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Unidade</label>
                    <select 
                        value={newUnit} 
                        onChange={e => setNewUnit(e.target.value as any)}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="m2">Metro Quadrado (m²)</option>
                        <option value="m">Metro Linear (m)</option>
                        <option value="un">Unidade (un)</option>
                        <option value="kg">Quilo (kg)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Custo Chapa (R$)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={newCost || ''} 
                        onChange={e => setNewCost(Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Metragem Chapa (m²)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        value={newSheetArea || ''} 
                        onChange={e => setNewSheetArea(Number(e.target.value))}
                        placeholder="Ex: 5.04"
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Valor por m² (R$)</label>
                    <div className="w-full bg-slate-100 border border-slate-200 rounded px-2 py-1.5 text-xs text-slate-600 font-bold">
                        {m2Price.toFixed(2)}
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Tempo Prod. (min)</label>
                    <input 
                        type="number" 
                        value={newProductionTime || ''} 
                        onChange={e => setNewProductionTime(Number(e.target.value))}
                        placeholder="0"
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button 
                            onClick={() => setNewHasEdgeBand(!newHasEdgeBand)}
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${newHasEdgeBand ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-transparent'}`}
                        >
                            <CheckSquare size={10} />
                        </button>
                        <span className="text-xs font-medium text-slate-700">Aceita Fita?</span>
                    </label>
                </div>

                {newHasEdgeBand && (
                    <>
                        <div className="bg-white/50 p-1.5 rounded border border-slate-200">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                <GripHorizontal size={10}/> Estilo
                            </label>
                            <div className="flex gap-2">
                                <label className={`flex-1 flex items-center gap-1 p-1.5 rounded cursor-pointer border text-[10px] font-bold transition-all ${newEdgeStyle === 'solid' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                    <input type="radio" className="hidden" checked={newEdgeStyle === 'solid'} onChange={() => setNewEdgeStyle('solid')} />
                                    <div className="w-2.5 h-2.5 rounded-full border border-current flex items-center justify-center">
                                        {newEdgeStyle === 'solid' && <div className="w-1.5 h-1.5 rounded-full bg-current"></div>}
                                    </div>
                                    Sólida
                                </label>
                                <label className={`flex-1 flex items-center gap-1 p-1.5 rounded cursor-pointer border text-[10px] font-bold transition-all ${newEdgeStyle === 'dashed' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                    <input type="radio" className="hidden" checked={newEdgeStyle === 'dashed'} onChange={() => setNewEdgeStyle('dashed')} />
                                    <div className="w-2.5 h-2.5 rounded-full border border-current flex items-center justify-center">
                                        {newEdgeStyle === 'dashed' && <div className="w-1.5 h-1.5 rounded-full bg-current"></div>}
                                    </div>
                                    Tracejada
                                </label>
                            </div>
                        </div>

                        {/* EDGE COLOR INPUT */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                                <Palette size={10}/> Cor da Fita (Opcional)
                            </label>
                            <input 
                                type="text" 
                                value={newEdgeColor} 
                                onChange={e => setNewEdgeColor(e.target.value)}
                                placeholder="Ex: Fita Preta"
                                className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-500 placeholder:text-slate-300"
                            />
                        </div>
                    </>
                )}
            </div>

            <button 
                onClick={handleSave}
                disabled={!newName.trim()}
                className={`w-full px-3 py-1.5 text-white rounded font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${editingId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {editingId ? <Save size={14} /> : <Plus size={14} />} 
                {editingId ? 'Salvar' : 'Adicionar'}
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                <tr>
                  <th className="px-2 py-1.5 text-left">Nome</th>
                  <th className="px-2 py-1.5 text-center">Fita</th>
                  <th className="px-2 py-1.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map(mat => (
                  <tr key={mat.id} className={`hover:bg-slate-50 ${editingId === mat.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-2 py-1.5">
                        <div className="font-medium">{mat.name} <span className="text-slate-400 text-[10px]">({mat.thickness}mm)</span></div>
                        {mat.edgeColor && <div className="text-[9px] text-blue-500 font-bold flex items-center gap-1"><Palette size={8}/> {mat.edgeColor}</div>}
                        <div className="flex gap-2 mt-0.5">
                            {mat.cost !== undefined && mat.cost > 0 && (
                                <div className="text-[9px] text-emerald-600 font-bold">
                                    m²: R$ {((mat.cost || 0) / (mat.sheetArea || 5.04)).toFixed(2)}
                                </div>
                            )}
                            {mat.productionTime !== undefined && mat.productionTime > 0 && <div className="text-[9px] text-blue-600 font-bold">{mat.productionTime} min</div>}
                        </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                        {mat.hasEdgeBand === false ? (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">NÃO</span>
                        ) : (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                                {mat.edgeStyle === 'dashed' ? 'TRACE' : 'SÓLIDA'}
                            </span>
                        )}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(mat)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Editar"
                          >
                             <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => onRemove(mat.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={14} />
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {materials.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-2 py-4 text-center text-slate-400 italic">
                      Nenhum material cadastrado.
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {content}
    </div>
  );
};
