
import React, { useMemo, useState, useEffect } from 'react';
import { ProcessedPart, RegisteredHardware, ExtractedComponent } from '../types';
import { generateAssemblyJSON } from '../services/assemblyEngine';
import { ScrewDrawing, DowelDrawing, HingeDrawing, MinifixDrawing, NailDrawing } from './HardwareIcons';
import { Printer, Box, Camera, Trash, Upload, FileText, X, Settings2, PlusCircle, MinusCircle, Image as ImageIcon, Crosshair, ChevronDown, ChevronUp, Wrench } from 'lucide-react';

interface AssemblyGuideProps {
  parts: ProcessedPart[];
  projectName: string;
  hardwareRegistry: RegisteredHardware[];
  extractedHardware?: ExtractedComponent[];
}

interface LocalAssemblyStep {
    id: string;
    title: string;
    description: string;
    image: string | null;
}

interface ManualProject {
    id: string;
    name: string;
    steps: LocalAssemblyStep[];
    hardware: { nome: string; quantidade: number; uso: string }[];
}

export const AssemblyGuide: React.FC<AssemblyGuideProps> = ({ parts, projectName, hardwareRegistry, extractedHardware = [] }) => {
  // --- STATE DE PROJETOS DE MANUAL ---
  const [manualProjects, setManualProjects] = useState<ManualProject[]>(() => {
      const saved = localStorage.getItem('cutlist_manuals_v2');
      return saved ? JSON.parse(saved) : [];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => manualProjects[0]?.id || "");

  const activeProject = useMemo(() => 
    manualProjects.find(p => p.id === activeProjectId), 
  [manualProjects, activeProjectId]);

  // Sincronização com as peças importadas (Projetos Detectados)
  const detectedProjects = useMemo(() => {
      return Array.from(new Set(parts.map(p => p.sourceFile || "Desconhecido"))).sort();
  }, [parts]);

  useEffect(() => {
      localStorage.setItem('cutlist_manuals_v2', JSON.stringify(manualProjects));
  }, [manualProjects]);

  // --- HANDLERS ---

  const registerProject = (name: string) => {
      if (manualProjects.find(p => p.name === name)) return; // Já existe
      
      const projectParts = parts.filter(p => (p.sourceFile || "Desconhecido") === name);
      const autoData = generateAssemblyJSON(projectParts, name);
      
      // Filtra as ferragens extraídas pertencentes a este projeto
      const projectExtractedHardware = (extractedHardware || []).filter(h => (h.sourceFile || "Desconhecido") === name);
      const mappedHardware = projectExtractedHardware.map(h => ({
          nome: h.name,
          quantidade: h.quantity,
          uso: h.dimensions ? `Extraído (${h.dimensions})` : 'Extraído'
      }));

      const finalHardware = mappedHardware.length > 0 ? mappedHardware : autoData.ferragens;
      
      const newManual: ManualProject = {
          id: Date.now().toString(),
          name: name,
          hardware: finalHardware,
          steps: (autoData.modulos[0]?.passos.map(p => ({
              id: `auto_${p.passo}_${Date.now()}`,
              title: `${p.passo}º Passo - ${p.titulo}`,
              description: p.descricao_tecnica,
              image: null
          })) || [{ id: '1', title: '1º Passo', description: 'Início da montagem.', image: null }])
      };
      
      setManualProjects(prev => [...prev, newManual]);
      setActiveProjectId(newManual.id);
  };

  const deleteProject = (id: string) => {
      setManualProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(manualProjects.find(p => p.id !== id)?.id || "");
  };

  const updateActiveProject = (updater: (p: ManualProject) => ManualProject) => {
      setManualProjects(prev => prev.map(p => p.id === activeProjectId ? updater(p) : p));
  };

  const [showHardwareModal, setShowHardwareModal] = useState(false);

  const handleStepImageUpload = (e: React.ChangeEvent<HTMLInputElement>, stepId: string) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            updateActiveProject(p => ({
                ...p,
                steps: p.steps.map(s => s.id === stepId ? { ...s, image: reader.result as string } : s)
            }));
        };
        reader.readAsDataURL(file);
    }
  };

  const addStep = () => {
      updateActiveProject(p => ({
          ...p,
          steps: [...p.steps, { id: Date.now().toString(), title: `${p.steps.length + 1}º Passo`, description: '', image: null }]
      }));
  };

  const removeStep = (id: string) => {
      updateActiveProject(p => ({
          ...p,
          steps: p.steps.filter(s => s.id !== id)
      }));
  };

  const updateStep = (id: string, field: keyof LocalAssemblyStep, value: string) => {
       updateActiveProject(p => ({
          ...p,
          steps: p.steps.map(s => s.id === id ? { ...s, [field]: value } : s)
      }));
  };

  // --- HARDWARE EDIT HANDLERS ---
  const updateHardware = (index: number, field: string, val: any) => {
      updateActiveProject(p => {
          const nextHw = [...p.hardware];
          nextHw[index] = { ...nextHw[index], [field]: val };
          return { ...p, hardware: nextHw };
      });
  };
  const removeHardware = (index: number) => {
      updateActiveProject(p => ({ ...p, hardware: p.hardware.filter((_, i) => i !== index) }));
  };
  const addHardware = (reg: RegisteredHardware) => {
      updateActiveProject(p => ({ ...p, hardware: [...p.hardware, { nome: reg.name, quantidade: 1, uso: 'Geral' }] }));
  };

  const activeParts = useMemo(() => {
      if (!activeProject) return [];
      return parts.filter(p => (p.sourceFile || "Desconhecido") === activeProject.name)
                  .sort((a,b) => parseInt(a.displayId) - parseInt(b.displayId));
  }, [parts, activeProject]);

  const getHardwareIcon = (name: string) => {
      const reg = hardwareRegistry.find(h => h.name.toLowerCase() === name.toLowerCase());
      if (reg && reg.imageUrl) return <img src={reg.imageUrl} className="w-full h-full object-contain" />;
      if (name.includes('Parafuso')) return <ScrewDrawing className="text-slate-600"/>;
      if (name.includes('Cavilha')) return <DowelDrawing className="text-amber-700"/>;
      if (name.includes('Dobradiça')) return <HingeDrawing className="text-slate-600"/>;
      if (name.includes('Minifix')) return <MinifixDrawing className="text-slate-600"/>;
      if (name.includes('Prego')) return <NailDrawing className="text-slate-800"/>;
      return <div className="text-[10px] font-bold text-slate-400">?</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
        
        {/* --- GERENCIADOR DE MANUAIS --- */}
        <div className="no-print bg-slate-800 text-white p-6 shadow-xl border-b border-slate-700">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                             <Wrench size={24} className="text-blue-400" /> Gerenciador de Manuais
                        </h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Selecione ou adicione projetos para detalhar a montagem</p>
                    </div>
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-transform active:scale-95">
                        <Printer size={18} /> Imprimir Manual
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Projetos Detectados */}
                    <div className="bg-slate-700/50 p-4 rounded-2xl border border-slate-600">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <PlusCircle size={14} /> Projetos Detectados no Arquivo
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {detectedProjects.map(name => (
                                <button 
                                    key={name}
                                    onClick={() => registerProject(name)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${manualProjects.find(p => p.name === name) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'}`}
                                >
                                    {name} {manualProjects.find(p => p.name === name) && '✓'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Meus Manuais Ativos */}
                    <div className="bg-slate-700/50 p-4 rounded-2xl border border-slate-600">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <FileText size={14} /> Manuais em Elaboração
                        </h3>
                        {manualProjects.length === 0 ? (
                            <p className="text-slate-500 text-xs italic">Nenhum manual iniciado. Escolha um projeto acima.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {manualProjects.map(proj => (
                                    <div key={proj.id} className="flex items-center group">
                                        <button 
                                            onClick={() => setActiveProjectId(proj.id)}
                                            className={`px-4 py-1.5 rounded-l-lg text-xs font-black transition-all ${activeProjectId === proj.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            {proj.name}
                                        </button>
                                        <button 
                                            onClick={() => deleteProject(proj.id)}
                                            className={`p-1.5 rounded-r-lg border-l border-slate-700 transition-all ${activeProjectId === proj.id ? 'bg-blue-600 text-white/50 hover:text-white' : 'bg-slate-800 text-slate-600 hover:text-red-500'}`}
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {!activeProject ? (
            <div className="max-w-xl mx-auto mt-20 text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm block no-print">
                <Box size={64} className="mx-auto text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-800 uppercase italic">Nenhum Manual Selecionado</h3>
                <p className="text-slate-500 mt-2 font-medium">Use o gerenciador acima para registrar os projetos que deseja documentar passo a passo.</p>
            </div>
        ) : (
            <>
        {/* --- DOCUMENTO A4 --- */}
        <div className="max-w-[210mm] mx-auto my-8 print:m-0 print:w-full">
            
            {/* PÁGINA 1: CAPA E LISTAS */}
            <div className="bg-white shadow-xl print:shadow-none p-[10mm] min-h-[297mm] relative mb-8 print:break-after-page">
                {/* CABEÇALHO */}
                <div className="border-b-4 border-slate-900 pb-4 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Manual de Montagem</h1>
                        <p className="text-xl font-bold text-slate-500 uppercase mt-1 italic tracking-tight">{activeProject.name}</p>
                    </div>
                    <div className="text-right">
                         <div className="text-xs font-bold text-slate-400 uppercase leading-none mb-1">Empresa / Projeto Pai</div>
                         <div className="font-bold text-slate-800 text-lg uppercase tracking-widest">{projectName}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {/* LISTA DE PEÇAS */}
                    <div>
                        <div className="bg-slate-100 p-2 border-b-2 border-slate-300 mb-2">
                            <h3 className="font-black text-slate-800 uppercase text-sm flex items-center gap-2"><FileText size={16}/> Lista de Peças</h3>
                        </div>
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200 text-[10px]">
                                <tr>
                                    <th className="p-2 text-center w-8 border-r">ID</th>
                                    <th className="p-2 text-left border-r">Descrição</th>
                                    <th className="p-2 text-center w-16 border-r">Medida</th>
                                    <th className="p-2 text-center w-8">Qtd</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeParts.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50">
                                        <td className="p-2 text-center font-black text-slate-900 border-r bg-slate-50/30">{p.displayId}</td>
                                        <td className="p-2 font-medium text-slate-700 border-r truncate max-w-[120px]">{p.finalName}</td>
                                        <td className="p-2 text-center font-mono text-slate-500 border-r text-[9px]">{Math.round(p.dimensions.height)}x{Math.round(p.dimensions.width)}</td>
                                        <td className="p-2 text-center font-bold text-slate-900">{p.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* LISTA DE FERRAGENS */}
                    <div>
                        <div className="bg-slate-100 p-2 border-b-2 border-slate-300 mb-2 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 uppercase text-sm flex items-center gap-2"><Box size={16}/> Ferragens</h3>
                            <button onClick={() => setShowHardwareModal(true)} className="no-print text-[10px] text-blue-600 font-bold hover:underline">Editar</button>
                        </div>
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200 text-[10px]">
                                <tr>
                                    <th className="p-2 text-center w-10 border-r">Item</th>
                                    <th className="p-2 text-left border-r">Descrição</th>
                                    <th className="p-2 text-center w-10">Qtd</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeProject.hardware.map((hw, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="p-2 text-center border-r">
                                            <div className="w-6 h-6 mx-auto border rounded flex items-center justify-center bg-white p-0.5">{getHardwareIcon(hw.nome)}</div>
                                        </td>
                                        <td className="p-2 font-medium text-slate-700 border-r">
                                            <div className="font-bold leading-tight">{hw.nome}</div>
                                            <div className="text-[9px] text-slate-400 leading-tight">{hw.uso}</div>
                                        </td>
                                        <td className="p-2 text-center font-black text-slate-900 bg-slate-50/30">{hw.quantidade}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="absolute bottom-[10mm] left-[10mm] right-[10mm] border-t-2 border-slate-200 pt-4 text-center">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Suporte Técnico: Smart 3D Cut Pro</p>
                </div>
            </div>

            {/* PÁGINA 2+: PASSOS DE MONTAGEM */}
            <div className="bg-white shadow-xl print:shadow-none p-[10mm] min-h-[297mm] relative">
                <div className="border-b-2 border-slate-200 pb-4 mb-8 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Detalhamento dos Passos</h2>
                    <button onClick={addStep} className="no-print flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md">
                        <PlusCircle size={16}/> Novo Passo
                    </button>
                </div>

                <div className="space-y-12">
                    {activeProject.steps.map((step, index) => (
                        <div key={step.id} className="break-inside-avoid border-b border-slate-100 pb-8 last:border-0">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <input 
                                        type="text" 
                                        value={step.title}
                                        onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                                        className="text-lg font-black text-slate-900 uppercase bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full mb-1"
                                        placeholder="Título do Passo"
                                    />
                                    <textarea 
                                        value={step.description}
                                        onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                                        className="w-full text-sm text-slate-600 bg-transparent resize-none outline-none border border-transparent hover:border-slate-200 focus:border-blue-500 rounded p-1 font-medium"
                                        rows={2}
                                        placeholder="Descreva as instruções deste passo..."
                                    />
                                </div>
                                <button onClick={() => removeStep(step.id)} className="no-print text-slate-300 hover:text-red-500 ml-4 p-1">
                                    <Trash size={18}/>
                                </button>
                            </div>

                            <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 min-h-[350px] flex items-center justify-center relative group overflow-hidden print:border-slate-100 print:bg-white">
                                {step.image ? (
                                    <>
                                        <img src={step.image} className="max-w-full max-h-[450px] object-contain" alt={step.title} />
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity no-print flex gap-2">
                                            <label className="bg-white text-slate-700 p-2.5 rounded-xl shadow-xl cursor-pointer hover:text-blue-600 active:scale-95 transition-all">
                                                <Camera size={20}/>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleStepImageUpload(e, step.id)} />
                                            </label>
                                            <button onClick={() => updateStep(step.id, 'image', '')} className="bg-white text-red-600 p-2.5 rounded-xl shadow-xl hover:bg-red-50 active:scale-95 transition-all">
                                                <Trash size={20}/>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center text-slate-400 hover:text-blue-600 transition-all p-12 group/label no-print">
                                        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover/label:scale-110 transition-transform">
                                            <ImageIcon size={32} className="opacity-50"/>
                                        </div>
                                        <span className="font-black text-xs uppercase tracking-widest">Upload de Imagem</span>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 italic">Click ou Arraste o diagrama aqui</p>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleStepImageUpload(e, step.id)} />
                                    </label>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- MODAL DE FERRAGENS (VINCULADO AO ATIVO) --- */}
        {showHardwareModal && (
            <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-md no-print">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                        <div>
                            <h3 className="font-black text-xl uppercase italic tracking-tighter flex items-center gap-3"><Settings2 className="text-blue-600"/> Ajustar Ferragens</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manual: {activeProject.name}</p>
                        </div>
                        <button onClick={() => setShowHardwareModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="text-slate-500"/></button>
                    </div>
                    <div className="flex-1 flex overflow-hidden">
                        {/* Catálogo */}
                        <div className="w-80 border-r bg-slate-50 p-6 overflow-y-auto custom-scrollbar">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Catálogo Geral</h4>
                            <div className="space-y-2">
                                {hardwareRegistry.map(h => (
                                    <button key={h.id} onClick={() => addHardware(h)} className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md text-left group transition-all active:scale-[0.98]">
                                        <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-lg p-1.5 transition-transform group-hover:rotate-12">{getHardwareIcon(h.name)}</div>
                                        <span className="text-xs font-black text-slate-700 flex-1 uppercase tracking-tight">{h.name}</span>
                                        <PlusCircle size={18} className="text-blue-500 opacity-20 group-hover:opacity-100 transition-opacity"/>
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* Lista Atual */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm">
                                <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b">
                                    <tr><th className="text-left py-3">Componente</th><th className="w-24 text-center">Quantidade</th><th className="text-left pl-6">Aplicação / Nota</th><th className="w-10"></th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeProject.hardware.map((item, idx) => (
                                        <tr key={idx} className="group">
                                            <td className="py-4 font-black text-slate-800 uppercase text-xs">{item.nome}</td>
                                            <td className="py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => updateHardware(idx, 'quantidade', Math.max(1, item.quantidade - 1))} className="p-1 text-slate-300 hover:text-blue-500 transition-colors"><MinusCircle size={16}/></button>
                                                    <input type="number" value={item.quantidade} onChange={(e) => updateHardware(idx, 'quantidade', Number(e.target.value))} className="w-12 bg-slate-100 border-none rounded-lg py-1 text-center font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"/>
                                                    <button onClick={() => updateHardware(idx, 'quantidade', item.quantidade + 1)} className="p-1 text-slate-300 hover:text-blue-500 transition-colors"><PlusCircle size={16}/></button>
                                                </div>
                                            </td>
                                            <td className="py-4 pl-6">
                                                <input type="text" value={item.uso} onChange={(e) => updateHardware(idx, 'uso', e.target.value)} placeholder="Onde usar..." className="w-full bg-slate-50 border-none rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-500 italic outline-none focus:ring-2 focus:ring-slate-300"/>
                                            </td>
                                            <td className="py-4 text-center">
                                                <button onClick={() => removeHardware(idx)} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="p-6 border-t bg-slate-50 flex justify-end">
                        <button onClick={() => setShowHardwareModal(false)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">Salvar Alterações</button>
                    </div>
                </div>
            </div>
        )}
            </>
        )}
    </div>
  );
};
