
import React, { useState } from 'react';
import { 
    Disc, Package, Scissors, Box, Layers, 
    TrendingUp, Info, Search, Edit3, ChevronDown,
    Award, Percent, Ruler, ClipboardList, Settings,
    FileSpreadsheet, Zap, X, Gauge
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { OptimizationResult, RegisteredMaterial, RegisteredHardware, RegisteredEdgeBand } from '../types';

interface MaterialsViewProps {
    materialCosts: any[];
    edgeBandCosts: any[];
    hardwareCosts: any[];
    totalMaterialCost: number;
    totalEdgeCost: number;
    totalHardwareCost: number;
    subtotal: number;
    optimizationResult: OptimizationResult | null;
    globalConfig: any;
    materials?: RegisteredMaterial[];
    edgeRegistry?: RegisteredEdgeBand[];
    hardwareRegistry?: RegisteredHardware[];
    onUpdateMaterials?: (materials: RegisteredMaterial[]) => void;
    onUpdateEdges?: (edges: RegisteredEdgeBand[]) => void;
    onUpdateHardwareRegistry?: (hardware: RegisteredHardware[]) => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({ 
    materialCosts, 
    edgeBandCosts, 
    hardwareCosts,
    totalMaterialCost,
    totalEdgeCost,
    totalHardwareCost,
    subtotal,
    optimizationResult,
    globalConfig,
    materials = [],
    edgeRegistry = [],
    hardwareRegistry = [],
    onUpdateMaterials,
    onUpdateEdges,
    onUpdateHardwareRegistry
}) => {
    const [activeFilter, setActiveFilter] = useState<'todos' | 'chapas' | 'fitas' | 'diversos'>('todos');
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [editValue, setEditValue] = useState<number>(0);

    const handleSaveEdit = () => {
        if (!editingItem) return;

        if (editingItem.type === 'chapa' && onUpdateMaterials) {
            const registryItem = materials.find(m => m.name === editingItem.materialName && m.thickness === editingItem.thickness);
            if (registryItem) {
                const sheetArea = registryItem.sheetArea || (globalConfig?.sheetWidth * globalConfig?.sheetHeight) / 1000000;
                // newValue is price per m2, convert to sheet cost
                const newSheetCost = editValue * sheetArea;
                onUpdateMaterials(materials.map(m => m.id === registryItem.id ? { ...m, cost: newSheetCost } : m));
            }
        } else if (editingItem.type === 'fita' && onUpdateEdges) {
            const registryItem = edgeRegistry.find(r => r.name === editingItem.name);
            if (registryItem) {
                onUpdateEdges(edgeRegistry.map(r => r.id === registryItem.id ? { ...r, pricePerMeter: editValue } : r));
            }
        } else if (editingItem.type === 'ferragem' && onUpdateHardwareRegistry) {
            const registryItem = hardwareRegistry.find(r => r.name === editingItem.name);
            if (registryItem) {
                onUpdateHardwareRegistry(hardwareRegistry.map(r => r.id === registryItem.id ? { ...r, price: editValue } : r));
            }
        }
        setEditingItem(null);
    };

    const startEditing = (item: any) => {
        setEditingItem(item);
        setEditValue(item.type === 'chapa' ? item.unitCost : item.unitPrice);
    };

    const grandTotal = totalMaterialCost + totalEdgeCost + totalHardwareCost;
    const laborPercentOfTotal = subtotal > 0 ? (grandTotal / subtotal) * 100 : 0;
    
    const sheetsCount = materialCosts.reduce((acc, m) => acc + m.sheets, 0);
    const totalEdgesM = edgeBandCosts.reduce((acc, e) => acc + e.length, 0);

    // Filtered lists logic
    const showChapas = activeFilter === 'todos' || activeFilter === 'chapas';
    const showFitas = activeFilter === 'todos' || activeFilter === 'fitas';
    const showDiversos = activeFilter === 'todos' || activeFilter === 'diversos';

    const filteredMaterials = materialCosts;
    const filteredEdges = edgeBandCosts;
    const filteredHardware = hardwareCosts;

    // Charts
    const chartData = [
        { name: 'Chapas (MDF/MDP)', value: totalMaterialCost, color: '#2563eb' },
        { name: 'Fitas de Borda', value: totalEdgeCost, color: '#d97706' },
        { name: 'Acessórios / Diversos', value: totalHardwareCost, color: '#8b5cf6' },
        { name: 'Outros / Consumíveis', value: totalMaterialCost * 0.05, color: '#64748b' } // Estimated 5%
    ];

    // Calculate Efficiency from OptimizationResult and Material Costs properly
    const calculatedTotalArea = materialCosts.reduce((acc, m) => {
        const registryItem = materials.find(reg => reg.name === m.materialName && reg.thickness === m.thickness);
        const sArea = registryItem?.sheetArea || (globalConfig?.sheetWidth * globalConfig?.sheetHeight) / 1000000;
        return acc + (m.sheets * sArea);
    }, 0);

    const calculatedUsedArea = materialCosts.reduce((acc, m) => acc + m.area, 0);
    
    // Final metrics
    const totalArea = calculatedTotalArea || 1; // Prevent div by zero
    const usedArea = calculatedUsedArea;
    const wasteArea = Math.max(0, totalArea - usedArea);
    const efficiency = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Materiais</h2>
                        <p className="text-slate-400 text-sm">Materiais utilizados no projeto e cálculo de consumo</p>
                    </div>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={20}/></div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Custo Total de Materiais</span>
                        <span className="text-lg font-black text-slate-800">R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Percent size={20}/></div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">% Participação no Custo Total</span>
                        <span className="text-lg font-black text-slate-800">{laborPercentOfTotal.toFixed(2)} %</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Package size={20}/></div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total de Chapas</span>
                        <span className="text-lg font-black text-slate-800">{sheetsCount} chapas</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Disc size={20} className="rotate-12"/></div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total de Fitas de Borda</span>
                        <span className="text-lg font-black text-slate-800">{totalEdgesM.toFixed(2)} m</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-slate-50 text-slate-500 rounded-xl"><ClipboardList size={20}/></div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total de Materiais Diversos</span>
                        <span className="text-lg font-black text-slate-800">R$ {totalHardwareCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: TABLE */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    
                    {/* FILTERS & ACTION */}
                    <div className="flex items-center justify-between">
                         <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                            {[
                                { id: 'todos', label: 'Todos os Materiais' },
                                { id: 'chapas', label: 'Chapas' },
                                { id: 'fitas', label: 'Fitas de Borda' },
                                { id: 'diversos', label: 'Acessórios / Diversos' }
                            ].map(filter => (
                                <button 
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id as any)}
                                    className={`px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all ${activeFilter === filter.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                         </div>
                         <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-600 bg-white hover:bg-slate-50 transition-all">
                            <Edit3 size={14} /> Editar Materiais
                         </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-[10px]">
                            <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-100 italic">
                                <tr>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Código</th>
                                    <th className="px-4 py-3">Descrição do Material</th>
                                    <th className="px-4 py-3 text-center">Unid.</th>
                                    <th className="px-4 py-3 text-right">Metragem</th>
                                    <th className="px-4 py-3 text-right">Quantidade</th>
                                    <th className="px-4 py-3 text-right">Custo Unit. (R$)</th>
                                    <th className="px-4 py-3 text-right">Custo Total (R$)</th>
                                    <th className="px-4 py-3 text-right">% Total</th>
                                    <th className="px-4 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {/* CHAPTER: CHAPAS */}
                                {showChapas && (
                                    <>
                                        <tr className="bg-blue-50/20">
                                            <td colSpan={10} className="px-4 py-2 font-black text-blue-600 uppercase italic tracking-widest">1. Chapas (MDF / MDP)</td>
                                        </tr>
                                        {filteredMaterials.map((mat, i) => (
                                            <tr key={`mat-${i}`} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2 text-slate-400"></td>
                                                <td className="px-4 py-2 text-slate-500">CHP-{i+1}</td>
                                                <td className="px-4 py-2 font-medium text-slate-700">{mat.materialName} {mat.thickness}mm</td>
                                                <td className="px-4 py-2 text-center text-slate-400">m²</td>
                                                <td className="px-4 py-2 text-right font-bold text-slate-700">{mat.area.toFixed(2)} m²</td>
                                                <td className="px-4 py-2 text-right font-bold text-slate-700">{mat.sheets.toFixed(2)} un</td>
                                                <td className="px-4 py-2 text-right text-slate-500">{mat.unitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-2 text-right font-black text-slate-800">R$ {mat.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-2 text-right text-slate-400">{(mat.totalCost / grandTotal * 100).toFixed(2)}%</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => startEditing({ type: 'chapa', ...mat })} className="p-1 hover:bg-slate-100 rounded text-blue-600 transition-colors">
                                                        <Edit3 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-50/50 text-[11px]">
                                            <td colSpan={7} className="px-4 py-2 font-black text-blue-600 uppercase">Total Chapas</td>
                                            <td className="px-4 py-2 text-right font-black text-blue-600 text-sm">R$ {totalMaterialCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-2 text-right font-black text-blue-600 opacity-60">{(totalMaterialCost / grandTotal * 100).toFixed(2)}%</td>
                                            <td></td>
                                        </tr>
                                    </>
                                )}

                                {/* CHAPTER: FITAS */}
                                {showFitas && (
                                    <>
                                        <tr className="bg-orange-50/20">
                                            <td colSpan={10} className="px-4 py-2 font-black text-orange-600 uppercase italic tracking-widest">2. Fitas de Borda</td>
                                        </tr>
                                        {filteredEdges.map((edge, i) => (
                                            <tr key={`edge-${i}`} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2 text-slate-400"></td>
                                                <td className="px-4 py-2 text-slate-500">FB-{i+1}</td>
                                                <td className="px-4 py-2 font-medium text-slate-700">{edge.name}</td>
                                                <td className="px-4 py-2 text-center text-slate-400">m</td>
                                                <td className="px-4 py-2 text-right font-bold text-slate-700">{edge.length.toFixed(2)} m</td>
                                                <td className="px-4 py-2 text-right font-bold text-slate-700">{Math.ceil(edge.length / 20)} rl</td>
                                                <td className="px-4 py-2 text-right text-slate-500">{edge.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-2 text-right font-black text-slate-800">R$ {edge.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-2 text-right text-slate-400">{(edge.total / grandTotal * 100).toFixed(2)}%</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => startEditing({ type: 'fita', ...edge })} className="p-1 hover:bg-slate-100 rounded text-blue-600 transition-colors">
                                                        <Edit3 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-50/50 text-[11px]">
                                            <td colSpan={7} className="px-4 py-2 font-black text-orange-600 uppercase">Total Fitas de Borda</td>
                                            <td className="px-4 py-2 text-right font-black text-orange-600 text-sm">R$ {totalEdgeCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-2 text-right font-black text-orange-600 opacity-60">{(totalEdgeCost / grandTotal * 100).toFixed(2)}%</td>
                                            <td></td>
                                        </tr>
                                    </>
                                )}

                                {/* CHAPTER: DIVERSOS */}
                                {showDiversos && (
                                    <>
                                        <tr className="bg-purple-50/20">
                                            <td colSpan={10} className="px-4 py-2 font-black text-purple-600 uppercase italic tracking-widest">3. Acessórios / Diversos</td>
                                        </tr>
                                        {filteredHardware.map((hw, i) => (
                                            <tr key={`hw-${i}`} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-2 text-slate-400"></td>
                                                <td className="px-4 py-2 text-slate-500">DIV-{i+1}</td>
                                                <td className="px-4 py-2 font-medium text-slate-700">{hw.name}</td>
                                                <td className="px-4 py-2 text-center text-slate-400">un</td>
                                                <td className="px-4 py-2 text-right font-bold text-slate-700">{hw.quantity} un</td>
                                                <td className="px-4 py-2 text-right font-bold text-slate-700">{hw.quantity} un</td>
                                                <td className="px-4 py-2 text-right text-slate-500">{hw.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-2 text-right font-black text-slate-800">R$ {hw.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-4 py-2 text-right text-slate-400">{(hw.total / grandTotal * 100).toFixed(2)}%</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => startEditing({ type: 'ferragem', ...hw })} className="p-1 hover:bg-slate-100 rounded text-blue-600 transition-colors">
                                                        <Edit3 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-slate-50/50 text-[11px]">
                                            <td colSpan={7} className="px-4 py-2 font-black text-purple-600 uppercase">Total Acessórios / Diversos</td>
                                            <td className="px-4 py-2 text-right font-black text-purple-600 text-sm">R$ {totalHardwareCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-2 text-right font-black text-purple-600 opacity-60">{(totalHardwareCost / grandTotal * 100).toFixed(2)}%</td>
                                            <td></td>
                                        </tr>
                                    </>
                                )}

                                <tr className="bg-blue-600 text-white">
                                    <td colSpan={7} className="px-4 py-4 font-black uppercase text-xs">Total Geral de Materiais</td>
                                    <td className="px-4 py-4 text-right font-black text-xl">R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-4 py-4 text-right font-black text-sm opacity-60">100%</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="flex bg-blue-50 border border-blue-100 rounded-xl p-4 gap-4 items-center">
                        <Info size={20} className="text-blue-500 shrink-0"/>
                        <p className="text-[10px] text-blue-700 font-medium leading-relaxed italic">
                            Os consumos foram calculados com base no plano de corte, projetos e parâmetros de produção. 
                            Última atualização: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                {/* RIGHT COLUMN: SIDEBAR */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* CHART: DISTRIBUICAO */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                         <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-4">Distribuição do Custo de Materiais</h3>
                         <div className="h-48 relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Custo']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                             </ResponsiveContainer>
                             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-1 shadow-inner rounded-full mx-auto w-32 h-32 mt-8">
                                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Total</span>
                                <span className="text-xs font-black text-slate-800">R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span>
                             </div>
                         </div>
                         <div className="space-y-2 mt-4">
                            {chartData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-slate-500 font-bold">{item.name}</span>
                                    </div>
                                    <span className="text-slate-700 font-black">{(item.value / grandTotal * 100).toFixed(1)}% (R$ {item.value.toFixed(0)})</span>
                                </div>
                            ))}
                         </div>
                    </div>

                    {/* CONSUMO FITA DE BORDA */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Consumo de Fita de Borda</h3>
                             <Disc size={20} className="text-slate-300 italic rotate-12" />
                        </div>
                        <div className="mb-4">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total de metros lineares</span>
                            <span className="text-2xl font-black text-blue-600">{totalEdgesM.toFixed(2)} m</span>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-slate-50 italic">
                             {edgeBandCosts.map((edge, i) => (
                                 <div key={i} className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500">{edge.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-700">{edge.length.toFixed(2)} m</span>
                                        <span className="text-slate-400 text-[8px]">({(edge.length / totalEdgesM * 100).toFixed(1)}%)</span>
                                    </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* APROVEITAMENTO DE CHAPAS */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md group relative overflow-hidden">
                        {/* Technical Background Accent */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                            <Gauge size={120} className="-rotate-12" />
                        </div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Aproveitamento de Chapas</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider italic">Cálculo de Precisão Ativo</span>
                                </div>
                            </div>
                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-colors">
                                <Layers size={18} />
                            </div>
                        </div>

                        <div className="mb-6 relative z-10">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 italic">Rendimento Médio Global</span>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black text-slate-800 tracking-tighter">
                                    {efficiency.toFixed(1)}
                                    <span className="text-xl text-emerald-500 ml-1">%</span>
                                </span>
                                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black mb-1 ${efficiency > 75 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {efficiency > 75 ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                                    {efficiency > 75 ? 'ALTO' : 'OTIMIZAR'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100 relative z-10">
                            <div className="flex justify-between items-center group/row">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-slate-200 rounded-full group-hover/row:bg-blue-400 transition-colors"></div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight italic">Área Total</span>
                                </div>
                                <span className="text-[11px] font-mono font-black text-slate-700">{totalArea.toFixed(2)} m²</span>
                            </div>
                            <div className="flex justify-between items-center group/row">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-emerald-200 rounded-full group-hover/row:bg-emerald-400 transition-colors"></div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight italic">Área Aproveitada</span>
                                </div>
                                <span className="text-[11px] font-mono font-black text-emerald-600">{usedArea.toFixed(2)} m²</span>
                            </div>
                            <div className="flex justify-between items-center group/row">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-orange-200 rounded-full group-hover/row:bg-orange-400 transition-colors"></div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight italic">Área de Sobra</span>
                                </div>
                                <span className="text-[11px] font-mono font-black text-orange-600">{wasteArea.toFixed(2)} m²</span>
                            </div>
                        </div>
                        
                        <div className="mt-6 relative">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out relative" 
                                    style={{ width: `${Math.min(100, efficiency)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                                </div>
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">0% Consumo</span>
                                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">100% Eficiência</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
            
            {/* MODAL EDITAR MATERIAL */}
            {editingItem && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 p-6 text-white text-left">
                            <div className="flex justify-between items-center mb-1">
                                <h2 className="text-lg font-black uppercase tracking-tight">Editar Valor</h2>
                                <button onClick={() => setEditingItem(null)} className="text-white/70 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest leading-none truncate">{editingItem.materialName || editingItem.name}</p>
                        </div>
                        
                        <div className="p-6 space-y-6 text-left">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                                    {editingItem.type === 'chapa' ? 'Novo Valor por m² (R$)' : 'Novo Valor Unitário (R$)'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        autoFocus
                                        onFocus={(e) => e.target.select()}
                                        value={editValue}
                                        onChange={e => setEditValue(Number(e.target.value))}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium px-1 leading-relaxed">
                                    {editingItem.type === 'chapa' 
                                        ? 'A alteração afetará o custo de todas as chapas deste tipo no orçamento.'
                                        : 'A alteração afetará o custo unitário deste item no orçamento.'}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex gap-3 border-t border-slate-100">
                            <button 
                                onClick={() => setEditingItem(null)} 
                                className="flex-1 py-3 bg-white border border-slate-200 rounded-xl font-black text-xs text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveEdit}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
