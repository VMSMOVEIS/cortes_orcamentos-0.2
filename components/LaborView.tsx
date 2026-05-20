
import React from 'react';
import { 
    Users, Clock, DollarSign, TrendingUp, Gauge, 
    HardHat, Monitor, Building2, ClipboardList, 
    CheckCircle2, Percent, Ruler, Package, Award
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ProcessedPart, OptimizationConfig, RegisteredCollaborator } from '../types';

interface LaborViewProps {
    parts: ProcessedPart[];
    totalPartsCount: number;
    totalArea: number;
    globalConfig: OptimizationConfig;
    collaborators: RegisteredCollaborator[];
    productionTimes: {
        corte: number;
        bordeamento: number;
        montagem: number;
        acabamento: number;
    };
    subtotal: number;
}

export const LaborView: React.FC<LaborViewProps> = ({ 
    parts, 
    totalPartsCount, 
    totalArea, 
    globalConfig,
    collaborators,
    productionTimes,
    subtotal
}) => {
    // 1. Employee Data (Using collaborators from state)
    const employees = (collaborators.length > 0 ? collaborators : [
        { id: '1', code: 'COL-001', name: 'Carlos Alberto', role: 'Marceneiro', sector: 'Montagem', type: 'Hora Produtiva', monthRate: 3800.00, hourRate: 17.27, status: 'Ativo' },
        { id: '2', code: 'COL-002', name: 'João Pereira', role: 'Marceneiro', sector: 'Acabamento', type: 'Hora Produtiva', monthRate: 3500.00, hourRate: 15.91, status: 'Ativo' },
        { id: '3', code: 'COL-003', name: 'Pedro Henrique', role: 'Auxiliar', sector: 'Montagem', type: 'Hora Produtiva', monthRate: 2400.00, hourRate: 10.91, status: 'Ativo' },
        { id: '4', code: 'COL-004', name: 'Roberto Silva', role: 'Oper. Seccionadora', sector: 'Corte', type: 'Hora Produtiva', monthRate: 3000.00, hourRate: 13.64, status: 'Ativo' },
        { id: '5', code: 'COL-005', name: 'Rafael Santos', role: 'Oper. Coladeira', sector: 'Bordeamento', type: 'Hora Produtiva', monthRate: 3200.00, hourRate: 14.55, status: 'Ativo' },
    ] as RegisteredCollaborator[]).map(emp => ({
        name: emp.name,
        role: emp.role,
        sector: emp.sector,
        monthlyCost: emp.monthRate,
        hours: 220,
        hourlyRate: emp.hourRate
    }));

    const totalMonthlyCost = employees.reduce((acc, e) => acc + e.monthlyCost, 0);
    const totalMonthlyHours = employees.reduce((acc, e) => acc + e.hours, 0);
    const avgHourlyRate = totalMonthlyCost / totalMonthlyHours;

    // 2. Sector Costs (Mapping resource to hourly rate based on Sector)
    const getResourceBySector = (sector: string) => {
        const found = (collaborators || []).find(c => c.sector === sector && c.status === 'Ativo');
        return found ? found.name : 'Não Alocado';
    };

    const getRateBySector = (sector: string) => {
        const found = (collaborators || []).find(c => c.sector === sector && c.status === 'Ativo');
        return found ? found.hourRate : avgHourlyRate;
    };

    const sectorCosts = [
        { id: 'corte', name: 'Corte', desc: 'Corte de chapas (seccionadora)', resource: getResourceBySector('Corte'), rate: getRateBySector('Corte') },
        { id: 'bordeamento', name: 'Bordeamento', desc: 'Colagem da fita de borda', resource: getResourceBySector('Bordeamento'), rate: getRateBySector('Bordeamento') },
        { id: 'montagem', name: 'Montagem', desc: 'Montagem e instalação', resource: getResourceBySector('Montagem'), rate: getRateBySector('Montagem') },
        { id: 'acabamento', name: 'Acabamento', desc: 'Ajustes finais e acabamentos', resource: getResourceBySector('Acabamento'), rate: getRateBySector('Acabamento') },
    ];

    // 3. Time Consumed (Production values)
    const totalProductionMinutes = productionTimes.corte + productionTimes.bordeamento + productionTimes.montagem + productionTimes.acabamento;
    const totalProductionHours = totalProductionMinutes / 60;

    const sectorsTime = sectorCosts.map(s => {
        const mins = productionTimes[s.id as keyof typeof productionTimes] || 0;
        const hours = mins / 60;
        return {
            ...s,
            mins,
            hours,
            percent: totalProductionMinutes > 0 ? (mins / totalProductionMinutes) * 100 : 0
        };
    });

    // 4. Labor Cost Calculation
    const indirectActivitiesValue = 108.00; // Mocked as per image for "Atividades Indiretas"
    
    const laborBreakdown = sectorsTime.map(s => ({
        ...s,
        totalCost: s.hours * s.rate
    }));

    const totalLaborCostSectors = laborBreakdown.reduce((acc, s) => acc + s.totalCost, 0);
    const totalLaborCostFinal = totalLaborCostSectors + indirectActivitiesValue;

    // 5. Summary Metrics
    const costPerM2 = totalArea > 0 ? totalLaborCostFinal / totalArea : 0;
    const costPerPiece = totalPartsCount > 0 ? totalLaborCostFinal / totalPartsCount : 0;
    const laborPercentOfTotal = subtotal > 0 ? (totalLaborCostFinal / subtotal) * 100 : 0;
    const productivityRate = totalProductionHours > 0 ? totalPartsCount / totalProductionHours : 0;

    // 6. Efficiency (Standard vs Real)
    // Assuming standard times are slightly different for UI example
    const efficiencyData = laborBreakdown.map(s => {
        const standardHours = s.hours * 0.95; // Just for mockup illustration
        const efficiency = (standardHours / s.hours) * 100;
        let status = 'Atenção';
        if (efficiency >= 100) status = 'Excelente';
        else if (efficiency >= 95) status = 'Bom';
        
        return {
            ...s,
            standardHours,
            efficiency,
            status
        };
    });

    const avgEfficiency = efficiencyData.reduce((acc, s) => acc + s.efficiency, 0) / efficiencyData.length;

    // 7. Productive Capacity
    const availableMonthlyHours = 1056; // Mocked
    const allocatedOtherProjects = 624; // Mocked
    const remainingHours = availableMonthlyHours - allocatedOtherProjects;
    const projectsCapacity = totalProductionHours > 0 ? remainingHours / totalProductionHours : 0;

    // Chart Data
    const chartData = laborBreakdown.map(s => ({
        name: s.name,
        value: s.hours,
        percent: s.percent
    }));

    const COLORS = ['#2563eb', '#d97706', '#10b981', '#a855f7'];

    return (
        <div className="animate-fade-in space-y-6 pb-12">
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Users size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Mão de Obra</h2>
                    <p className="text-slate-400 text-sm">Gestão de tempos, recursos e custos de mão de obra por setor</p>
                </div>
            </div>

            {/* TOP ROW: TABLES 1, 2, 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. RECURSOS / FUNCIONÁRIOS */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">1. Recursos / Funcionários</h3>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-[10px]">
                            <thead className="bg-slate-50 text-slate-400 uppercase font-bold">
                                <tr>
                                    <th className="px-3 py-2 text-left">Funcionário</th>
                                    <th className="px-3 py-2 text-left">Função</th>
                                    <th className="px-3 py-2 text-right">Custo Mensal (R$)</th>
                                    <th className="px-3 py-2 text-right">Horas Prod.</th>
                                    <th className="px-3 py-2 text-right border-l border-slate-100">Custo/Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.map((emp, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-medium text-slate-700">{emp.name}</td>
                                        <td className="px-3 py-2 text-slate-500">{emp.role}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">{emp.monthlyCost.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">{emp.hours}</td>
                                        <td className="px-3 py-2 text-right font-bold text-slate-800 bg-slate-50/30 border-l border-slate-100">{emp.hourlyRate.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-auto p-3 bg-blue-50/30 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">Custo Médio da Mão de Obra</span>
                        <span className="text-sm font-black text-blue-700">{avgHourlyRate.toFixed(2)} /h</span>
                    </div>
                </div>

                {/* 2. CENTRO DE CUSTO POR SETOR */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">2. Centro de Custo por Setor</h3>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-[10px]">
                            <thead className="bg-slate-50 text-slate-400 uppercase font-bold">
                                <tr>
                                    <th className="px-3 py-2 text-left">Setor</th>
                                    <th className="px-3 py-2 text-left">Descrição</th>
                                    <th className="px-3 py-2 text-left">Recurso Principal</th>
                                    <th className="px-3 py-2 text-right border-l border-slate-100">Custo/Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sectorCosts.map((sec, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-bold text-slate-700">{sec.name}</td>
                                        <td className="px-3 py-2 text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{sec.desc}</td>
                                        <td className="px-3 py-2 text-slate-600">{sec.resource}</td>
                                        <td className="px-3 py-2 text-right font-bold text-slate-800 bg-slate-50/30 border-l border-slate-100">{sec.rate.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. TEMPO CONSUMIDO POR SETOR */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">3. Tempo Consumido por Setor (Vindo da Produção)</h3>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-[10px]">
                            <thead className="bg-slate-50 text-slate-400 uppercase font-bold">
                                <tr>
                                    <th className="px-3 py-2 text-left">Setor</th>
                                    <th className="px-3 py-2 text-right">Tempo (min)</th>
                                    <th className="px-3 py-2 text-right">Tempo (h)</th>
                                    <th className="px-3 py-2 text-right">% Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sectorsTime.map((sec, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-medium text-slate-700">{sec.name}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">{sec.mins.toFixed(1)}</td>
                                        <td className="px-3 py-2 text-right font-bold text-slate-700">{sec.hours.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right text-slate-400">{sec.percent.toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-auto p-3 bg-blue-50/30 border-t border-slate-100 flex justify-between items-center whitespace-nowrap overflow-x-auto no-scrollbar">
                        <span className="text-[10px] font-bold text-blue-600 uppercase shrink-0">Tempo Total de Produção</span>
                        <div className="flex gap-4 items-center shrink-0">
                            <span className="text-sm font-black text-blue-700">{totalProductionMinutes.toLocaleString()} m</span>
                            <span className="text-sm font-black text-blue-700">{totalProductionHours.toFixed(2)} h</span>
                            <span className="text-[10px] font-bold text-blue-400">100%</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* MIDDLE ROW: TABLE 4 & DASHBOARD 5 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* 4. CUSTO DA MÃO DE OBRA POR SETOR */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">4. Custo da Mão de Obra por Setor</h3>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-[10px]">
                            <thead className="bg-slate-50 text-slate-400 uppercase font-bold">
                                <tr>
                                    <th className="px-4 py-3 text-left">Setor</th>
                                    <th className="px-4 py-3 text-left">Recurso Principal</th>
                                    <th className="px-4 py-3 text-right">Tempo (h)</th>
                                    <th className="px-4 py-3 text-right">Custo p/ Hora (R$)</th>
                                    <th className="px-4 py-3 text-right border-l border-slate-100">Custo Total (R$)</th>
                                    <th className="px-4 py-3 text-right">% Participação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {laborBreakdown.map((sec, i) => (
                                    <tr key={i} className="hover:bg-slate-100/50">
                                        <td className="px-4 py-3 font-bold text-slate-700">{sec.name}</td>
                                        <td className="px-4 py-3 text-slate-500">{sec.resource}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">{sec.hours.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">{sec.rate.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-black text-slate-800 bg-slate-50/50 border-l border-slate-100">R$ {sec.totalCost.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-slate-400">{(sec.totalCost / totalLaborCostFinal * 100).toFixed(2)}%</td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50/80">
                                    <td className="px-4 py-3 font-medium text-slate-500 italic">Atividades Indiretas*</td>
                                    <td className="px-4 py-3 text-slate-400 italic">Rateio Geral</td>
                                    <td className="px-4 py-3 text-right text-slate-300">-</td>
                                    <td className="px-4 py-3 text-right text-slate-300">-</td>
                                    <td className="px-4 py-3 text-right font-black text-slate-700 bg-slate-100/50 border-l border-slate-100">R$ {indirectActivitiesValue.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right text-slate-400">{(indirectActivitiesValue / totalLaborCostFinal * 100).toFixed(2)}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-auto p-4 bg-blue-600 text-white flex justify-between items-center shadow-lg">
                        <span className="font-black uppercase tracking-widest text-[10px]">Total Geral</span>
                        <div className="flex gap-12 items-center">
                            <span className="font-black text-lg">{totalProductionHours.toFixed(2)}h</span>
                            <span className="font-black text-xl italic">R$ {totalLaborCostFinal.toFixed(2)}</span>
                            <span className="font-black text-lg opacity-60">100%</span>
                        </div>
                    </div>
                </div>

                {/* 5. RESUMO DA MÃO DE OBRA */}
                <div className="lg:col-span-2 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center group hover:border-blue-300 transition-all shadow-sm">
                             <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <Clock size={20} />
                             </div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tempo Total de Produção</span>
                             <span className="text-x font-black text-slate-800">{totalProductionHours.toFixed(2)} h</span>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center group hover:border-emerald-300 transition-all shadow-sm">
                             <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <Users size={20} />
                             </div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo Total da Mão de Obra</span>
                             <span className="text-xl font-black text-slate-800">R$ {totalLaborCostFinal.toFixed(2)}</span>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center group hover:border-purple-300 transition-all shadow-sm">
                             <div className="p-2.5 bg-purple-50 text-purple-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <Award size={20} />
                             </div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo por m² (Projeto)</span>
                             <span className="text-xl font-black text-slate-800">R$ {costPerM2.toFixed(2)} /m²</span>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center group hover:border-orange-300 transition-all shadow-sm">
                             <div className="p-2.5 bg-orange-50 text-orange-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <Package size={20} />
                             </div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo por Peça</span>
                             <span className="text-xl font-black text-slate-800">R$ {costPerPiece.toFixed(2)} /peça</span>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center group hover:border-blue-300 transition-all shadow-sm">
                             <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <Gauge size={20} />
                             </div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">% da Mão de Obra no Custo Total</span>
                             <span className="text-xl font-black text-slate-800">{laborPercentOfTotal.toFixed(2)}%</span>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center group hover:border-indigo-300 transition-all shadow-sm">
                             <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <TrendingUp size={20} />
                             </div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Produtividade Média</span>
                             <span className="text-xl font-black text-slate-800">{productivityRate.toFixed(2)} peças/h</span>
                        </div>
                     </div>
                </div>

            </div>

            {/* BOTTOM ROW: EFICIÊNCIA, CAPACIDADE, CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 6. EFICIÊNCIA DA MÃO DE OBRA */}
                <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">6. Eficiência da Mão de Obra</h3>
                    </div>
                    <div className="p-0">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px]">
                                <tr>
                                    <th className="px-4 py-3 text-left">Setor</th>
                                    <th className="px-4 py-3 text-right">Tempo Padrão (h)</th>
                                    <th className="px-4 py-3 text-right">Tempo Real (h)</th>
                                    <th className="px-4 py-3 text-right">Eficiência (%)</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {efficiencyData.map((sec, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-700">{sec.name}</td>
                                        <td className="px-4 py-3 text-right text-slate-500">{sec.standardHours.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">{sec.hours.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-black text-slate-800">{sec.efficiency.toFixed(2)}%</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-[9px] uppercase font-black px-2 py-1 rounded-full ${
                                                sec.status === 'Excelente' ? 'bg-emerald-100 text-emerald-700' :
                                                sec.status === 'Bom' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {sec.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eficiência Média Geral</span>
                        <span className="text-xl font-black text-emerald-600">{avgEfficiency.toFixed(2)}%</span>
                    </div>
                </div>

                {/* 7. CAPACIDADE PRODUTIVA */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col p-5">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">7. Capacidade Produtiva</h3>
                    
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Horas produtivas disponíveis / mês</span>
                            <span className="font-bold text-slate-700">{availableMonthlyHours.toLocaleString()} h</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Horas já alocadas (outros projetos)</span>
                            <span className="font-bold text-slate-700">{allocatedOtherProjects.toLocaleString()} h</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                             <span className="font-bold text-slate-800 text-xs">Horas disponíveis restantes</span>
                             <span className="font-black text-emerald-600 text-lg">{remainingHours.toLocaleString()} h</span>
                        </div>

                        <div className="py-2"></div>

                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 italic">Este projeto consome</span>
                            <span className="font-black text-slate-800 text-base">{totalProductionHours.toFixed(2)} h</span>
                        </div>

                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mt-auto">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Capacidade para novos projetos</span>
                                <span className="text-2xl font-black text-emerald-700">{projectsCapacity.toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] text-emerald-500 mt-1 uppercase italic font-bold">Projetos simultâneos</p>
                        </div>
                    </div>
                </div>

                {/* 8. DISTRIBUIÇÃO DO TEMPO POR SETOR */}
                <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col p-5">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">8. Distribuição do Tempo por Setor</h3>
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: any) => [`${Number(value).toFixed(2)}h`, 'Tempo']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-10">
                            <span className="text-2xl font-black text-slate-800">{totalProductionHours.toFixed(2)}h</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};
