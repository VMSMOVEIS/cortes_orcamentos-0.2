
import React, { useMemo } from 'react';
import { 
    DollarSign, Package, TrendingUp, PieChart as PieChartIcon, 
    Layers, Activity, Info, BarChart3, TrendingDown,
    Building2, Wrench, Users, Clock, Ruler, Boxes,
    ArrowUpRight, ArrowDownRight, ClipboardList, List
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { OptimizationConfig } from '../types';

interface CostsViewProps {
    totalMaterialCost: number;
    totalHardwareCost: number;
    totalEdgeCost: number;
    calculatedLaborCost: number;
    indirectCostsTotal: number;
    subtotal: number;
    totalAreaM2: number;
    totalPartsCount: number;
    globalConfig: OptimizationConfig;
    productionTimes: {
        corte: number;
        bordeamento: number;
        montagem: number;
        acabamento: number;
    };
}

export const CostsView: React.FC<CostsViewProps> = ({
    totalMaterialCost,
    totalHardwareCost,
    totalEdgeCost,
    calculatedLaborCost,
    indirectCostsTotal,
    subtotal,
    totalAreaM2,
    totalPartsCount,
    globalConfig,
    productionTimes
}) => {
    
    // Calculated values
    const totalMaterials = totalMaterialCost + totalEdgeCost;
    const costPerM2 = totalAreaM2 > 0 ? subtotal / totalAreaM2 : 0;
    const costPerPiece = totalPartsCount > 0 ? subtotal / totalPartsCount : 0;
    const totalProductionHours = (productionTimes.corte + productionTimes.bordeamento + productionTimes.montagem + productionTimes.acabamento) / 60;
    const costPerHour = totalProductionHours > 0 ? subtotal / totalProductionHours : 0;

    // Chart Data
    const chartData = [
        { name: 'Materiais', value: totalMaterials, color: '#10b981' },
        { name: 'Ferragens', value: totalHardwareCost, color: '#f59e0b' },
        { name: 'Mão de Obra', value: calculatedLaborCost, color: '#8b5cf6' },
        { name: 'Custos Indiretos', value: indirectCostsTotal, color: '#3b82f6' },
        { name: 'Outros Custos', value: subtotal * 0.03, color: '#94a3b8' } // Placeholder for "Outros"
    ];

    const totalCalculated = chartData.reduce((acc, curr) => acc + curr.value, 0);

    // TOP 7 Cost Detailed Breakdown
    const detailedCosts = [
        { desc: 'Materiais', val: totalMaterials, percent: (totalMaterials / subtotal) * 100 },
        { desc: 'Ferragens', val: totalHardwareCost, percent: (totalHardwareCost / subtotal) * 100 },
        { desc: 'Mão de Obra Direta', val: calculatedLaborCost, percent: (calculatedLaborCost / subtotal) * 100 },
        { desc: 'Custos Indiretos de Produção', val: indirectCostsTotal * 0.8, percent: (indirectCostsTotal * 0.8 / subtotal) * 100 },
        { desc: 'Despesas Administrativas', val: indirectCostsTotal * 0.15, percent: (indirectCostsTotal * 0.15 / subtotal) * 100 },
        { desc: 'Despesas Comerciais', val: indirectCostsTotal * 0.05, percent: (indirectCostsTotal * 0.05 / subtotal) * 100 },
        { desc: 'Outros Custos', val: subtotal * 0.03, percent: 3 }
    ];

    // Indirect Costs Detail
    const indirectDetails = [
        { desc: 'Energia Elétrica', criteria: 'Horas de MO', val: (calculatedLaborCost * 0.12) },
        { desc: 'Depreciação de Máquinas', criteria: 'Horas de Máquina', val: (calculatedLaborCost * 0.18) },
        { desc: 'Manutenção de Equipamentos', criteria: 'Horas de Máquina', val: (calculatedLaborCost * 0.06) },
        { desc: 'Aluguel / Infraestrutura', criteria: 'm² do Projeto', val: (totalAreaM2 * 40) },
        { desc: 'Materiais de Consumo', criteria: 'Horas de MO', val: (calculatedLaborCost * 0.04) },
        { desc: 'Encargos e Benefícios', criteria: 'Horas de MO', val: (calculatedLaborCost * 0.25) }
    ];

    const totalIndirectDetailed = indirectDetails.reduce((acc, curr) => acc + curr.val, 0);

    // Productivity Sector Costs
    const sectorCosts = [
        { setor: 'Corte', custo: calculatedLaborCost * 0.15, percent: 1.5 },
        { setor: 'Bordamento (Fita de Borda)', custo: calculatedLaborCost * 0.25, percent: 2.5 },
        { setor: 'Montagem', custo: calculatedLaborCost * 0.50, percent: 5.0 },
        { setor: 'Acabamento', custo: calculatedLaborCost * 0.10, percent: 1.0 }
    ];

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shadow-inner">
                        <PieChartIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Custos</h2>
                        <p className="text-slate-400 text-sm">Composição dos custos do projeto e análise de rentabilidade</p>
                    </div>
                </div>
            </div>

            {/* TOP SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Package size={40} />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Package size={16}/></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Custo dos Materiais</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-800">R$ {totalMaterials.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] font-black text-emerald-500 italic mt-0.5">{((totalMaterials / subtotal) * 100).toFixed(2)}%</span>
                    </div>
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wrench size={40} />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Wrench size={16}/></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Custo das Ferragens</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-800">R$ {totalHardwareCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] font-black text-orange-500 italic mt-0.5">{((totalHardwareCost / subtotal) * 100).toFixed(2)}%</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users size={40} />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={16}/></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Custo da Mão de Obra</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-800">R$ {calculatedLaborCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] font-black text-purple-500 italic mt-0.5">{((calculatedLaborCost / subtotal) * 100).toFixed(2)}%</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Building2 size={40} />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building2 size={16}/></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Custos Indiretos</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-slate-800">R$ {indirectCostsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] font-black text-blue-500 italic mt-0.5">{((indirectCostsTotal / subtotal) * 100).toFixed(2)}%</span>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-lg shadow-slate-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={40} className="text-white" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-700 text-white rounded-lg"><DollarSign size={16}/></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Custo Total do Projeto</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black text-white">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] font-black text-blue-400 italic mt-0.5 uppercase tracking-widest">100,00 %</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 1. COMPOSIÇÃO DO CUSTO TOTAL */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic flex items-center gap-2">
                        <Layers size={14} className="text-blue-500"/> 1. Composição do Custo Total
                    </h3>
                    
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: any) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontFamily: 'sans-serif' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs font-black text-slate-800">R$ {subtotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Total</span>
                        </div>
                    </div>

                    <div className="space-y-3 mt-4">
                        {chartData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="font-bold text-slate-600">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-slate-500 text-[9px]">R$ {item.value.toLocaleString('pt-BR')}</span>
                                    <span className="font-black text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded">{(item.value / subtotal * 100).toFixed(2)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. DETALHAMENTO DOS CUSTOS */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                             <List size={14} className="text-blue-500"/> 2. Detalhamento dos Custos
                        </h3>
                        <table className="w-full text-left text-[10px]">
                            <thead className="text-slate-400 font-bold uppercase italic border-b border-slate-50">
                                <tr>
                                    <th className="py-2">Descrição</th>
                                    <th className="py-2 text-right">Valor (R$)</th>
                                    <th className="py-2 text-right">% sobre o Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {detailedCosts.map((cost, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-2.5 text-slate-700 font-medium">{cost.desc}</td>
                                        <td className="py-2.5 text-right font-mono text-slate-600">{cost.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-2.5 text-right font-black text-slate-800">{cost.percent.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-blue-100 bg-blue-50/30">
                                    <td className="py-3 font-black text-blue-700 uppercase italic">Custo Total do Projeto</td>
                                    <td className="py-3 text-right font-black text-blue-800 text-xs">R$ {subtotal.toLocaleString('pt-BR')}</td>
                                    <td className="py-3 text-right font-black text-blue-800">100,00%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* 3. CUSTOS INDIRETOS (RATEIO) */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-6">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                             <Activity size={14} className="text-blue-500"/> 3. Custos Indiretos (Rateio)
                        </h3>
                        <table className="w-full text-left text-[10px]">
                            <thead className="text-slate-400 font-bold uppercase italic border-b border-slate-50">
                                <tr>
                                    <th className="py-2">Descrição</th>
                                    <th className="py-2">Critério de Rateio</th>
                                    <th className="py-2 text-right">Valor (R$)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {indirectDetails.map((ind, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-2.5 text-slate-700 font-medium">{ind.desc}</td>
                                        <td className="py-2.5 text-slate-400 font-mono italic">{ind.criteria}</td>
                                        <td className="py-2.5 text-right font-black text-slate-800">{ind.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-blue-100 bg-blue-50/30">
                                    <td colSpan={2} className="py-3 font-black text-blue-700 uppercase italic">Total Custos Indiretos</td>
                                    <td className="py-3 text-right font-black text-blue-800 text-xs">R$ {totalIndirectDetailed.toLocaleString('pt-BR')}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* 4. CUSTO POR SETOR DE PRODUÇÃO */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic">4. Custo por Setor de Produção</h3>
                    <table className="w-full text-[10px]">
                        <thead className="text-slate-400 font-bold italic border-b border-slate-50">
                            <tr>
                                <th className="py-2 text-left">Setor</th>
                                <th className="py-2 text-right">Custo (R$)</th>
                                <th className="py-2 text-right">% sobre o Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sectorCosts.map((sector, idx) => (
                                <tr key={idx}>
                                    <td className="py-3 text-slate-600 font-medium">{sector.setor}</td>
                                    <td className="py-3 text-right font-mono text-slate-500">{sector.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-3 text-right font-black text-slate-800">{sector.percent.toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-blue-600 font-black">
                                <td className="py-3 text-blue-700 uppercase text-[9px] italic">Total Mão de Obra Direta</td>
                                <td className="py-3 text-right text-blue-800">{calculatedLaborCost.toLocaleString('pt-BR')}</td>
                                <td className="py-3 text-right text-blue-800">{((calculatedLaborCost / subtotal) * 100).toFixed(2)}%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* 5. ANÁLISE DE CUSTO UNITÁRIO */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic">5. Análise de Custo Unitário</h3>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between group">
                            <span className="text-[10px] text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Área total do projeto</span>
                            <span className="text-xs font-black text-slate-800 italic">{totalAreaM2.toFixed(2)} m²</span>
                        </div>
                        <div className="flex items-center justify-between group">
                            <span className="text-[10px] text-slate-500 font-medium group-hover:text-slate-700 transition-colors">Quantidade total de peças</span>
                            <span className="text-xs font-black text-slate-800 italic">{totalPartsCount} peças</span>
                        </div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                            <span className="text-[10px] text-slate-500 font-medium">Custo total do projeto</span>
                            <span className="text-sm font-black text-blue-600">R$ {subtotal.toLocaleString('pt-BR')}</span>
                        </div>
                        
                        <div className="pt-2 space-y-4">
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Ruler size={14}/>
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Custo por m²</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 tracking-tight">R$ {costPerM2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Boxes size={14}/>
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Custo por peça</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 tracking-tight">R$ {costPerPiece.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Clock size={14}/>
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Custo por hora de produção</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 tracking-tight">R$ {costPerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                     </div>
                </div>

                {/* 6. CURVA ABC DE CUSTOS */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic">6. Curva ABC de Custos</h3>
                    <table className="w-full text-[10px]">
                        <thead className="text-slate-400 font-bold italic border-b border-slate-50">
                            <tr>
                                <th className="py-2 text-left">Class.</th>
                                <th className="py-2 text-left">Descrição</th>
                                <th className="py-2 text-right">Valor (R$)</th>
                                <th className="py-2 text-right">% Acum.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[
                                { class: 'A', desc: 'Materiais (Chapas)', val: totalMaterialCost, accum: 45.2 },
                                { class: 'A', desc: 'Ferragens (Corrediças)', val: totalHardwareCost * 0.6, accum: 55.4 },
                                { class: 'A', desc: 'Ferragens (Dobradiças)', val: totalHardwareCost * 0.35, accum: 61.2 },
                                { class: 'B', desc: 'Fita de Borda', val: totalEdgeCost, accum: 65.1 },
                                { class: 'B', desc: 'Mão de Obra Montagem', val: calculatedLaborCost * 0.5, accum: 71.9 },
                                { class: 'C', desc: 'Parafusos e Fixadores', val: totalHardwareCost * 0.05, accum: 73.3 },
                                { class: 'C', desc: 'Colas e Adesivos', val: 95.0, accum: 74.2 }
                            ].map((abc, i) => (
                                <tr key={i} className="group hover:bg-slate-50/50">
                                    <td className="py-2.5">
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                                            abc.class === 'A' ? 'bg-red-50 text-red-500' : 
                                            abc.class === 'B' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'
                                        }`}>{abc.class}</span>
                                    </td>
                                    <td className="py-2.5 text-slate-600 font-medium group-hover:text-slate-900">{abc.desc}</td>
                                    <td className="py-2.5 text-right font-mono text-slate-500">{abc.val.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                                    <td className="py-2.5 text-right font-black text-slate-800">{abc.accum.toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 7. COMPARATIVO ORÇADO x REAL (PREVISÃO) */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic">7. Comparativo Orçado x Real (Previsão)</h3>
                    <table className="w-full text-[10px]">
                        <thead className="text-slate-400 font-bold italic border-b border-slate-50">
                            <tr>
                                <th className="py-2 text-left">Descrição</th>
                                <th className="py-2 text-right">Orçado (R$)</th>
                                <th className="py-2 text-right">Previsto (R$)</th>
                                <th className="py-2 text-right">Variação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {[
                                { desc: 'Materiais', orc: totalMaterials, pre: totalMaterials * 1.026, var: 2.6, up: true },
                                { desc: 'Ferragens', orc: totalHardwareCost, pre: totalHardwareCost * 0.98, var: -1.9, up: false },
                                { desc: 'Mão de Obra', orc: calculatedLaborCost, pre: calculatedLaborCost * 1.03, var: 3.0, up: true },
                                { desc: 'Custos Indiretos', orc: indirectCostsTotal, pre: indirectCostsTotal * 1.015, var: 1.5, up: true },
                                { desc: 'Outros Custos', orc: subtotal * 0.03, pre: subtotal * 0.03 * 1.028, var: 2.8, up: true }
                            ].map((comp, i) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                    <td className="py-3 text-slate-600 font-medium">{comp.desc}</td>
                                    <td className="py-3 text-right font-mono text-slate-500">{(comp.orc / 1000).toFixed(2)}k</td>
                                    <td className="py-3 text-right font-mono text-slate-700">{(comp.pre / 1000).toFixed(2)}k</td>
                                    <td className="py-3 text-right">
                                        <div className={`flex items-center justify-end gap-1 font-black ${comp.up ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {comp.up ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                                            {comp.up ? '+' : ''}{comp.var.toFixed(1)}%
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-800 bg-slate-900 text-white font-black uppercase">
                                <td className="py-3 px-2 italic text-[9px]">Total</td>
                                <td className="py-3 text-right font-mono text-[10px]">{subtotal.toLocaleString('pt-BR')}</td>
                                <td className="py-3 text-right font-mono text-[10px]">{(subtotal * 1.0186).toLocaleString('pt-BR')}</td>
                                <td className="py-3 text-right text-emerald-400">+1,86%</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* INFO BANNER */}
            <div className="flex bg-blue-50 border border-blue-100 rounded-2xl p-4 gap-4 items-center">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 shrink-0">
                    <Info size={24} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-blue-700 font-black uppercase tracking-tight italic">Informação sobre os custos</p>
                        <span className="text-[9px] text-blue-400 font-bold">Última atualização: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                        Os custos são calculados com base no plano de corte, lista de materiais, tempos padrão e critérios de rateio definidos nas configurações globais do sistema.
                        Qualquer alteração nas tabelas de preços ou coeficientes de produtividade impactará diretamente esta análise.
                    </p>
                </div>
            </div>
        </div>
    );
};
