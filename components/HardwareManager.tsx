
import React, { useState, useRef } from 'react';
import { RegisteredHardware } from '../types';
import { Plus, Trash2, X, Upload, Image as ImageIcon, Search, Edit2, Save, Ban } from 'lucide-react';

interface HardwareManagerProps {
  hardwareList: RegisteredHardware[];
  onAdd: (hw: RegisteredHardware) => void;
  onRemove: (id: string) => void;
  onUpdate: (hw: RegisteredHardware) => void;
  onClose: () => void;
  isEmbedded?: boolean;
}

export const HardwareManager: React.FC<HardwareManagerProps> = ({ hardwareList, onAdd, onRemove, onUpdate, onClose, isEmbedded }) => {
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Outros');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newProductionTime, setNewProductionTime] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!newName.trim()) return;
    
    if (editingId) {
        // Update existing item explicitly
        const existing = hardwareList.find(h => h.id === editingId);
        if (existing) {
             onUpdate({
                ...existing,
                name: newName.trim(),
                category: newCategory,
                price: newPrice,
                productionTime: newProductionTime,
                imageUrl: tempImage || undefined
            });
        }
        setEditingId(null);
    } else {
        // Add new item (with duplicate check logic)
        const existing = hardwareList.find(h => h.name.toLowerCase() === newName.trim().toLowerCase());
        
        if (existing) {
            if(confirm(`O item "${existing.name}" já existe. Deseja atualizar a imagem, preço e tempo dele?`)) {
                onUpdate({
                    ...existing,
                    category: newCategory,
                    price: newPrice,
                    productionTime: newProductionTime,
                    imageUrl: tempImage || existing.imageUrl
                });
            }
        } else {
            onAdd({
                id: Date.now().toString(),
                name: newName.trim(),
                category: newCategory,
                price: newPrice,
                productionTime: newProductionTime,
                imageUrl: tempImage || undefined
            });
        }
    }

    setNewName('');
    setNewCategory('Outros');
    setNewPrice(0);
    setNewProductionTime(0);
    setTempImage(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditClick = (hw: RegisteredHardware) => {
      setEditingId(hw.id);
      setNewName(hw.name);
      setNewCategory(hw.category || 'Outros');
      setNewPrice(hw.price || 0);
      setNewProductionTime(hw.productionTime || 0);
      setTempImage(hw.imageUrl || null);
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setNewName('');
      setNewCategory('Outros');
      setNewPrice(0);
      setNewProductionTime(0);
      setTempImage(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredList = hardwareList.filter(h => 
      h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className={`${isEmbedded ? 'w-full' : 'bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]'}`}>
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <ImageIcon className="text-blue-600" size={20} />
            Catálogo de Ferragens & Acessórios
        </h3>
        {!isEmbedded && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={24} />
          </button>
        )}
      </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            
            {/* Left: Form */}
            <div className={`p-6 md:w-1/3 border-r border-slate-200 flex flex-col gap-4 transition-colors overflow-y-auto ${editingId ? 'bg-blue-50' : 'bg-slate-50'}`}>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-500">
                        {editingId ? 'Editando Item' : 'Novo Item'}
                    </span>
                    {editingId && (
                        <button onClick={handleCancelEdit} className="text-xs text-red-500 flex items-center gap-1 hover:underline">
                            <Ban size={12} /> Cancelar
                        </button>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome da Ferragem</label>
                    <input 
                        type="text" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Ex: Dobradiça 35mm"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                    <select 
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="Dobradiça">Dobradiça</option>
                        <option value="Corrediça">Corrediça</option>
                        <option value="Puxador">Puxador</option>
                        <option value="Parafuso">Parafuso</option>
                        <option value="Acessório">Acessório</option>
                        <option value="Outros">Outros</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Preço Unitário (R$)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={newPrice || ''} 
                            onChange={e => setNewPrice(Number(e.target.value))}
                            placeholder="0.00"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Tempo Prod. (min)</label>
                        <input 
                            type="number" 
                            value={newProductionTime || ''} 
                            onChange={e => setNewProductionTime(Number(e.target.value))}
                            placeholder="0"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Imagem (Opcional)</label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer bg-white transition-colors relative overflow-hidden group"
                    >
                        {tempImage ? (
                            <img src={tempImage} alt="Preview" className="w-full h-full object-contain p-2" />
                        ) : (
                            <div className="text-center text-slate-400">
                                <Upload size={24} className="mx-auto mb-1" />
                                <span className="text-xs">Clique para enviar</span>
                            </div>
                        )}
                        {tempImage && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">Alterar</span>
                            </div>
                        )}
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                    />
                </div>

                <button 
                    onClick={handleSave}
                    disabled={!newName.trim()}
                    className={`w-full py-2 text-white rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 mt-auto transition-colors disabled:opacity-50 ${editingId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {editingId ? <Save size={18} /> : <Plus size={18} />}
                    {editingId ? 'Salvar Alterações' : 'Adicionar Item'}
                </button>
            </div>

            {/* Right: List */}
            <div className="flex-1 flex flex-col p-4 bg-white overflow-hidden">
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar no catálogo..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 pr-2">
                    {filteredList.map(hw => (
                        <div 
                            key={hw.id} 
                            className={`flex items-center gap-3 p-2 rounded-lg border transition-all group ${editingId === hw.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50'}`}
                        >
                            <div className="w-12 h-12 bg-white rounded border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {hw.imageUrl ? (
                                    <img src={hw.imageUrl} alt={hw.name} className="w-full h-full object-contain" />
                                ) : (
                                    <ImageIcon size={20} className="text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-700 text-sm truncate" title={hw.name}>{hw.name}</h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{hw.category || 'Outros'}</span>
                                    {hw.price !== undefined && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                                            R$ {hw.price.toFixed(2)}
                                        </span>
                                    )}
                                    {hw.productionTime !== undefined && hw.productionTime > 0 && (
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded">
                                            {hw.productionTime} min
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleEditClick(hw)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => onRemove(hw.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Remover"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredList.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            <p className="text-sm">Nenhum item encontrado.</p>
                        </div>
                    )}
                </div>
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
