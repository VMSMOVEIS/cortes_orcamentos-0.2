import React from 'react';
import { Wrench, Clock, Users } from 'lucide-react';
import { OptimizationConfig } from '../types';

interface AssemblySectorSettingsProps {
    globalConfig: OptimizationConfig;
    setGlobalConfig: (config: OptimizationConfig) => void;
}

export const AssemblySectorSettings: React.FC<AssemblySectorSettingsProps> = ({ globalConfig, setGlobalConfig }) => {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                <Wrench size={20} className="text-orange-600"/> Setor de Montagem
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-2">Produtividade de Montagem</label>
                    <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 space-y-4">
                        <div className="flex items-center gap-3">
                            <Clock className="text-amber-600" size={20} />
                            <div>
                                <span className="text-[10px] font-black text-amber-500 block uppercase tracking-wider">Tempo por Peça</span>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        value={globalConfig.laborCostSettings?.assemblyTimePerPart || 0} 
                                        onChange={e => setGlobalConfig({
                                            ...globalConfig, 
                                            laborCostSettings: { 
                                                ...globalConfig.laborCostSettings!, 
                                                assemblyTimePerPart: Number(e.target.value)
                                            }
                                        })}
                                        className="w-32 bg-white border border-amber-200 rounded-lg p-3 font-black text-amber-700 outline-none focus:border-amber-500 text-xl" 
                                    />
                                    <span className="text-sm font-bold text-amber-600">Minutos</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[11px] text-amber-700/70 italic leading-relaxed">
                            Este tempo é multiplicado pelo número total de peças do projeto e adicionado ao custo de mão de obra direta de montagem.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-2">Engenharia de Ferragens</label>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200">
                                <Users className="text-slate-400" size={24} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-bold text-slate-700">Otimização de Mão de Obra</span>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    O custo de montagem também inclui o tempo de processamento das ferragens extraídas do modelo 3D.
                                </p>
                            </div>
                        </div>
                        <div className="h-px bg-slate-200 w-full my-2"></div>
                        <p className="text-[10px] text-slate-400 italic">
                            * Os tempos de instalação de ferragens específicas podem ser configurados no registro de ferragens.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
