
import React from 'react';
import { 
    Settings2, Clock, Package, Wrench, Disc, Info, 
    TrendingUp, Boxes, Ruler, LayoutGrid, ChevronDown, 
    Monitor, Users, Gauge, Scissors, Home
} from 'lucide-react';
import { ProcessedPart, OptimizationConfig } from '../types';

interface EngineeringViewProps {
    parts: ProcessedPart[];
    hardware: any[];
    edgeCosts: any[];
    globalConfig: OptimizationConfig;
    stats: { doors: number; drawers: number };
    complexityFactor: number;
    setComplexityFactor: (val: number) => void;
}

export const EngineeringView: React.FC<EngineeringViewProps> = ({ 
    parts, hardware, edgeCosts, globalConfig, stats, complexityFactor, setComplexityFactor 
}) => {
    // 1. MONTAGEM CALCULATIONS
    const totalPartsQty = parts.reduce((acc, p) => acc + p.quantity, 0);
    const totalHardwareQty = hardware.reduce((acc, h) => acc + h.quantity, 0);
    
    const assemblyTimePerPart = globalConfig.laborCostSettings?.assemblyTimePerPart || 15; // default 15 min if not set
    const peçasTime = totalPartsQty * assemblyTimePerPart;
    const ferragensTime = hardware.reduce((acc, h) => acc + h.productionTime, 0);
    const processosTime = 900; // Simulated constant for now or can be linked to something
    
    const totalMontagemMin = peçasTime + ferragensTime + processosTime;
    const totalMontagemHours = totalMontagemMin / 60;

    // 2. CORTE CALCULATIONS
    const setupCorte = 20; // min
    const numCortes = parts.reduce((acc, p) => acc + (p.quantity * 4), 0); // Simulated estimation
    const timePerCut = 18; // seconds
    const cortesTotalMin = (numCortes * timePerCut) / 60;
    
    // Estimate sheets from parts area (simple approximation)
    const totalArea = parts.reduce((acc, p) => acc + (p.dimensions.width * p.dimensions.height * p.quantity) / 1000000, 0);
    const sheetsEst = Math.ceil(totalArea / 4.5); // 4.5m2 approx sheet area
    const handlingTimePerSheet = 3; // min
    const handlingTotalMin = sheetsEst * handlingTimePerSheet;
    const empilhamentoTime = sheetsEst * 2; // 2 min per sheet
    
    const totalCorteMin = setupCorte + cortesTotalMin + handlingTotalMin + empilhamentoTime;
    const totalCorteHours = totalCorteMin / 60;

    // 3. BORDEAMENTO CALCULATIONS
    const setupBorda = 15; // min
    const totalLinearMeters = edgeCosts.reduce((acc, e) => acc + e.length, 0);
    const linearMeterSpeed = 0.55; // min/m
    const linearBordaMin = totalLinearMeters * linearMeterSpeed;
    
    const peçasComBorda = parts.filter(p => 
        p.edges.long1 !== 'none' || p.edges.long2 !== 'none' || 
        p.edges.short1 !== 'none' || p.edges.short2 !== 'none'
    ).reduce((acc, p) => acc + p.quantity, 0);
    const timePerPeçaBorda = 0.20; // min/peça
    const peçasBordaMin = peçasComBorda * timePerPeçaBorda;
    
    const limpezaTime = 10; // constant min
    
    const totalBordeamentoMin = setupBorda + linearBordaMin + peçasBordaMin + limpezaTime;
    const totalBordeamentoHours = totalBordeamentoMin / 60;

    // 4. SUMMARY PRODUCTION
    const totalProdTimeRaw = totalMontagemHours + totalCorteHours + totalBordeamentoHours;
    const totalProdTimeAdjusted = totalProdTimeRaw * complexityFactor;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* COMPLEXITY SELECTOR & HEADER */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Settings2 size={24}/>
                    </div>
                    <div>
                        <h2 className="font-black text-slate-800 uppercase tracking-tight">Engenharia de Produção</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Dimensionamento técnico do fluxo de trabalho</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Complexidade do Projeto:</span>
                        <select 
                            value={complexityFactor}
                            onChange={(e) => setComplexityFactor(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                        >
                            <option value={1.0}>BAIXA (1,00)</option>
                            <option value={1.2}>MÉDIO (1,20)</option>
                            <option value={1.5}>ALTA (1,50)</option>
                            <option value={2.0}>EXTREMA (2,00)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECTOR CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. SETOR DE MONTAGEM */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <Wrench size={14}/> 1. Setor de Montagem
                        </h3>
                    </div>
                    <div className="p-4 flex-1">
                        <table className="w-full text-[10px]">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-100">
                                    <th className="text-left py-1">Descrição</th>
                                    <th className="text-center py-1">Qtd</th>
                                    <th className="text-center py-1">Tempo Unit.</th>
                                    <th className="text-right py-1">Total (min)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <tr className="text-slate-600">
                                    <td className="py-2">Peças</td>
                                    <td className="text-center">{totalPartsQty}</td>
                                    <td className="text-center">-</td>
                                    <td className="text-right font-bold">{peçasTime.toFixed(0)}</td>
                                </tr>
                                <tr className="text-slate-600">
                                    <td className="py-2">Ferragens</td>
                                    <td className="text-center">{totalHardwareQty}</td>
                                    <td className="text-center">-</td>
                                    <td className="text-right font-bold">{ferragensTime.toFixed(0)}</td>
                                </tr>
                                <tr className="text-slate-600">
                                    <td className="py-2">Processos / Atividades</td>
                                    <td className="text-center">-</td>
                                    <td className="text-center">-</td>
                                    <td className="text-right font-bold">{processosTime.toFixed(0)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Total (min)</span>
                            <span className="font-black text-slate-800">{totalMontagemMin.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Total (horas)</span>
                            <span className="font-black text-slate-800">{totalMontagemHours.toFixed(2)} h</span>
                        </div>
                    </div>
                </div>

                {/* 2. SETOR DE CORTE */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                            <Scissors size={14}/> 2. Setor de Corte
                        </h3>
                    </div>
                    <div className="p-4 flex-1">
                        <table className="w-full text-[10px]">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-100">
                                    <th className="text-left py-1">Descrição</th>
                                    <th className="text-center py-1">Qtd</th>
                                    <th className="text-center py-1">Tempo Unit.</th>
                                    <th className="text-right py-1">Total (min)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <tr className="text-slate-600">
                                    <td className="py-2">Setup inicial</td>
                                    <td className="text-center">1</td>
                                    <td className="text-center">20,00 min</td>
                                    <td className="text-right font-bold">20,00</td>
                                </tr>
                                <tr className="text-slate-600">
                                    <td className="py-2">Nº de cortes (est.)</td>
                                    <td className="text-center">{numCortes}</td>
                                    <td className="text-center">{timePerCut} seg</td>
                                    <td className="text-right font-bold">{cortesTotalMin.toFixed(2)}</td>
                                </tr>
                                <tr className="text-slate-600">
                                    <td className="py-2">Nº de chapas</td>
                                    <td className="text-center">{sheetsEst}</td>
                                    <td className="text-center">3,00 min</td>
                                    <td className="text-right font-bold">{handlingTotalMin.toFixed(2)}</td>
                                </tr>
                                <tr className="text-slate-600">
                                    <td className="py-2">Manuseio / Empilhamento</td>
                                    <td className="text-center">{sheetsEst}</td>
                                    <td className="text-center">2,00 min</td>
                                    <td className="text-right font-bold">{empilhamentoTime.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Total (min)</span>
                            <span className="font-black text-slate-800">{totalCorteMin.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Total (horas)</span>
                            <span className="font-black text-slate-800">{totalCorteHours.toFixed(2)} h</span>
                        </div>
                    </div>
                </div>

                {/* 3. SETOR DE BORDEAMENTO */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                            <Disc size={14}/> 3. Setor de Bordeamento
                        </h3>
                    </div>
                    <div className="p-4 flex-1">
                        <table className="w-full text-[10px]">
                            <thead>
                                <tr className="text-slate-400 border-b border-slate-100">
                                    <th className="text-left py-1">Descrição</th>
                                    <th className="text-center py-1">Qtd</th>
                                    <th className="text-center py-1">Tempo Unit.</th>
                                    <th className="text-right py-1">Total (min)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <tr className="text-slate-600">
                                    <td className="py-2">Setup da máquina</td>
                                    <td className="text-center">1</td>
                                    <td className="text-center">15,00 min</td>
                                    <td className="text-right font-bold">15,00</td>
                                </tr>
                                <tr className="text-slate-600">
                                    <td className="py-2">Metros lineares</td>
                                    <td className="text-center">{totalLinearMeters.toFixed(2)} m</td>
                                    <td className="text-center">0,55 min/m</td>
                                    <td className="text-right font-bold">{linearBordaMin.toFixed(2)}</td>
                                </tr>
                                <tr className="text-slate-600">
                                    <td className="py-2">Peças</td>
                                    <td className="text-center">{peçasComBorda}</td>
                                    <td className="text-center">0,20 min/peça</td>
                                    <td className="text-right font-bold">{peçasBordaMin.toFixed(2)}</td>
                                </tr>
                                <tr className="text-slate-600">
                                    <td className="py-2">Acabamento / Limpeza</td>
                                    <td className="text-center">1</td>
                                    <td className="text-center">10,00 min</td>
                                    <td className="text-right font-bold">10,00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Total (min)</span>
                            <span className="font-black text-slate-800">{totalBordeamentoMin.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Total (horas)</span>
                            <span className="font-black text-slate-800">{totalBordeamentoHours.toFixed(2)} h</span>
                        </div>
                    </div>
                </div>

                {/* 4. RESUMO DA PRODUÇÃO */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 bg-slate-800 text-white">
                        <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-400"/> 4. Resumo da Produção
                        </h3>
                    </div>
                    <div className="p-4 flex-1 space-y-3">
                        <div className="flex justify-between text-xs text-slate-500 font-bold border-b border-slate-50 pb-2">
                            <span>Montagem</span>
                            <span className="text-slate-800">{totalMontagemHours.toFixed(2)} h</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 font-bold border-b border-slate-50 pb-2">
                            <span>Corte</span>
                            <span className="text-slate-800">{totalCorteHours.toFixed(2)} h</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 font-bold border-b border-slate-50 pb-2">
                            <span>Bordeamento</span>
                            <span className="text-slate-800">{totalBordeamentoHours.toFixed(2)} h</span>
                        </div>
                        
                        <div className="pt-2 flex justify-between items-center">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-tight">Tempo Total Produção</span>
                            <span className="text-lg font-black text-blue-600">{totalProdTimeRaw.toFixed(2)} h</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-bold">Fator de Complexidade</span>
                            <span>{complexityFactor.toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Tempo Total Ajustado</span>
                            <span className="text-lg font-black text-slate-800">{totalProdTimeAdjusted.toFixed(2)} h</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* INFO BAR (STATS) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Info size={20}/></div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Área total do projeto</span>
                        <span className="text-lg font-black text-blue-600">{totalArea.toFixed(2)} m²</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Clock size={20}/></div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Tempo por m²</span>
                        <span className="text-lg font-black text-slate-800">{(totalProdTimeRaw / (totalArea || 1)).toFixed(2)} h/m²</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Boxes size={20}/></div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Peças com borda</span>
                        <span className="text-lg font-black text-orange-600">{peçasComBorda} un</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Ruler size={20}/></div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Metros lineares</span>
                        <span className="text-lg font-black text-purple-600">{totalLinearMeters.toFixed(2)} m</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Home size={20}/></div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Tempo ajustado</span>
                        <span className="text-lg font-black text-emerald-600">{totalProdTimeAdjusted.toFixed(2)} h</span>
                    </div>
                </div>
            </div>

            {/* LOWER DETAIL GRIDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* DETALHAMENTO MONTAGEM */}
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-2">1. Detalhamento - Montagem</h4>
                    
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Peças</span>
                            <table className="w-full text-[9px]">
                                <thead>
                                    <tr className="text-slate-400 border-b border-slate-50">
                                        <th className="text-left font-bold py-1">Tipo de Peça</th>
                                        <th className="text-center font-bold">Qtd.</th>
                                        <th className="text-center font-bold">Tempo Unit (min)</th>
                                        <th className="text-right font-bold">Tempo Total (min)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    <tr>
                                        <td className="py-1">Portas</td>
                                        <td className="text-center">{stats.doors}</td>
                                        <td className="text-center">12,00</td>
                                        <td className="text-right font-bold">{(stats.doors * 12).toFixed(0)}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-1">Gaveta</td>
                                        <td className="text-center">{stats.drawers}</td>
                                        <td className="text-center">25,00</td>
                                        <td className="text-right font-bold">{(stats.drawers * 25).toFixed(0)}</td>
                                    </tr>
                                    {/* ... more generic mappings could go here */}
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Ferragens</span>
                            <table className="w-full text-[9px]">
                                <thead>
                                    <tr className="text-slate-400 border-b border-slate-50">
                                        <th className="text-left font-bold py-1">Ferragem</th>
                                        <th className="text-center font-bold">Qtd.</th>
                                        <th className="text-center font-bold">Tempo Unit (min)</th>
                                        <th className="text-right font-bold">Tempo Total (min)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    {hardware.slice(0, 5).map((hw, i) => (
                                        <tr key={i}>
                                            <td className="py-1 truncate max-w-[100px]">{hw.name}</td>
                                            <td className="text-center">{hw.quantity}</td>
                                            <td className="text-center">{(hw.productionTime / hw.quantity).toFixed(2)}</td>
                                            <td className="text-right font-bold">{hw.productionTime.toFixed(0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 </div>

                 {/* DETALHAMENTO CORTE & BORDEAMENTO */}
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest border-b border-slate-100 pb-2">2. Detalhamento - Corte</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Quantidade de peças</span>
                            <span className="block text-sm font-black text-slate-700">{totalPartsQty} un</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Quantidade de chapas</span>
                            <span className="block text-sm font-black text-slate-700">{sheetsEst} un</span>
                        </div>
                    </div>

                    <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-widest border-b border-slate-100 pb-2 pt-2">3. Detalhamento - Bordeamento</h4>
                    <div className="space-y-3">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Metros lineares</span>
                                <span className="block text-sm font-black text-slate-700">{totalLinearMeters.toFixed(2)} m</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Peças com borda</span>
                                <span className="block text-sm font-black text-slate-700">{peçasComBorda} un</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded text-[9px] text-slate-500">
                            Tempo base: 0,55 min/m lineares e 0,20 min por peça para manuseio.
                        </div>
                    </div>
                 </div>

                 {/* DETALHAMENTO MÃO DE OBRA & CUSTOS */}
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
                    <div>
                        <h4 className="text-[11px] font-black text-purple-600 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">Custos de Produção</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Mão de obra</span>
                                <span className="font-bold text-slate-800">R$ {(totalProdTimeAdjusted * (globalConfig.laborCostSettings?.hourlyRate || 50)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Custo máquina (corte)</span>
                                <span className="font-bold text-slate-800">R$ {(totalCorteHours * 120).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Custo máquina (borda)</span>
                                <span className="font-bold text-slate-800">R$ {(totalBordeamentoHours * 85).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600 p-4 rounded-xl text-white shadow-lg shadow-blue-100">
                        <span className="text-[10px] font-black uppercase opacity-60">Total Produção</span>
                        <div className="text-2xl font-black">R$ {((totalProdTimeAdjusted * (globalConfig.laborCostSettings?.hourlyRate || 50)) + (totalCorteHours * 120) + (totalBordeamentoHours * 85)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                 </div>
            </div>
        </div>
    );
};
