
import React, { useState, useMemo } from 'react';
import { 
    Wrench, Package, TrendingUp, Info, Search, Edit3, 
    ChevronDown, Award, Percent, Ruler, ClipboardList, 
    Settings, FileSpreadsheet, Zap, Boxes, Hammer, 
    Activity, Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface HardwareItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    productionTime: number;
    found: boolean;
    isManual: boolean;
}

interface HardwareViewProps {
    hardwareCosts: HardwareItem[];
    totalHardwareCost: number;
    totalPartsCount: number;
    subtotal: number;
}

const CATEGORIES = [
    { id: 'todos', label: 'Todas as Ferragens' },
    { id: 'dobradicas', label: 'Dobradiças' },
    { id: 'corredicas', label: 'Corrediças' },
    { id: 'abertura', label: 'Sistemas de Abertura' },
    { id: 'fixadores', label: 'Fixadores' },
    { id: 'puxadores', label: 'Puxadores' },
    { id: 'diversos', label: 'Diversos' }
];

export const HardwareView: React.FC<HardwareViewProps> = ({ 
    hardwareCosts, 
    totalHardwareCost, 
    totalPartsCount,
    subtotal 
}) => {
    const [activeFilter, setActiveFilter] = useState('todos');

    // Categorization logic
    const categorizedHardware = useMemo(() => {
        const categories: Record<string, HardwareItem[]> = {
            'dobradicas': [],
            'corredicas': [],
            'abertura': [],
            'fixadores': [],
            'puxadores': [],
            'diversos': []
        };

        hardwareCosts.forEach(hw => {
            const name = hw.name.toLowerCase();
            if (name.includes('dobradiça') || name.includes('caneco')) {
                categories.dobradicas.push(hw);
            } else if (name.includes('corrediça') || name.includes('telesc')) {
                categories.corredicas.push(hw);
            } else if (name.includes('pistão') || name.includes('articulado') || name.includes('abertura')) {
                categories.abertura.push(hw);
            } else if (name.includes('parafuso') || name.includes('cavilha') || name.includes('fixador') || name.includes('minifix') || name.includes('tambor')) {
                categories.fixadores.push(hw);
            } else if (name.includes('puxador')) {
                categories.puxadores.push(hw);
            } else {
                categories.diversos.push(hw);
            }
        });

        return categories;
    }, [hardwareCosts]);

    const totalItems = hardwareCosts.length;
    const totalUnits = hardwareCosts.reduce((acc, hw) => acc + hw.quantity, 0);
    const avgCostPerPiece = totalPartsCount > 0 ? totalHardwareCost / totalPartsCount : 0;
    const hardwarePercentOfTotal = subtotal > 0 ? (totalHardwareCost / subtotal) * 100 : 0;
    const unitsPerHardware = totalItems > 0 ? totalUnits / totalItems : 0;

    // Chart Data
    const chartData = [
        { name: 'Corrediças', value: categorizedHardware.corredicas.reduce((acc, hw) => acc + hw.total, 0), color: '#2563eb' },
        { name: 'Dobradiças', value: categorizedHardware.dobradicas.reduce((acc, hw) => acc + hw.total, 0), color: '#3b82f6' },
        { name: 'Sist. de Abertura', value: categorizedHardware.abertura.reduce((acc, hw) => acc + hw.total, 0), color: '#f59e0b' },
        { name: 'Puxadores', value: categorizedHardware.puxadores.reduce((acc, hw) => acc + hw.total, 0), color: '#10b981' },
        { name: 'Fixadores', value: categorizedHardware.fixadores.reduce((acc, hw) => acc + hw.total, 0), color: '#6366f1' },
        { name: 'Diversos', value: categorizedHardware.diversos.reduce((acc, hw) => acc + hw.total, 0), color: '#94a3b8' }
    ].filter(item => item.value > 0);

    // Top 5 Items
    const top5Items = [...hardwareCosts]
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    const renderCategoryRows = (catId: string, label: string, items: HardwareItem[], color: string, index: number) => {
        if (items.length === 0) return null;
        const catTotal = items.reduce((acc, hw) => acc + hw.total, 0);
        const catQty = items.reduce((acc, hw) => acc + hw.quantity, 0);

        return (
            <React.Fragment key={catId}>
                <tr className={`bg-${color}-50/20`}>
                    <td colSpan={8} className={`px-4 py-2 font-black text-${color}-600 uppercase italic tracking-widest`}>
                        {index}. {label}
                    </td>
                </tr>
                {items.map((hw, i) => (
                    <tr key={hw.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 text-slate-400"></td>
                        <td className="px-4 py-2 text-slate-500 font-mono text-[9px]">{hw.isManual ? 'MAN-HW' : 'HW'}-{i + 1}</td>
                        <td className="px-4 py-2 font-medium text-slate-700">{hw.name}</td>
                        <td className="px-4 py-2 text-slate-500">FGVTN</td>
                        <td className="px-4 py-2 text-center text-slate-400">un</td>
                        <td className="px-4 py-2 text-right font-bold text-slate-700">{hw.quantity}</td>
                        <td className="px-4 py-2 text-right text-slate-500">{hw.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-black text-slate-800">R$ {hw.total.toFixed(2)}</td>
                    </tr>
                ))}
                <tr className="bg-slate-50/50">
                    <td colSpan={5} className={`px-4 py-2 font-black text-${color}-600 uppercase text-[9px]`}>Total {label}</td>
                    <td className={`px-4 py-2 text-right font-black text-${color}-600`}>{catQty}</td>
                    <td className={`px-4 py-2 text-right font-black text-${color}-600 text-sm`}>R$ {catTotal.toFixed(2)}</td>
                    <td className={`px-4 py-2 text-right font-black text-${color}-600 opacity-60`}>{(catTotal / totalHardwareCost * 100).toFixed(2)}%</td>
                </tr>
            </React.Fragment>
        );
    };

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Wrench size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Ferragens</h2>
                        <p className="text-slate-400 text-sm">Relação de ferragens utilizadas no projeto e cálculo de consumo</p>
                    </div>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Package size={20}/></div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total de Itens</span>
                        <span className="text-lg font-black text-slate-800">{totalItems} itens</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Boxes size={20}/></div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Quantidade Total</span>
                        <span className="text-lg font-black text-slate-800">{totalUnits} un</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><TrendingUp size={20}/></div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Custo Total das Ferragens</span>
                        <span className="text-lg font-black text-slate-800">R$ {totalHardwareCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Activity size={20}/></div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Custo Médio por Peça (Móvel)</span>
                        <span className="text-lg font-black text-slate-800">R$ {avgCostPerPiece.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-slate-50 text-slate-500 rounded-xl"><Percent size={20}/></div>
                    <div>
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">% no Custo Total</span>
                        <span className="text-lg font-black text-slate-800">{hardwarePercentOfTotal.toFixed(2)} %</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: TABLE */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between">
                         <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto no-scrollbar">
                            {CATEGORIES.map(filter => (
                                <button 
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`px-4 py-2 rounded-md text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeFilter === filter.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                         </div>
                         <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-sm">
                            <Edit3 size={14} /> Editar Ferragens
                         </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-[10px]">
                            <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-100 italic">
                                <tr>
                                    <th className="px-4 py-3">Categoria</th>
                                    <th className="px-4 py-3">Código</th>
                                    <th className="px-4 py-3">Descrição da Ferragem</th>
                                    <th className="px-4 py-3">Marca</th>
                                    <th className="px-4 py-3 text-center">Unid.</th>
                                    <th className="px-4 py-3 text-right">Quantidade</th>
                                    <th className="px-4 py-3 text-right">Custo Unit. (R$)</th>
                                    <th className="px-4 py-3 text-right">Custo Total (R$)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {activeFilter === 'todos' || activeFilter === 'dobradicas' ? renderCategoryRows('dobradicas', 'Dobradiças', categorizedHardware.dobradicas, 'blue', 1) : null}
                                {activeFilter === 'todos' || activeFilter === 'corredicas' ? renderCategoryRows('corredicas', 'Corrediças', categorizedHardware.corredicas, 'emerald', 2) : null}
                                {activeFilter === 'todos' || activeFilter === 'abertura' ? renderCategoryRows('abertura', 'Sistemas de Abertura', categorizedHardware.abertura, 'orange', 3) : null}
                                {activeFilter === 'todos' || activeFilter === 'fixadores' ? renderCategoryRows('fixadores', 'Fixadores', categorizedHardware.fixadores, 'purple', 4) : null}
                                {activeFilter === 'todos' || activeFilter === 'puxadores' ? renderCategoryRows('puxadores', 'Puxadores', categorizedHardware.puxadores, 'emerald', 5) : null}
                                {activeFilter === 'todos' || activeFilter === 'diversos' ? renderCategoryRows('diversos', 'Diversos', categorizedHardware.diversos, 'slate', 6) : null}

                                <tr className="bg-blue-600 text-white">
                                    <td colSpan={5} className="px-4 py-4 font-black uppercase text-xs italic">Total Geral de Ferragens</td>
                                    <td className="px-4 py-4 text-right font-black text-lg">{totalUnits} un</td>
                                    <td className="px-4 py-4 text-right font-black text-xl">R$ {totalHardwareCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-4 py-4 text-right font-black text-sm opacity-60">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex bg-blue-50 border border-blue-100 rounded-xl p-4 gap-4 items-center">
                        <Info size={20} className="text-blue-500 shrink-0"/>
                        <p className="text-[10px] text-blue-700 font-medium leading-relaxed italic">
                            As quantidades foram calculadas com base nas peças do projeto e parâmetros de montagem padrão. 
                            Última atualização: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                {/* RIGHT COLUMN: DASHBOARD SIDEBAR */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* CHART: DISTRIBUICAO */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                         <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-4 italic">Distribuição do Custo por Categoria</h3>
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
                             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1 italic">Total</span>
                                <span className="text-xs font-black text-slate-800">R$ {totalHardwareCost.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span>
                             </div>
                         </div>
                         <div className="space-y-2 mt-4">
                            {chartData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-slate-500 font-bold">{item.name}</span>
                                    </div>
                                    <span className="text-slate-700 font-black">{(item.value / totalHardwareCost * 100).toFixed(1)}% (R$ {item.value.toFixed(0)})</span>
                                </div>
                            ))}
                         </div>
                    </div>

                    {/* TOP 5 HARDWARE */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-4 italic">Top 5 por Custo Total</h3>
                        <div className="space-y-3">
                            {top5Items.map((hw, i) => (
                                <div key={hw.id} className="flex items-center gap-3 text-[10px]">
                                    <span className="font-black text-blue-600 w-4">{i + 1}</span>
                                    <div className="flex-1">
                                        <span className="block font-bold text-slate-700 truncate w-32">{hw.name}</span>
                                        <span className="text-slate-400 text-[8px] uppercase">{hw.quantity} un</span>
                                    </div>
                                    <span className="font-black text-slate-800">R$ {hw.total.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* INDICES DE FERRAGENS */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Índices de Ferragens</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-blue-500 mb-2">
                                    <TrendingUp size={16} />
                                    <span className="text-lg font-black text-slate-800">{avgCostPerPiece.toFixed(2)}</span>
                                </div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase leading-tight block">Custo médio por peça (R$)</span>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-orange-500 mb-2">
                                    <Clock size={16} />
                                    <span className="text-lg font-black text-slate-800">{unitsPerHardware.toFixed(2)}</span>
                                </div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase leading-tight block">Peças por ferragem (média)</span>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-purple-500 mb-2">
                                    <Award size={16} />
                                    <span className="text-lg font-black text-slate-800">{hardwarePercentOfTotal.toFixed(1)}%</span>
                                </div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase leading-tight block">Participação no custo total</span>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-2 text-emerald-500 mb-2">
                                    <Boxes size={16} />
                                    <span className="text-lg font-black text-slate-800">{totalUnits}</span>
                                </div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase leading-tight block">Total unidades utilizadas</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
