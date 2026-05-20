import React from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { OptimizationConfig } from '../types';

interface FinancialSettingsProps {
    globalConfig: OptimizationConfig;
    setGlobalConfig: (config: OptimizationConfig) => void;
}

export const FinancialSettings: React.FC<FinancialSettingsProps> = ({ globalConfig, setGlobalConfig }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Card de Cálculo de Mão de Obra */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                    <Calculator size={20} className="text-orange-600"/> Cálculo de Mão de Obra
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-2">Custos Mensais</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400">Custo Direto (R$)</span>
                                <input 
                                    type="number" 
                                    value={globalConfig.laborCostSettings?.directCosts || ''} 
                                    placeholder="0"
                                    onChange={e => {
                                        const newDirect = Number(e.target.value);
                                        const indirect = globalConfig.laborCostSettings?.indirectCosts || 0;
                                        
                                        const days = globalConfig.laborCostSettings?.workingDays || 22;
                                        const hours = globalConfig.laborCostSettings?.hoursPerDay || 8;
                                        const employees = globalConfig.laborCostSettings?.numberOfEmployees || 1;
                                        const theoreticalHours = days * hours * employees;
                                        
                                        const newRate = theoreticalHours > 0 ? (newDirect + indirect) / theoreticalHours : 0;
                                        
                                        const variable = globalConfig.financialSettings?.theoreticalVariableCost || 0;
                                        const profit = globalConfig.financialSettings?.desiredMonthlyProfit || 0;
                                        const newGoal = newDirect + indirect + variable + profit;

                                        setGlobalConfig({
                                            ...globalConfig, 
                                            monthlyRevenueGoal: newGoal,
                                            laborCostSettings: { 
                                                ...globalConfig.laborCostSettings!, 
                                                directCosts: newDirect,
                                                hourlyRate: Number(newRate.toFixed(2))
                                            }
                                        });
                                    }} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" 
                                />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400">Custo Indireto (R$)</span>
                                <input 
                                    type="number" 
                                    value={globalConfig.laborCostSettings?.indirectCosts || ''} 
                                    placeholder="0"
                                    onChange={e => {
                                        const newIndirect = Number(e.target.value);
                                        const direct = globalConfig.laborCostSettings?.directCosts || 0;
                                        
                                        const days = globalConfig.laborCostSettings?.workingDays || 22;
                                        const hours = globalConfig.laborCostSettings?.hoursPerDay || 8;
                                        const employees = globalConfig.laborCostSettings?.numberOfEmployees || 1;
                                        const theoreticalHours = days * hours * employees;

                                        const newRate = theoreticalHours > 0 ? (direct + newIndirect) / theoreticalHours : 0;

                                        const variable = globalConfig.financialSettings?.theoreticalVariableCost || 0;
                                        const profit = globalConfig.financialSettings?.desiredMonthlyProfit || 0;
                                        const newGoal = direct + newIndirect + variable + profit;

                                        setGlobalConfig({
                                            ...globalConfig, 
                                            monthlyRevenueGoal: newGoal,
                                            laborCostSettings: { 
                                                ...globalConfig.laborCostSettings!, 
                                                indirectCosts: newIndirect,
                                                hourlyRate: Number(newRate.toFixed(2))
                                            }
                                        });
                                    }} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" 
                                />
                            </div>
                        </div>

                        <label className="block text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-2 mt-6">Parâmetros de Trabalho</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400">Funcionários</span>
                                <input 
                                    type="number" 
                                    value={globalConfig.laborCostSettings?.numberOfEmployees || 1} 
                                    min="1"
                                    onChange={e => {
                                        const newEmployees = Number(e.target.value);
                                        const direct = globalConfig.laborCostSettings?.directCosts || 0;
                                        const indirect = globalConfig.laborCostSettings?.indirectCosts || 0;
                                        const days = globalConfig.laborCostSettings?.workingDays || 22;
                                        const hours = globalConfig.laborCostSettings?.hoursPerDay || 8;
                                        
                                        const theoreticalHours = days * hours * newEmployees;
                                        const newRate = theoreticalHours > 0 ? (direct + indirect) / theoreticalHours : 0;

                                        setGlobalConfig({
                                            ...globalConfig, 
                                            laborCostSettings: { 
                                                ...globalConfig.laborCostSettings!, 
                                                numberOfEmployees: newEmployees,
                                                hourlyRate: Number(newRate.toFixed(2))
                                            }
                                        });
                                    }} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500 text-center" 
                                />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400">Dias Úteis</span>
                                <input 
                                    type="number" 
                                    value={globalConfig.laborCostSettings?.workingDays || 22} 
                                    onChange={e => {
                                        const newDays = Number(e.target.value);
                                        const direct = globalConfig.laborCostSettings?.directCosts || 0;
                                        const indirect = globalConfig.laborCostSettings?.indirectCosts || 0;
                                        const employees = globalConfig.laborCostSettings?.numberOfEmployees || 1;
                                        const hours = globalConfig.laborCostSettings?.hoursPerDay || 8;
                                        
                                        const theoreticalHours = newDays * hours * employees;
                                        const newRate = theoreticalHours > 0 ? (direct + indirect) / theoreticalHours : 0;

                                        setGlobalConfig({
                                            ...globalConfig, 
                                            laborCostSettings: { 
                                                ...globalConfig.laborCostSettings!, 
                                                workingDays: newDays,
                                                hourlyRate: Number(newRate.toFixed(2))
                                            }
                                        });
                                    }} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500 text-center" 
                                />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400">Horas/Dia</span>
                                <input 
                                    type="number" 
                                    value={globalConfig.laborCostSettings?.hoursPerDay || 8} 
                                    onChange={e => {
                                        const newHours = Number(e.target.value);
                                        const direct = globalConfig.laborCostSettings?.directCosts || 0;
                                        const indirect = globalConfig.laborCostSettings?.indirectCosts || 0;
                                        const employees = globalConfig.laborCostSettings?.numberOfEmployees || 1;
                                        const days = globalConfig.laborCostSettings?.workingDays || 22;
                                        
                                        const theoreticalHours = days * newHours * employees;
                                        const newRate = theoreticalHours > 0 ? (direct + indirect) / theoreticalHours : 0;

                                        setGlobalConfig({
                                            ...globalConfig, 
                                            laborCostSettings: { 
                                                ...globalConfig.laborCostSettings!, 
                                                hoursPerDay: newHours,
                                                hourlyRate: Number(newRate.toFixed(2))
                                            }
                                        });
                                    }} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500 text-center" 
                                />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-blue-600">Horas Disp./Teóricas</span>
                                <input 
                                    type="text" 
                                    value={((globalConfig.laborCostSettings?.workingDays || 22) * (globalConfig.laborCostSettings?.hoursPerDay || 8) * (globalConfig.laborCostSettings?.numberOfEmployees || 1)).toLocaleString('pt-BR')} 
                                    readOnly
                                    className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 font-bold text-blue-700 outline-none cursor-not-allowed text-center" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-2">Análise de Custos</label>
                        
                        {/* RESULTADOS CALCULADOS */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Horas Teóricas Totais</span>
                                <span className="text-lg font-black text-slate-700">
                                    {(() => {
                                        const days = globalConfig.laborCostSettings?.workingDays || 22;
                                        const hours = globalConfig.laborCostSettings?.hoursPerDay || 8;
                                        const employees = globalConfig.laborCostSettings?.numberOfEmployees || 1;
                                        return (days * hours * employees).toLocaleString('pt-BR');
                                    })()} h
                                </span>
                            </div>
                            
                            <div className="h-px bg-slate-200 w-full"></div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custo Direto/Hora</span>
                                    <div className="text-sm font-bold text-slate-600 bg-white p-2 rounded border border-slate-200 text-center">
                                        R$ {(() => {
                                            const direct = globalConfig.laborCostSettings?.directCosts || 0;
                                            const days = globalConfig.laborCostSettings?.workingDays || 22;
                                            const hours = globalConfig.laborCostSettings?.hoursPerDay || 8;
                                            const employees = globalConfig.laborCostSettings?.numberOfEmployees || 1;
                                            const theoreticalHours = days * hours * employees;
                                            return theoreticalHours > 0 ? (direct / theoreticalHours).toFixed(2) : '0.00';
                                        })()}
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custo Indireto/Hora</span>
                                    <div className="text-sm font-bold text-slate-600 bg-white p-2 rounded border border-slate-200 text-center">
                                        R$ {(() => {
                                            const indirect = globalConfig.laborCostSettings?.indirectCosts || 0;
                                            const days = globalConfig.laborCostSettings?.workingDays || 22;
                                            const hours = globalConfig.laborCostSettings?.hoursPerDay || 8;
                                            const employees = globalConfig.laborCostSettings?.numberOfEmployees || 1;
                                            const theoreticalHours = days * hours * employees;
                                            return theoreticalHours > 0 ? (indirect / theoreticalHours).toFixed(2) : '0.00';
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-emerald-700 uppercase">Valor Hora Final</span>
                                    <span className="text-xl font-black text-emerald-600">
                                        R$ {globalConfig.laborCostSettings?.hourlyRate?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card de Planejamento Financeiro */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                    <TrendingUp size={20} className="text-emerald-600"/> Planejamento Financeiro & Metas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lucro Desejado</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-sm font-bold">R$</span>
                                    <input 
                                        type="number" 
                                        value={globalConfig.financialSettings?.desiredMonthlyProfit || ''} 
                                        placeholder="0"
                                        onChange={e => {
                                            const newProfit = Number(e.target.value);
                                            const fixedCosts = (globalConfig.laborCostSettings?.directCosts || 0) + (globalConfig.laborCostSettings?.indirectCosts || 0);
                                            const variableCost = globalConfig.financialSettings?.theoreticalVariableCost || 0;
                                            const newGoal = fixedCosts + variableCost + newProfit;

                                            setGlobalConfig({
                                                ...globalConfig, 
                                                monthlyRevenueGoal: newGoal,
                                                financialSettings: { 
                                                    ...globalConfig.financialSettings!, 
                                                    desiredMonthlyProfit: newProfit 
                                                }
                                            });
                                        }} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Custo Variado Teórico</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-sm font-bold">R$</span>
                                    <input 
                                        type="number" 
                                        value={globalConfig.financialSettings?.theoreticalVariableCost || ''} 
                                        placeholder="0"
                                        onChange={e => {
                                            const newVariable = Number(e.target.value);
                                            const fixedCosts = (globalConfig.laborCostSettings?.directCosts || 0) + (globalConfig.laborCostSettings?.indirectCosts || 0);
                                            const profit = globalConfig.financialSettings?.desiredMonthlyProfit || 0;
                                            const newGoal = fixedCosts + newVariable + profit;

                                            setGlobalConfig({
                                                ...globalConfig, 
                                                monthlyRevenueGoal: newGoal,
                                                financialSettings: { 
                                                    ...globalConfig.financialSettings!, 
                                                    theoreticalVariableCost: newVariable 
                                                }
                                            });
                                        }} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Meta de Faturamento Mensal (Calculada)</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-sm font-bold">R$</span>
                                <input 
                                    type="number" 
                                    value={globalConfig.monthlyRevenueGoal || ''} 
                                    readOnly
                                    className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-3 font-bold text-emerald-700 outline-none text-lg cursor-not-allowed" 
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 italic mt-1">
                                Soma de Custos Fixos + Custo Variado + Lucro Desejado.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Custo Oportunidade</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-sm font-bold">R$</span>
                                <input 
                                    type="number" 
                                    value={globalConfig.financialSettings?.opportunityCost || ''} 
                                    placeholder="0"
                                    onChange={e => setGlobalConfig({
                                        ...globalConfig, 
                                        financialSettings: { 
                                            ...globalConfig.financialSettings!, 
                                            opportunityCost: Number(e.target.value) 
                                        }
                                    })} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col justify-center">
                        <h4 className="text-xs font-black text-slate-400 uppercase mb-4 tracking-wider">Análise Financeira</h4>
                        
                        {(() => {
                            const fixedCosts = (globalConfig.laborCostSettings?.directCosts || 0) + (globalConfig.laborCostSettings?.indirectCosts || 0);
                            const goal = globalConfig.monthlyRevenueGoal || 0;
                            const profit = globalConfig.financialSettings?.desiredMonthlyProfit || 0;
                            const opportunity = globalConfig.financialSettings?.opportunityCost || 0;
                            
                            const days = globalConfig.laborCostSettings?.workingDays || 22;
                            const hours = globalConfig.laborCostSettings?.hoursPerDay || 8;
                            const employees = globalConfig.laborCostSettings?.numberOfEmployees || 1;
                            const theoreticalHours = days * hours * employees;

                            // Calculations
                            const requiredContributionMarginRatio = goal > 0 ? (fixedCosts + profit) / goal : 0;
                            const pec = requiredContributionMarginRatio > 0 ? fixedCosts / requiredContributionMarginRatio : 0;
                            const pee = requiredContributionMarginRatio > 0 ? (fixedCosts + opportunity) / requiredContributionMarginRatio : 0;
                            
                            const estimatedHourlyValue = theoreticalHours > 0 ? profit / theoreticalHours : 0;
                            const requiredHourlyValue = theoreticalHours > 0 ? goal / theoreticalHours : 0;

                            return (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                        <div>
                                            <span className="block text-sm font-bold text-slate-600">PEC (Contábil)</span>
                                            <span className="text-[10px] text-slate-400">Ponto de Equilíbrio</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-800">
                                            R$ {pec.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                        <div>
                                            <span className="block text-sm font-bold text-blue-600">PEE (Econômico)</span>
                                            <span className="text-[10px] text-slate-400">Com Custo de Oportunidade</span>
                                        </div>
                                        <span className="text-lg font-black text-blue-600">
                                            R$ {pee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valor Hora Estimado</span>
                                            <span className="text-sm font-black text-emerald-600">
                                                R$ {estimatedHourlyValue.toFixed(2)}
                                            </span>
                                            <p className="text-[9px] text-slate-300 mt-1">Lucro / Horas Disp.</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valor Hora Necessário</span>
                                            <span className="text-sm font-black text-orange-600">
                                                R$ {requiredHourlyValue.toFixed(2)}
                                            </span>
                                            <p className="text-[9px] text-slate-300 mt-1">Meta / Horas Disp.</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};
