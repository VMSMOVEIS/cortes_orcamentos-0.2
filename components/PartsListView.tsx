
import React, { useState, useMemo } from 'react';
import { 
    FileSpreadsheet, Monitor, Package, Wrench, Users, DollarSign,
    Box, Layers, Ruler, Activity, Info, BarChart3, TrendingUp,
    Layout, Filter, Search, Edit3, ChevronRight, Hash,
    ArrowUpRight, ArrowDownRight, Printer, Save, Trash2, Calendar,
    PieChart as PieChartIcon, Sigma, RotateCw, Wind
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ProcessedPart, OptimizationConfig, ExtractedComponent } from '../types';

interface PartsListViewProps {
    parts: ProcessedPart[];
    globalConfig: OptimizationConfig;
    materialCosts: any[];
    hardwareCosts: any[];
    totalHardwareCost: number;
    totalPartsCount: number;
    subtotal: number;
    onUpdateParts: (parts: ProcessedPart[]) => void;
    onUpdateHardware: (hardware: ExtractedComponent[]) => void;
    extractedHardware: ExtractedComponent[];
}

export const PartsListView: React.FC<PartsListViewProps> = ({ 
    parts, 
    globalConfig,
    materialCosts,
    hardwareCosts,
    totalHardwareCost,
    totalPartsCount,
    subtotal,
    onUpdateParts,
    onUpdateHardware,
    extractedHardware
}) => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [materialFilter, setMaterialFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const materialsInProject = useMemo(() => {
        const mats = new Set(parts.map(p => p.materialName));
        return Array.from(mats).sort();
    }, [parts]);

    // Categorization logic
    const categorizePart = (part: ProcessedPart) => {
        const name = part.finalName.toLowerCase();
        const cat = (part.groupCategory || '').toLowerCase();
        const combined = `${name} ${cat}`;

        if (combined.includes('gaveta') || combined.includes('gav.' ) || combined === 'gav') return 'gavetas';
        if (combined.includes('prateleira') || combined.includes('prat.') || combined === 'prat') return 'prateleiras';
        if (combined.includes('porta') || combined.includes('basculante')) return 'portas';
        if (
            combined.includes('divisoria') || combined.includes('div.') || combined === 'div' ||
            combined.includes('base') || combined.includes('topo') || 
            combined.includes('lateral') || combined.includes('laterais') || combined === 'lat' || combined.includes('lat.') ||
            combined.includes('saia') || combined.includes('vista')
        ) return 'estruturais';
        if (combined.includes('fundo') || combined.includes('tras')) return 'fundos';
        return 'diversos';
    };

    // Processed parts with category and cost
    const processedParts = useMemo(() => {
        return parts.map(p => {
            const category = categorizePart(p);
            const area = (p.dimensions.width * p.dimensions.height * p.quantity) / 1000000;
            
            // Basic cost estimation per part area
            const materialId = p.materialName;
            const matCostObj = materialCosts.find(m => m.materialName === materialId);
            const m2Price = matCostObj ? matCostObj.unitCost : 250; // Fallback price
            const totalCost = area * m2Price;

            return {
                ...p,
                category,
                area,
                totalCost,
                m2Price
            };
        });
    }, [parts, materialCosts]);

    // Derived Statistics
    const stats = useMemo(() => {
        const totalPieces = processedParts.reduce((acc, p) => acc + p.quantity, 0);
        const uniqueModules = new Set(processedParts.map(p => p.groupCategory || 'Módulo Único')).size;
        const totalArea = processedParts.reduce((acc, p) => acc + p.area, 0);
        const avgPiecesPerModule = uniqueModules > 0 ? totalPieces / uniqueModules : 0;
        const totalCost = processedParts.reduce((acc, p) => acc + p.totalCost, 0);
        const avgCostPerPiece = totalPieces > 0 ? totalCost / totalPieces : 0;

        return {
            totalPieces,
            uniqueModules,
            totalArea,
            avgPiecesPerModule,
            avgCostPerPiece,
            totalCost
        };
    }, [processedParts]);

    // Filtering
    const filteredParts = useMemo(() => {
        return processedParts.filter(p => {
            const matchesFilter = activeFilter === 'all' || p.category === activeFilter;
            const matchesMaterial = materialFilter === 'all' || p.materialName === materialFilter;
            const matchesSearch = p.finalName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                p.displayId.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesMaterial && matchesSearch;
        });
    }, [processedParts, activeFilter, materialFilter, searchTerm]);

    // Groups for Table
    const groupedParts = useMemo(() => {
        const groups: Record<string, typeof processedParts> = {};
        filteredParts.forEach(p => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });
        return groups;
    }, [filteredParts]);

    // Chart Data: Distribution by Type
    const distributionData = useMemo(() => {
        const counts: Record<string, number> = {};
        processedParts.forEach(p => {
            const label = p.category.charAt(0).toUpperCase() + p.category.slice(1);
            counts[label] = (counts[label] || 0) + p.quantity;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [processedParts]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8', '#ec4899'];

    // Chart Data: Area per Module
    const moduleAreaData = useMemo(() => {
        const areas: Record<string, number> = {};
        processedParts.forEach(p => {
            const mod = p.groupCategory || 'Módulo Único';
            areas[mod] = (areas[mod] || 0) + p.area;
        });
        return Object.entries(areas)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [processedParts]);

    // Top 5 Pieces by Area
    const topPieces = useMemo(() => {
        return [...processedParts]
            .sort((a, b) => b.area - a.area)
            .slice(0, 5);
    }, [processedParts]);

    const categories = [
        { id: 'all', label: 'Todas as Peças', icon: Layers },
        { id: 'estruturais', label: 'Estruturais', icon: Layout },
        { id: 'portas', label: 'Portas', icon: Package },
        { id: 'gavetas', label: 'Gavetas', icon: Box },
        { id: 'prateleiras', label: 'Prateleiras', icon: BarChart3 },
        { id: 'fundos', label: 'Fundos', icon: Layers },
        { id: 'diversos', label: 'Diversos', icon: Monitor }
    ];

    const handleToggleInvert = (partId: string) => {
        onUpdateParts(parts.map(p => {
            if (p.displayId === partId) {
                return { ...p, invertDimensions: !p.invertDimensions };
            }
            return p;
        }));
    };

    const handleToggleGrain = (partId: string) => {
        onUpdateParts(parts.map(p => {
            if (p.displayId === partId) {
                const hasGrain = !p.hasGrain;
                return { 
                    ...p, 
                    hasGrain, 
                    grainDirection: hasGrain ? '0' : 'N/A' 
                };
            }
            return p;
        }));
    };

    const handleMoveToHardware = (part: ProcessedPart) => {
        if (!confirm(`Deseja mover "${part.finalName}" para a lista de ferragens?`)) return;

        // 1. Remove from parts
        onUpdateParts(parts.filter(p => p.displayId !== part.displayId));

        // 2. Add to hardware
        onUpdateHardware([...extractedHardware, {
            id: `moved_${part.displayId}_${Date.now()}`,
            name: part.finalName,
            originalName: part.finalName,
            category: 'Peça Convertida',
            quantity: part.quantity,
            materialName: part.materialName,
            sourceFile: part.sourceFile,
            dimensions: `${part.dimensions.height}x${part.dimensions.width}x${part.dimensions.thickness}`
        }]);
    };

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shadow-inner">
                        <FileSpreadsheet size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Extração de Itens</h2>
                        <p className="text-slate-400 text-sm">Lista de todas as peças e ferragens extraídas do projeto</p>
                    </div>
                </div>
            </div>

            {/* DASHBOARD STATS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Box size={16}/></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Total de Peças</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-800">{stats.totalPieces} peças</span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <ArrowUpRight size={10} className="text-emerald-500" />
                            <span className="text-[9px] font-bold text-emerald-500 uppercase">Eficiência 94%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Monitor size={16}/></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Total de Módulos</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-800">{stats.uniqueModules} módulos</span>
                        <span className="text-[9px] font-medium text-slate-400 mt-0.5 italic">Grupamento automático</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Ruler size={16}/></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Área Total das Peças</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-800">{stats.totalArea.toFixed(2)} m²</span>
                        <span className="text-[9px] font-medium text-slate-400 mt-0.5 italic">Soma técnica</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={16}/></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Média de Peças por Módulo</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-800">{stats.avgPiecesPerModule.toFixed(1)}</span>
                        <span className="text-[9px] font-medium text-slate-400 mt-0.5 italic">Densidade técnica</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={16}/></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Custo Médio por Peça</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-800">R$ {stats.avgCostPerPiece.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[9px] font-medium text-slate-400 mt-0.5 italic">Base: {stats.totalPieces} un</span>
                    </div>
                </div>
            </div>

            {/* FILTERS & SEARCH */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex gap-1 overflow-x-auto no-scrollbar p-1">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveFilter(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap ${
                                activeFilter === cat.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <cat.icon size={14} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-1.5 ml-2 shadow-inner">
                    <Filter size={12} className="text-slate-400" />
                    <select 
                        value={materialFilter}
                        onChange={(e) => setMaterialFilter(e.target.value)}
                        className="text-[10px] font-black uppercase tracking-tight text-slate-600 outline-none bg-transparent cursor-pointer"
                    >
                        <option value="all">Filtrar Material</option>
                        {materialsInProject.map(mat => (
                            <option key={mat} value={mat}>{mat}</option>
                        ))}
                    </select>
                </div>

                <div className="relative flex-1 max-w-sm mr-2 ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar peça ou código..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-medium focus:bg-white focus:border-blue-300 outline-none transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-tight text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all mr-2">
                    <Edit3 size={14} /> Editar Peças
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                {/* TABLE AREA */}
                <div className="lg:col-span-12 space-y-6">
                    {activeFilter === 'all' ? (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-3 flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-widest italic flex items-center gap-2">
                                    <Layers size={12}/> TODAS AS PEÇAS EXTRAÍDAS
                                </h3>
                                <span className="text-[10px] font-bold text-slate-400">{filteredParts.length} itens</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                            <thead className="bg-white text-[9px] text-slate-400 uppercase font-black italic border-b border-slate-50">
                                        <tr>
                                            <th className="px-6 py-3">Tipo</th>
                                            <th className="px-6 py-3">Código</th>
                                            <th className="px-6 py-3">Descrição da Peça</th>
                                            <th className="px-6 py-3">Categoria</th>
                                            <th className="px-6 py-3">Módulo</th>
                                            <th className="px-6 py-3">Material</th>
                                            <th className="px-6 py-3">Dimensões (mm)</th>
                                            <th className="px-6 py-3 text-center">Inverter</th>
                                            <th className="px-6 py-3 text-center">Veio</th>
                                            <th className="px-6 py-3 text-center">Qtde</th>
                                            <th className="px-6 py-3 text-right">Área (m²)</th>
                                            <th className="px-6 py-3 text-right">Custo Total (R$)</th>
                                            <th className="px-6 py-3 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredParts.map((part, idx) => {
                                            const w = part.invertDimensions ? part.dimensions.height : part.dimensions.width;
                                            const h = part.invertDimensions ? part.dimensions.width : part.dimensions.height;
                                            
                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-3">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                    </td>
                                                    <td className="px-6 py-3 font-mono text-[9px] text-slate-500 font-bold">{part.displayId}</td>
                                                    <td className="px-6 py-3">
                                                        <span className="text-[10px] font-black text-slate-700 group-hover:text-blue-600 transition-colors">{part.finalName}</span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase italic">{part.category}</span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="text-[9px] text-slate-400 italic">{part.groupCategory || 'Módulo 01'}</span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className="text-[9px] font-bold text-slate-500">{part.materialName}</span>
                                                    </td>
                                                    <td className="px-6 py-3 font-mono text-[9px] text-slate-500">
                                                        <span className={part.invertDimensions ? "text-blue-600 font-bold" : ""}>
                                                            {w.toFixed(0)} x {h.toFixed(0)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <button 
                                                            onClick={() => handleToggleInvert(part.displayId)}
                                                            className={`p-1.5 rounded-lg transition-all ${part.invertDimensions ? 'bg-blue-100 text-blue-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                                                            title="Inverter Comprimento x Largura"
                                                        >
                                                            <RotateCw size={14} />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <button 
                                                            onClick={() => handleToggleGrain(part.displayId)}
                                                            className={`p-1.5 rounded-lg transition-all ${part.hasGrain ? 'bg-orange-100 text-orange-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                                                            title="Respeitar Veio (Sentido do Comprimento)"
                                                        >
                                                            <Wind size={14} />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-3 text-center font-black text-slate-700 text-[10px]">{part.quantity}</td>
                                                    <td className="px-6 py-3 text-right font-mono text-[10px] text-slate-500">{part.area.toFixed(2)}</td>
                                                    <td className="px-6 py-3 text-right font-black text-slate-800 text-[10px]">
                                                        R$ {part.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <button 
                                                            onClick={() => handleMoveToHardware(part)}
                                                            className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-all group/btn relative"
                                                            title="Mover para Extração de Ferragens"
                                                        >
                                                            <Wrench size={14} />
                                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[8px] rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                                Mover p/ Ferragem
                                                            </span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-50/30 border-t border-slate-100">
                                        <tr className="text-[10px] font-black">
                                            <td colSpan={9} className="px-6 py-3 text-blue-700 uppercase italic">Total Geral</td>
                                            <td className="px-6 py-3 text-center text-blue-800">
                                                {filteredParts.reduce((acc, i) => acc + i.quantity, 0)}
                                            </td>
                                            <td className="px-6 py-3 text-right text-blue-800">
                                                {filteredParts.reduce((acc, i) => acc + i.area, 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-3 text-right text-blue-900 bg-blue-50/50">
                                                R$ {filteredParts.reduce((acc, i) => acc + i.totalCost, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-3 bg-blue-50/50"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    ) : (
                        Object.entries(groupedParts).map(([category, items]) => (
                            <div key={category} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-3 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-widest italic flex items-center gap-2">
                                        <Hash size={12}/> {category.toUpperCase()}
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400">{items.length} itens</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-white text-[9px] text-slate-400 uppercase font-black italic border-b border-slate-50">
                                            <tr>
                                                <th className="px-6 py-3">Tipo</th>
                                                <th className="px-6 py-3">Código</th>
                                                <th className="px-6 py-3">Descrição da Peça</th>
                                                <th className="px-6 py-3">Módulo</th>
                                                <th className="px-6 py-3">Material</th>
                                                <th className="px-6 py-3">Dimensões (mm)</th>
                                                <th className="px-6 py-3 text-center">Inverter</th>
                                                <th className="px-6 py-3 text-center">Veio</th>
                                                <th className="px-6 py-3">Esp.</th>
                                                <th className="px-6 py-3 text-center">Qtde</th>
                                                <th className="px-6 py-3 text-right">Área (m²)</th>
                                                <th className="px-6 py-3 text-right">Custo Total (R$)</th>
                                                <th className="px-6 py-3 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {items.map((part, idx) => {
                                                const w = part.invertDimensions ? part.dimensions.height : part.dimensions.width;
                                                const h = part.invertDimensions ? part.dimensions.width : part.dimensions.height;
                                                
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-6 py-3">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                        </td>
                                                        <td className="px-6 py-3 font-mono text-[9px] text-slate-500 font-bold">{part.displayId}</td>
                                                        <td className="px-6 py-3">
                                                            <span className="text-[10px] font-black text-slate-700 group-hover:text-blue-600 transition-colors">{part.finalName}</span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <span className="text-[9px] text-slate-400 italic">{part.groupCategory || 'Módulo 01'}</span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <span className="text-[9px] font-bold text-slate-500">{part.materialName}</span>
                                                        </td>
                                                        <td className="px-6 py-3 font-mono text-[9px] text-slate-500">
                                                            <span className={part.invertDimensions ? "text-blue-600 font-bold" : ""}>
                                                                {w.toFixed(0)} x {h.toFixed(0)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <button 
                                                                onClick={() => handleToggleInvert(part.displayId)}
                                                                className={`p-1.5 rounded-lg transition-all ${part.invertDimensions ? 'bg-blue-100 text-blue-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                                                                title="Inverter Comprimento x Largura"
                                                            >
                                                                <RotateCw size={14} />
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <button 
                                                                onClick={() => handleToggleGrain(part.displayId)}
                                                                className={`p-1.5 rounded-lg transition-all ${part.hasGrain ? 'bg-orange-100 text-orange-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                                                                title="Respeitar Veio (Sentido do Comprimento)"
                                                            >
                                                                <Wind size={14} />
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-3 text-[9px] font-bold text-slate-400">{part.dimensions.thickness}</td>
                                                        <td className="px-6 py-3 text-center font-black text-slate-700 text-[10px]">{part.quantity}</td>
                                                        <td className="px-6 py-3 text-right font-mono text-[10px] text-slate-500">{part.area.toFixed(2)}</td>
                                                        <td className="px-6 py-3 text-right font-black text-slate-800 text-[10px]">
                                                            R$ {part.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <button 
                                                                onClick={() => handleMoveToHardware(part)}
                                                                className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-all group/btn relative"
                                                                title="Mover para Extração de Ferragens"
                                                            >
                                                                <Wrench size={14} />
                                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[8px] rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                                    Mover p/ Ferragem
                                                                </span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-slate-50/30 border-t border-slate-100">
                                            <tr className="text-[10px] font-black">
                                                <td colSpan={8} className="px-6 py-3 text-blue-700 uppercase italic">Total de {category}</td>
                                                <td className="px-6 py-3 text-[9px] font-bold text-slate-400"></td>
                                                <td className="px-6 py-3 text-center text-blue-800">
                                                    {items.reduce((acc, i) => acc + i.quantity, 0)}
                                                </td>
                                                <td className="px-6 py-3 text-right text-blue-800">
                                                    {items.reduce((acc, i) => acc + i.area, 0).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-3 text-right text-blue-900 bg-blue-50/50">
                                                    R$ {items.reduce((acc, i) => acc + i.totalCost, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-3 bg-blue-50/50"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )
                    ))}

                    </div>

                    {/* HARDWARE EXTRACTION SECTION */}
                    <div className="space-y-6 pt-10 border-t border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-inner">
                                <Wrench size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Extração de Ferragens</h2>
                                <p className="text-slate-400 text-sm">Lista de todas as ferragens e componentes extraídos do projeto</p>
                            </div>
                        </div>

                        {/* HARDWARE STATS */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package size={16}/></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Total de Itens</span>
                                </div>
                                <span className="text-xl font-black text-slate-800">{hardwareCosts.length} itens</span>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Activity size={16}/></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Qtde Total</span>
                                </div>
                                <span className="text-xl font-black text-slate-800">{hardwareCosts.reduce((acc: number, hw: any) => acc + hw.quantity, 0)} un</span>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><DollarSign size={16}/></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Custo Total Ferragens</span>
                                </div>
                                <span className="text-xl font-black text-slate-800">R$ {totalHardwareCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={16}/></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">% no Custo Total</span>
                                </div>
                                <span className="text-xl font-black text-slate-800">{subtotal > 0 ? ((totalHardwareCost / subtotal) * 100).toFixed(1) : 0}%</span>
                            </div>
                        </div>

                        {/* HARDWARE TABLE */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-3">
                                <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest italic flex items-center gap-2">
                                    <Wrench size={12}/> LISTA DE FERRAGENS
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white text-[9px] text-slate-400 uppercase font-black italic border-b border-slate-50">
                                        <tr>
                                            <th className="px-6 py-3">Código</th>
                                            <th className="px-6 py-3">Descrição da Ferragem</th>
                                            <th className="px-6 py-3">Origem</th>
                                            <th className="px-6 py-3 text-center">Unid.</th>
                                            <th className="px-6 py-3 text-right">Qtde</th>
                                            <th className="px-6 py-3 text-right">Custo Unit. (R$)</th>
                                            <th className="px-6 py-3 text-right">Custo Total (R$)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {hardwareCosts.map((hw: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-3 font-mono text-[9px] text-slate-500 font-bold">{hw.isManual ? 'MAN-HW' : 'HW'}-{idx + 1}</td>
                                                <td className="px-6 py-3">
                                                    <span className="text-[10px] font-black text-slate-700">{hw.name}</span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase italic">
                                                        {hw.isManual ? 'Manual' : 'Extraído'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-center text-slate-400 text-[10px]">un</td>
                                                <td className="px-6 py-3 text-right font-black text-slate-700 text-[10px]">{hw.quantity}</td>
                                                <td className="px-6 py-3 text-right font-mono text-[10px] text-slate-500">
                                                    R$ {hw.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-3 text-right font-black text-slate-800 text-[10px]">
                                                    R$ {hw.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-emerald-50/30 border-t border-emerald-100">
                                        <tr className="text-[10px] font-black">
                                            <td colSpan={4} className="px-6 py-4 text-emerald-700 uppercase italic">Subtotal Ferragens</td>
                                            <td className="px-6 py-4 text-right text-emerald-800 text-lg">
                                                {hardwareCosts.reduce((acc: number, i: any) => acc + i.quantity, 0)}
                                            </td>
                                            <td colSpan={2} className="px-6 py-4 text-right text-emerald-900 bg-emerald-100/50 text-xl font-black">
                                                R$ {totalHardwareCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* HARDWARE ANALYTICS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                            {/* CHART: DISTRIBUICAO */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-6 italic flex items-center gap-2">
                                    <PieChartIcon size={12} className="text-blue-500" /> Distribuição por Valor (R$)
                                </h3>
                                <div className="h-64 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Corrediças', value: hardwareCosts.filter(h => h.name.toLowerCase().includes('corrediça')).reduce((acc, h) => acc + h.total, 0), color: '#2563eb' },
                                                    { name: 'Dobradiças', value: hardwareCosts.filter(h => h.name.toLowerCase().includes('dobradiça')).reduce((acc, h) => acc + h.total, 0), color: '#3b82f6' },
                                                    { name: 'Fixadores', value: hardwareCosts.filter(h => h.name.toLowerCase().match(/parafuso|cavilha|minifix/)).reduce((acc, h) => acc + h.total, 0), color: '#6366f1' },
                                                    { name: 'Puxadores', value: hardwareCosts.filter(h => h.name.toLowerCase().includes('puxador')).reduce((acc, h) => acc + h.total, 0), color: '#10b981' },
                                                    { name: 'Diversos', value: hardwareCosts.filter(h => !h.name.toLowerCase().match(/corrediça|dobradiça|parafuso|cavilha|minifix|puxador/)).reduce((acc, h) => acc + h.total, 0), color: '#94a3b8' }
                                                ].filter(d => d.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {[
                                                    { color: '#2563eb' }, { color: '#3b82f6' }, { color: '#6366f1' }, { color: '#10b981' }, { color: '#94a3b8' }
                                                ].map((entry, index) => (
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
                                        <span className="text-[10px] font-black text-slate-400 uppercase italic">Total</span>
                                        <span className="text-sm font-black text-slate-800">R$ {totalHardwareCost.toFixed(0)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* TOP 5 HARDWARE */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-6 italic flex items-center gap-2">
                                    <TrendingUp size={12} className="text-emerald-500" /> Top 5 Componentes (Custo)
                                </h3>
                                <div className="space-y-4">
                                    {[...hardwareCosts]
                                        .sort((a, b) => b.total - a.total)
                                        .slice(0, 5)
                                        .map((hw, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] font-black">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[10px] font-black text-slate-700 truncate w-32 uppercase">{hw.name}</div>
                                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{hw.quantity} UNIDADES</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-slate-800">R$ {hw.total.toFixed(2)}</div>
                                                    <div className="text-[8px] font-bold text-emerald-500">{(hw.total / totalHardwareCost * 100).toFixed(1)}%</div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-blue-100 border border-slate-800">
                        <div className="flex items-center gap-6 mb-6 md:mb-0">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900 border border-blue-400">
                                <Sigma size={32} />
                            </div>
                            <div>
                                <h4 className="text-white font-black text-lg uppercase tracking-widest italic">Consolidação do Projeto</h4>
                                <p className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.2em]">Resumo executivo de custos e volumes</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-white">
                            <div className="text-center">
                                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">Total Itens</span>
                                <span className="text-2xl font-black">{totalPartsCount + hardwareCosts.reduce((acc: number, h: any) => acc + h.quantity, 0)}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">Área Industrial</span>
                                <span className="text-2xl font-black">{stats.totalArea.toFixed(2)} m²</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">Ferragens</span>
                                <span className="text-2xl font-black">R$ {totalHardwareCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">Subtotal Geral</span>
                                <span className="text-2xl font-black">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="text-center bg-blue-600 px-8 py-4 rounded-2xl shadow-xl shadow-blue-900 border border-blue-500 transform hover:scale-105 transition-transform">
                                <span className="block text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] mb-2 italic text-center">Valor Sugerido</span>
                                <span className="text-3xl font-black">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* INFO FOOTER */}
                <div className="flex bg-blue-50 border border-blue-100 rounded-2xl p-4 gap-4 items-center">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 shrink-0">
                        <Info size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] text-blue-700 font-black uppercase tracking-tight italic">Informação sobre a extração</p>
                            <span className="text-[9px] text-blue-400 font-bold">Última atualização: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                            As quantidades e áreas foram calculadas com base nas dimensões informadas. Cada item está vinculado ao seu respectivo material e módulo para garantir o correto fluxo de produção.
                        </p>
                    </div>
                </div>
            </div>
    );
};
