
import React, { useState, useEffect } from 'react';
import { 
    Clock, CheckCircle2, AlertCircle, PlayCircle, 
    Calendar, ChevronRight, MoreVertical, Plus, 
    ArrowRight, Factory, Package, Truck, Hammer, Printer,
    Scissors, Disc, Wrench
} from 'lucide-react';

interface TimelineStage {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
    description: string;
    color: string;
    estimatedTime?: string;
    realTime?: string;
    finishDate?: string;
    responsibleWorker?: string;
    isRework?: boolean;
    reworkTime?: string;
    timerActive?: boolean;
    startTime?: number;
}

const DEFAULT_STAGES: TimelineStage[] = [
    { id: 'corte', name: 'CORTE', status: 'pending', description: 'Seccionadora e Otimização.', color: 'bg-orange-500' },
    { id: 'colagem', name: 'COLAGEM', status: 'pending', description: 'Aplicação de Fita de Borda.', color: 'bg-amber-500' },
    { id: 'usinagem', name: 'USINAGEM', status: 'pending', description: 'Dobradiças, Corrediças e Furos.', color: 'bg-indigo-500' },
    { id: 'montagem', name: 'MONTAGEM', status: 'pending', description: 'Montagem Estrutural.', color: 'bg-cyan-500' },
    { id: 'limpeza', name: 'LIMPEZA', status: 'pending', description: 'Limpeza e Embalagem.', color: 'bg-slate-500' },
];

export const TimelineView: React.FC = () => {
    const [stages, setStages] = useState<TimelineStage[]>(() => {
        const saved = localStorage.getItem('cutlist_timeline_v1');
        return saved ? JSON.parse(saved) : DEFAULT_STAGES;
    });

    const [responsible, setResponsible] = useState(() => localStorage.getItem('cutlist_responsible') || '');
    const [projectName, setProjectName] = useState(() => localStorage.getItem('cutlist_project_name') || 'PROJETO SEM NOME');

    useEffect(() => {
        localStorage.setItem('cutlist_timeline_v1', JSON.stringify(stages));
        localStorage.setItem('cutlist_responsible', responsible);
    }, [stages, responsible]);

    const updateStageStatus = (id: string, status: TimelineStage['status']) => {
        setStages(prev => prev.map(s => s.id === id ? { ...s, status, finishDate: status === 'completed' ? new Date().toLocaleDateString() : s.finishDate } : s));
    };

    const updateStageField = (id: string, field: keyof TimelineStage, value: string | boolean) => {
        setStages(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const toggleTimer = (id: string) => {
        setStages(prev => prev.map(s => {
            if (s.id !== id) return s;
            if (s.timerActive) {
                const diffMs = Date.now() - (s.startTime || Date.now());
                const mins = Math.floor(diffMs / 60000);
                const hrs = Math.floor(mins / 60) ;
                const m = mins % 60;
                const newTime = `${hrs}h ${m}m`.replace(/^0h /, '');
                return { ...s, timerActive: false, realTime: newTime };
            }
            return { ...s, timerActive: true, startTime: Date.now() };
        }));
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusIcon = (status: TimelineStage['status']) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="text-emerald-500" size={20} />;
            case 'in_progress': return <PlayCircle className="text-blue-500 animate-pulse" size={20} />;
            case 'delayed': return <AlertCircle className="text-red-500" size={20} />;
            default: return <Clock className="text-slate-300" size={20} />;
        }
    };

    const getStatusText = (status: TimelineStage['status']) => {
        switch (status) {
            case 'completed': return 'Concluído';
            case 'in_progress': return 'Em Execução';
            case 'delayed': return 'Atrasado';
            default: return 'Pendente';
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto print:p-0 print:m-0">
            {/* Print Header */}
            <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Cronograma de Produção</h1>
                        <p className="text-sm font-bold text-slate-500 uppercase mt-1">Status do Fluxo de Trabalho / Fábrica</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold uppercase text-slate-400">Data de Emissão</p>
                        <p className="text-lg font-black">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Projeto</p>
                        <p className="text-xl font-black truncate">{projectName}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Responsável pela Produção</p>
                        <p className="text-xl font-black border-b border-slate-300 pb-1 min-h-[32px]">{responsible || '_________________________'}</p>
                    </div>
                </div>
            </div>

            <div className="mb-8 flex justify-between items-end print:hidden">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                        <Calendar size={32} className="text-blue-600" />
                        Cronograma de Produção
                    </h2>
                    <p className="text-slate-500 font-medium italic mt-1">Gestão de etapas e controle de fluxo da fábrica</p>
                    
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Responsável:</span>
                        <input 
                            type="text"
                            value={responsible}
                            onChange={(e) => setResponsible(e.target.value)}
                            placeholder="Nome do Responsável..."
                            className="bg-slate-100 border-none rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handlePrint}
                        className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Printer size={18} />
                        Imprimir
                    </button>
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95">
                        <Factory size={18} />
                        Mandar para Produção
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12 print:grid-cols-4 print:gap-4 print:mb-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status Geral</p>
                    <p className="text-2xl font-black text-slate-800">45% <span className="text-xs font-bold text-slate-400 uppercase">Concluído</span></p>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden print:hidden">
                        <div className="bg-blue-600 h-full w-[45%]"></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Próxima Etapa</p>
                    <p className="text-xl font-black text-blue-600 truncate">Corte / Seccionadora</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Divergências</p>
                    <p className="text-xl font-black text-slate-800">1 Alerta</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Data Estimada</p>
                    <p className="text-xl font-black text-slate-800">22/05/2026</p>
                </div>
            </div>

            <div className="space-y-4 relative">
                {/* Linha vertical conectando os círculos */}
                <div className="absolute left-8 top-8 bottom-8 w-1 bg-slate-100 -z-10 print:hidden"></div>

                {stages.map((stage, idx) => (
                    <div key={stage.id} className={`bg-white border rounded-2xl p-6 transition-all shadow-sm flex flex-col gap-4 print:break-inside-avoid print:p-4 print:rounded-none print:border-x-0 print:border-t-0 print:border-b-2 print:shadow-none ${stage.status === 'in_progress' ? 'border-blue-400 ring-2 ring-blue-50 ring-inset print:ring-0' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-inner print:w-10 print:h-10 print:text-sm ${stage.status === 'pending' ? 'bg-slate-100 text-slate-300' : `${stage.color} text-white`}`}>
                                {idx + 1}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter print:text-sm">{stage.name}</h3>
                                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${
                                        stage.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                        stage.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        stage.status === 'delayed' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {getStatusIcon(stage.status)}
                                        {getStatusText(stage.status)}
                                    </div>
                                </div>
                                <p className="text-slate-500 text-sm print:text-xs">{stage.description}</p>
                            </div>

                            <div className="flex gap-2 print:hidden">
                                <button 
                                    onClick={() => toggleTimer(stage.id)}
                                    className={`px-3 py-2 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all ${stage.timerActive ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <Clock size={14} />
                                    {stage.timerActive ? 'Parar Cronômetro' : 'Cronometrar'}
                                </button>

                                <select 
                                    value={stage.status}
                                    onChange={(e) => updateStageStatus(stage.id, e.target.value as any)}
                                    className="bg-slate-100 border-none rounded-lg px-3 py-2 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                >
                                    <option value="pending">Pendente</option>
                                    <option value="in_progress">Em Execução</option>
                                    <option value="completed">Concluído</option>
                                    <option value="delayed">Atrasado</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-50 pt-4 print:grid-cols-4 print:gap-2 print:pt-2">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 print:bg-white print:p-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Responsável</p>
                                <input 
                                    type="text"
                                    value={stage.responsibleWorker || ''}
                                    onChange={(e) => updateStageField(stage.id, 'responsibleWorker', e.target.value)}
                                    placeholder="Operador..."
                                    className="bg-transparent border-none p-0 text-sm font-black text-slate-700 w-full focus:ring-0 outline-none print:text-[10px]"
                                />
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 print:bg-white print:p-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">T. Execução (Prev)</p>
                                <input 
                                    type="text"
                                    value={stage.estimatedTime || ''}
                                    onChange={(e) => updateStageField(stage.id, 'estimatedTime', e.target.value)}
                                    placeholder="Ex: 2h"
                                    className="bg-transparent border-none p-0 text-sm font-black text-slate-700 w-full focus:ring-0 outline-none print:text-[10px]"
                                />
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 print:bg-white print:p-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tempo Real</p>
                                <input 
                                    type="text"
                                    value={stage.realTime || ''}
                                    onChange={(e) => updateStageField(stage.id, 'realTime', e.target.value)}
                                    placeholder="Registro..."
                                    className="bg-transparent border-none p-0 text-sm font-black text-blue-600 w-full focus:ring-0 outline-none print:text-[10px]"
                                />
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 print:bg-white print:p-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Finalização</p>
                                <input 
                                    type="text"
                                    value={stage.finishDate || ''}
                                    onChange={(e) => updateStageField(stage.id, 'finishDate', e.target.value)}
                                    placeholder="--/--/--"
                                    className="bg-transparent border-none p-0 text-sm font-black text-slate-700 w-full focus:ring-0 outline-none print:text-[10px]"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-6 border-t border-slate-50 pt-3 print:pt-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox"
                                    checked={stage.isRework || false}
                                    onChange={(e) => updateStageField(stage.id, 'isRework', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                                />
                                <span className={`text-[10px] font-black uppercase ${stage.isRework ? 'text-red-600' : 'text-slate-400'}`}>Houve Retrabalho?</span>
                            </label>

                            {stage.isRework && (
                                <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-lg border border-red-100 animate-in fade-in slide-in-from-left-2">
                                    <span className="text-[9px] font-black text-red-400 uppercase whitespace-nowrap">Tempo de Retrabalho:</span>
                                    <input 
                                        type="text"
                                        value={stage.reworkTime || ''}
                                        onChange={(e) => updateStageField(stage.id, 'reworkTime', e.target.value)}
                                        placeholder="Ex: 30m"
                                        className="bg-transparent border-none p-0 text-xs font-black text-red-600 w-20 focus:ring-0 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50/50 transition-all font-bold uppercase text-xs print:hidden">
                    <Plus size={18} />
                    Adicionar Etapa Personalizada
                </button>
            </div>

            <div className="mt-12 hidden print:grid grid-cols-2 gap-12 pt-12 border-t border-slate-200">
                <div className="text-center pt-8 border-t-2 border-slate-900">
                    <p className="text-xs font-black uppercase text-slate-900">Assinatura Responsável</p>
                    <p className="text-[10px] text-slate-400 mt-1 capitalize">{responsible || 'Operador de Produção'}</p>
                </div>
                <div className="text-center pt-8 border-t-2 border-slate-900">
                    <p className="text-xs font-black uppercase text-slate-900">Visto Gerência</p>
                    <p className="text-[10px] text-slate-400 mt-1">Conferência Técnica</p>
                </div>
            </div>
        </div>
    );
};
