import React from 'react';
import { Disc, Clock, Settings2 } from 'lucide-react';
import { OptimizationConfig, RegisteredEdgeBand } from '../types';

interface EdgeBandingSectorSettingsProps {
    globalConfig: OptimizationConfig;
    setGlobalConfig: (config: OptimizationConfig) => void;
    edgeRegistry: RegisteredEdgeBand[];
}

export const EdgeBandingSectorSettings: React.FC<EdgeBandingSectorSettingsProps> = ({ globalConfig, setGlobalConfig, edgeRegistry }) => {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                <Disc size={20} className="text-emerald-600"/> Setor de Bordeamento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-2">Visão Geral dos Materiais</label>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">
                            <span>Tipo de Fita</span>
                            <span>Tempo Prod. (min/m)</span>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-2">
                            {edgeRegistry.length > 0 ? edgeRegistry.map(edge => (
                                <div key={edge.id} className="flex justify-between items-center py-3 px-2 hover:bg-slate-50 rounded transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700">{edge.name}</span>
                                        <span className="text-[10px] text-slate-400">{edge.thickness}mm | {edge.colorCategory}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                        <Clock size={12} className="text-emerald-600" />
                                        <span className="text-xs font-black text-emerald-700">{edge.productionTime || 0} min/m</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-slate-400 italic text-sm">
                                    Nenhuma fita cadastrada no sistema.
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 italic mt-4 p-3 bg-slate-50 rounded-lg">
                            * Os tempos de produção são configurados individualmente no registro de fitas de borda.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-2">Configurações de Engenharia</label>
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-3 mb-4">
                                <Settings2 className="text-slate-600" size={18} />
                                <span className="text-sm font-bold text-slate-800">Estilo Padrão de Representação</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setGlobalConfig({ ...globalConfig, edgeBandStyle: 'solid' })}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${globalConfig.edgeBandStyle === 'solid' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                >
                                    <div className="w-full h-1 bg-slate-800 rounded"></div>
                                    <span className="text-xs font-bold">Linha Sólida</span>
                                </button>
                                <button 
                                    onClick={() => setGlobalConfig({ ...globalConfig, edgeBandStyle: 'dashed' })}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${globalConfig.edgeBandStyle === 'dashed' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                >
                                    <div className="w-full h-1 border-t-2 border-dashed border-slate-800"></div>
                                    <span className="text-xs font-bold">Linha Tracejada</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-4 italic">
                                Define como as fitas são representadas visualmente nos diagramas se não houver regra específica por espessura.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
