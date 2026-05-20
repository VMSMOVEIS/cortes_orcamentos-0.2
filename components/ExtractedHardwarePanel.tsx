import React, { useState } from 'react';
import { ExtractedComponent, RegisteredHardware } from '../types';
import { Box, Wrench, Hammer, ShoppingBag, ArrowRight, Layers, Sigma, List, FileText, Ruler, Plus, Trash2, X as CloseIcon, Search } from 'lucide-react';

interface ExtractedHardwarePanelProps {
  hardware: ExtractedComponent[];
  hardwareRegistry: RegisteredHardware[];
  onDelete: (id: string) => void;
  onMoveToParts: (id: string) => void;
  onAdd: (hw: ExtractedComponent) => void;
}

// Helper to extract length (max dimension) from string like "500x50x15"
const getLengthMm = (dimStr?: string): number => {
    if (!dimStr || dimStr === '-' || dimStr === '') return 0;
    const nums = dimStr.split('x').map(s => parseFloat(s)).filter(n => !isNaN(n));
    if (nums.length === 0) return 0;
    return Math.max(...nums);
};

export const ExtractedHardwarePanel: React.FC<ExtractedHardwarePanelProps> = ({ hardware, hardwareRegistry, onDelete, onMoveToParts, onAdd }) => {
  const [viewMode, setViewMode] = useState<'consolidated' | 'detailed'>('consolidated');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHw, setNewHw] = useState({ name: '', category: 'Outros', quantity: 1, dimensions: '' });

  const handleSelectFromRegistry = (reg: RegisteredHardware) => {
    onAdd({
        id: `manual_${Date.now()}`,
        name: reg.name,
        originalName: reg.name,
        category: reg.category || 'Outros',
        quantity: 1,
        dimensions: '',
        sourceFile: 'Manual'
    });
    setShowAddForm(false);
  };

  // 1. Agrupamento Global (Consolidado) - Soma quantidades se Nome e Dimensão forem iguais
  const globalSummary = React.useMemo<{
      name: string;
      originalName: string;
      category: string;
      dimensions: string;
      totalQty: number;
      totalLengthMm: number;
      sources: Set<string>;
  }[]>(() => {
      const summary = new Map<string, {
          name: string;
          originalName: string;
          category: string;
          dimensions: string;
          totalQty: number;
          totalLengthMm: number;
          sources: Set<string>;
      }>();

      hardware.forEach(h => {
          // Cria uma chave única baseada no Nome e na Dimensão
          // Ex: "Corrediça Telescópica-400x45x12"
          const dimKey = h.dimensions ? h.dimensions.replace(/\s/g, '') : 'STD';
          const key = `${h.name.toLowerCase()}-${dimKey}`;

          if (!summary.has(key)) {
              summary.set(key, {
                  name: h.name,
                  originalName: h.originalName, // Mantém um exemplo do original
                  category: h.category,
                  dimensions: h.dimensions || '-',
                  totalQty: 0,
                  totalLengthMm: 0,
                  sources: new Set()
              });
          }

          const entry = summary.get(key)!;
          entry.totalQty += h.quantity;
          
          // Calcula metragem linear total (comprimento * quantidade)
          const len = getLengthMm(h.dimensions);
          entry.totalLengthMm += (len * h.quantity);

          if (h.sourceFile) entry.sources.add(h.sourceFile);
      });

      // Converte para array e ordena por categoria e depois nome
      return Array.from(summary.values()).sort((a, b) => {
          if (a.category !== b.category) return a.category.localeCompare(b.category);
          return a.name.localeCompare(b.name);
      });
  }, [hardware]);

  // 2. Agrupamento por Arquivo (Detalhado)
  const groupedBySource = React.useMemo<Record<string, ExtractedComponent[]>>(() => {
      const groups: Record<string, ExtractedComponent[]> = {};
      hardware.forEach(h => {
          const source = h.sourceFile || "Manual / Desconhecido";
          if (!groups[source]) groups[source] = [];
          groups[source].push(h);
      });
      return groups;
  }, [hardware]);

  // Totais Gerais
  const totalItemsCount = hardware.reduce((acc, h) => acc + h.quantity, 0);
  const totalLinearMeters = globalSummary.reduce((acc, item) => acc + item.totalLengthMm, 0) / 1000;
  const uniqueTypesCount = globalSummary.length;

  if (hardware.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm mx-auto max-w-4xl mt-8 p-8">
              <Box size={64} className="mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-slate-600 mb-2">Nenhum componente detectado</h3>
              <p className="max-w-md text-center text-sm mb-8">
                  O sistema analisa automaticamente o nome das peças do arquivo 3D. 
                  Tente nomear objetos como "Dobradiça", "Puxador" ou "Corrediça" no seu software 3D.
              </p>
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-base flex items-center gap-2 transition-all shadow-lg shadow-blue-100 hover:scale-105 active:scale-95"
              >
                <Plus size={20} /> Adicionar Ferragem Manualmente
              </button>

              {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-black text-slate-800 flex items-center gap-2">
                                <Plus size={20} className="text-blue-600"/> Adicionar Ferragem
                            </h3>
                            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                                <CloseIcon size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Opção 1: Selecionar do Cadastro */}
                            {hardwareRegistry.length > 0 && (
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Selecionar do Cadastro</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {hardwareRegistry.map(reg => (
                                            <button 
                                                key={reg.id}
                                                onClick={() => handleSelectFromRegistry(reg)}
                                                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                                            >
                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 border border-slate-100 shadow-sm">
                                                    <Search size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700">{reg.name}</div>
                                                    <div className="text-[10px] text-slate-400">{reg.category}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300"><span className="bg-white px-2">Ou cadastro manual</span></div>
                            </div>

                            {/* Opção 2: Cadastro Manual Livre */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome da Ferragem</label>
                                    <input 
                                        type="text" 
                                        value={newHw.name}
                                        onChange={e => setNewHw({...newHw, name: e.target.value})}
                                        placeholder="Ex: Dobradiça Reta 35mm"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                        <select 
                                            value={newHw.category}
                                            onChange={e => setNewHw({...newHw, category: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                        >
                                            <option value="Dobradiça">Dobradiça</option>
                                            <option value="Corrediça">Corrediça</option>
                                            <option value="Puxador">Puxador</option>
                                            <option value="Parafuso">Parafuso</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantidade</label>
                                        <input 
                                            type="number" 
                                            value={newHw.quantity}
                                            onChange={e => setNewHw({...newHw, quantity: Math.max(1, parseInt(e.target.value) || 0)})}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dimensões (Opcional)</label>
                                    <input 
                                        type="text" 
                                        value={newHw.dimensions}
                                        onChange={e => setNewHw({...newHw, dimensions: e.target.value})}
                                        placeholder="Ex: 400x45x12"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button 
                                onClick={() => setShowAddForm(false)}
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => {
                                    if (!newHw.name) return;
                                    onAdd({
                                        id: `manual_${Date.now()}`,
                                        name: newHw.name,
                                        originalName: newHw.name,
                                        category: newHw.category,
                                        quantity: newHw.quantity,
                                        dimensions: newHw.dimensions,
                                        sourceFile: 'Manual'
                                    });
                                    setNewHw({ name: '', category: 'Outros', quantity: 1, dimensions: '' });
                                    setShowAddForm(false);
                                }}
                                disabled={!newHw.name}
                                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-200"
                            >
                                Adicionar Manual
                            </button>
                        </div>
                    </div>
                </div>
              )}
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 pb-20 animate-fade-in px-4">
        
        {/* Painel de Resumo (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-1">
                        <Wrench className="text-amber-600" size={20}/> Ferragens
                    </h2>
                    <p className="text-slate-500 text-xs">Gestão de Insumos</p>
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                    <Layers size={20} />
                </div>
                <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipos Únicos</span>
                    <span className="text-2xl font-black text-slate-800">{uniqueTypesCount}</span>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                    <Sigma size={20} />
                </div>
                <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Itens</span>
                    <span className="text-2xl font-black text-slate-800">{totalItemsCount}</span>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <Ruler size={20} />
                </div>
                <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metragem Linear</span>
                    <span className="text-2xl font-black text-slate-800">{totalLinearMeters.toFixed(2)}m</span>
                </div>
            </div>
        </div>

        {/* Tabs de Visualização */}
        <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                <button 
                    onClick={() => setViewMode('consolidated')}
                    className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'consolidated' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Layers size={16} /> Resumo Consolidado (Compras)
                </button>
                <button 
                    onClick={() => setViewMode('detailed')}
                    className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'detailed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <List size={16} /> Detalhado por Arquivo
                </button>
            </div>

            <button 
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-base flex items-center gap-2 transition-all shadow-lg shadow-blue-100 hover:scale-105 active:scale-95"
            >
                <Plus size={20} /> Adicionar Ferragem Manual
            </button>
        </div>

        {/* MODAL / FORM ADICIONAR MANUAL */}
        {showAddForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-black text-slate-800 flex items-center gap-2">
                            <Plus size={20} className="text-blue-600"/> Adicionar Ferragem
                        </h3>
                        <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                            <CloseIcon size={24} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        
                        <div className="space-y-4">
                            <div className="relative">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Buscar Ferragem no Cadastro</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        value={newHw.name}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setNewHw(prev => ({ ...prev, name: val }));
                                        }}
                                        placeholder="Digite para buscar..."
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                        autoFocus
                                    />
                                </div>
                                
                                {/* Dropdown de Sugestões */}
                                {newHw.name && !hardwareRegistry.find(h => h.name === newHw.name) && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-10 custom-scrollbar">
                                        {hardwareRegistry.filter(h => h.name.toLowerCase().includes(newHw.name.toLowerCase())).length > 0 ? (
                                            hardwareRegistry
                                                .filter(h => h.name.toLowerCase().includes(newHw.name.toLowerCase()))
                                                .map(h => (
                                                    <button
                                                        key={h.id}
                                                        onClick={() => setNewHw({ ...newHw, name: h.name, category: h.category || 'Outros' })}
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between group border-b border-slate-50 last:border-0"
                                                    >
                                                        <span className="font-bold text-slate-700 text-sm group-hover:text-blue-700">{h.name}</span>
                                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded group-hover:bg-blue-100 group-hover:text-blue-600">{h.category}</span>
                                                    </button>
                                                ))
                                        ) : (
                                            <div className="p-4 text-center text-xs text-slate-400 italic">
                                                Nenhuma ferragem encontrada.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                    <input 
                                        type="text" 
                                        value={newHw.category}
                                        readOnly
                                        className="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-500 outline-none cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantidade</label>
                                    <input 
                                        type="number" 
                                        value={newHw.quantity}
                                        onChange={e => setNewHw({...newHw, quantity: Math.max(1, parseInt(e.target.value) || 0)})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dimensões (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={newHw.dimensions}
                                    onChange={e => setNewHw({...newHw, dimensions: e.target.value})}
                                    placeholder="Ex: 400x45x12"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button 
                            onClick={() => setShowAddForm(false)}
                            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={() => {
                                if (!newHw.name) return;
                                // Validate if exists in registry
                                const exists = hardwareRegistry.find(h => h.name === newHw.name);
                                if (!exists) {
                                    alert("Por favor, selecione uma ferragem válida do cadastro.");
                                    return;
                                }

                                onAdd({
                                    id: `manual_${Date.now()}`,
                                    name: newHw.name,
                                    originalName: newHw.name,
                                    category: newHw.category,
                                    quantity: newHw.quantity,
                                    dimensions: newHw.dimensions,
                                    sourceFile: 'Manual'
                                });
                                setNewHw({ name: '', category: 'Outros', quantity: 1, dimensions: '' });
                                setShowAddForm(false);
                            }}
                            disabled={!newHw.name || !hardwareRegistry.find(h => h.name === newHw.name)}
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-200"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW 1: CONSOLIDATED (GLOBAL SUMMARY) */}
        {viewMode === 'consolidated' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 text-lg">
                        <ShoppingBag size={20} className="text-emerald-600" /> Lista de Compras Global
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Soma total de itens iguais, independente do projeto de origem.</p>
                </div>
                
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-slate-500 border-b border-slate-100 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 font-bold w-48">Categoria</th>
                            <th className="px-6 py-4 font-bold">Especificação do Componente</th>
                            <th className="px-6 py-4 font-bold text-center">Ref. Dimensão</th>
                            <th className="px-6 py-4 font-bold text-center">Total Linear</th>
                            <th className="px-6 py-4 font-bold text-center bg-blue-50/50 text-blue-800">Qtd. Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {globalSummary.map((item, idx) => (
                            <tr key={`summary-${idx}`} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
                                        {item.category === 'Dobradiça' && <Hammer size={12} />}
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 text-base">{item.name}</div>
                                    <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                                        {Array.from(item.sources).slice(0, 3).map(src => (
                                            <span key={src} className="bg-slate-100 px-1.5 rounded border border-slate-200">{src}</span>
                                        ))}
                                        {item.sources.size > 3 && <span>+ {item.sources.size - 3} origens</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center text-slate-500 font-mono text-xs">
                                    {item.dimensions !== '-' ? (
                                        <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 font-bold">{item.dimensions}</span>
                                    ) : (
                                        <span className="opacity-50">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {item.totalLengthMm > 0 ? (
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-slate-700">{(item.totalLengthMm / 1000).toFixed(2)} m</span>
                                            <span className="text-[9px] text-slate-400">Somatório</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center bg-blue-50/30">
                                    <span className="text-2xl font-black text-blue-600 block leading-none">{item.totalQty}</span>
                                    <span className="text-[10px] font-bold text-blue-400 uppercase">Unidades</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                            <td colSpan={3} className="px-6 py-3 text-right font-bold text-slate-600 uppercase text-xs">Totais Gerais:</td>
                            <td className="px-6 py-3 text-center font-bold text-emerald-600 text-sm">{totalLinearMeters.toFixed(2)} m</td>
                            <td className="px-6 py-3 text-center font-black text-slate-800 text-lg">{totalItemsCount} un</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        )}

        {/* VIEW 2: DETAILED BY SOURCE */}
        {viewMode === 'detailed' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                {Object.entries(groupedBySource).map(([source, items]: [string, ExtractedComponent[]]) => (
                    <div key={source} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <FileText size={16} /> Origem: {source}
                            </h3>
                            <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                                {items.length} itens listados
                            </span>
                        </div>
                        
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-slate-500 border-b border-slate-100 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3 font-bold w-40">Categoria</th>
                                    <th className="px-6 py-3 font-bold">Nome no Projeto 3D</th>
                                    <th className="px-6 py-3 font-bold text-center">Dimensão</th>
                                    <th className="px-6 py-3 font-bold text-center">Metragem</th>
                                    <th className="px-6 py-3 font-bold text-center">Quantidade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((item, idx) => {
                                    const len = getLengthMm(item.dimensions);
                                    const totalLen = len * item.quantity;
                                    
                                    return (
                                        <tr key={`${item.id}-${idx}`} className="hover:bg-amber-50/30 transition-colors">
                                            <td className="px-6 py-3">
                                                <span className="text-xs font-medium text-slate-600">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-slate-800">
                                                {item.name}
                                                <div className="text-[10px] text-slate-400 mt-0.5">Original: {item.originalName}</div>
                                            </td>
                                            <td className="px-6 py-3 text-center text-slate-500 font-mono text-xs">
                                                {item.dimensions || '-'}
                                            </td>
                                            <td className="px-6 py-3 text-center text-slate-600 text-xs font-medium">
                                                {totalLen > 0 ? `${(totalLen / 1000).toFixed(2)} m` : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => onMoveToParts(item.id)}
                                                        className="p-1 px-2 text-blue-500 hover:bg-blue-50 rounded text-xs font-bold border border-blue-100 flex items-center gap-1 transition-all"
                                                        title="Mover de volta para Extração de Peças"
                                                    >
                                                        <ArrowRight size={12} className="rotate-180" /> Peças
                                                    </button>
                                                    <span className="font-bold text-slate-700 mx-2">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => onDelete(item.id)}
                                                        className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                        title="Remover item"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};