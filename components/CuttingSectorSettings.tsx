import React from 'react';
import { Scissors, Settings2, Clock, DollarSign } from 'lucide-react';
import { OptimizationConfig } from '../types';

interface CuttingSectorSettingsProps {
    globalConfig: OptimizationConfig;
    setGlobalConfig: (config: OptimizationConfig) => void;
}

export const CuttingSectorSettings: React.FC<CuttingSectorSettingsProps> = ({ globalConfig, setGlobalConfig }) => {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                <Scissors size={20} className="text-blue-600"/> Setor de Cortes (Engenharia)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-2">Parâmetros de Corte</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400">Espessura da Serra (mm)</span>
                            <input 
                                type="number" 
                                value={globalConfig.bladeThickness} 
                                onChange={e => setGlobalConfig({ ...globalConfig, bladeThickness: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" 
                            />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400">Refilo (mm)</span>
                            <input 
                                type="number" 
                                value={globalConfig.trimming} 
                                onChange={e => setGlobalConfig({ ...globalConfig, trimming: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400">Margem (mm)</span>
                            <input 
                                type="number" 
                                value={globalConfig.margin} 
                                onChange={e => setGlobalConfig({ ...globalConfig, margin: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" 
                            />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400">Velocidade Serra (m/min)</span>
                            <input 
                                type="number" 
                                value={globalConfig.sawSpeed} 
                                onChange={e => setGlobalConfig({ ...globalConfig, sawSpeed: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" 
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-2">Produtividade & Custos</label>
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3 mb-3">
                                <Clock className="text-blue-600" size={18} />
                                <span className="text-sm font-bold text-blue-800">Tempo de Processamento</span>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-blue-400 block uppercase">Minutos por m²</span>
                                <input 
                                    type="number" 
                                    value={globalConfig.minutesPerSqMeter} 
                                    onChange={e => setGlobalConfig({ ...globalConfig, minutesPerSqMeter: Number(e.target.value) })}
                                    className="w-full bg-white border border-blue-200 rounded-lg p-3 font-black text-blue-700 outline-none focus:border-blue-500 text-lg" 
                                />
                                <p className="text-[10px] text-blue-400 italic">
                                    Utilizado para calcular o tempo total de processamento de chapas no orçamento.
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-3 mb-3">
                                <DollarSign className="text-slate-600" size={18} />
                                <span className="text-sm font-bold text-slate-800">Custo Adicional por Corte</span>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Valor (R$)</span>
                                <input 
                                    type="number" 
                                    value={globalConfig.costPerCut || 0} 
                                    onChange={e => setGlobalConfig({ ...globalConfig, costPerCut: Number(e.target.value) })}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" 
                                />
                                <p className="text-[10px] text-slate-400 italic">
                                    Valor monetário por deslocamento de serra (opcional).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
