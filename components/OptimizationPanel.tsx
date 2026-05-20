
import React, { useState, useMemo, useEffect } from 'react';
import { ProcessedPart, OptimizationConfig, OptimizationResult, RegisteredHardware, PlacedPart } from '../types';
import { generateCuttingPlan } from '../services/optimizerEngine';
import { CuttingLayoutViewer } from './CuttingLayoutViewer';
import { PrintPreview } from './PrintPreview';
import { Settings, Scissors, RefreshCw, Layers, BarChart3, Tag, Timer, Maximize, Printer, CheckCircle2, AlertCircle, ArrowDown, ArrowRight, ArrowRightLeft, RotateCw, Ban, FileText, FolderOpen, Hash, ArrowUp } from 'lucide-react';

interface OptimizationPanelProps {
  parts: ProcessedPart[];
  projectName: string;
  hardwareRegistry: RegisteredHardware[];
  globalConfig: OptimizationConfig; 
  onOptimizationComplete?: (result: OptimizationResult) => void;
  result?: OptimizationResult | null; // Propriedade adicionada para persistência
}

const SummaryCard = ({ icon, label, value, subValue, color = "blue" }: { icon: React.ReactNode, label: string, value: string, subValue?: string, color?: string }) => (
    <div className={`bg-white border border-slate-200 p-4 rounded-2xl shadow-sm relative overflow-hidden group hover:border-${color}-300 transition-all`}>
        <div className={`text-${color}-600 mb-1`}>{icon}</div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
        {subValue && <p className="text-[10px] font-bold text-emerald-600 mt-1">{subValue}</p>}
    </div>
);

// --- HELPER PARA GERAR ORDEM AUTOMÁTICA ---
const generateAutoOrderId = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    
    // Chave para armazenar a sequência diária: DDMMAA (Ex: 050226)
    const todayKey = `${day}${month}${year}`; 
    const STORAGE_KEY = 'cutlist_order_seq';
    
    let seq = 0;
    
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.date === todayKey) {
                seq = data.count + 1;
            } else {
                seq = 0;
            }
        }
    } catch (e) {
        console.warn("Erro ao ler sequência de ordem", e);
    }
    
    const id = String(seq).padStart(2, '0');
    return `${day}${month}${id}-${year}`;
};

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({ parts, projectName, hardwareRegistry, onOptimizationComplete, globalConfig, result: initialResult }) => {
  
  // Inicializa com o resultado vindo das props (se houver)
  const [result, setResult] = useState<OptimizationResult | null>(initialResult || null);

  // INICIALIZAÇÃO DA ABA: Se já existe resultado (via props), vai direto para 'layout'
  const [activeTab, setActiveTab] = useState<'config' | 'layout' | 'labels' | 'globalList'>(() => initialResult ? 'layout' : 'config');

  const [sheetDims, setSheetDims] = useState({ 
      width: globalConfig.sheetWidth, 
      height: globalConfig.sheetHeight 
  });
  
  const [localSettings, setLocalSettings] = useState({
      cutDirection: globalConfig.cutDirection || 'auto',
      allowRotation: globalConfig.allowRotation ?? true,
      ignoreGrain: globalConfig.ignoreGrain ?? false,
      forceOrientation: globalConfig.forceOrientation || 'auto'
  });

  // Sincroniza se a prop mudar externamente (embora neste app o componente seja remontado)
  useEffect(() => {
      if (initialResult) {
          setResult(initialResult);
      }
  }, [initialResult]);

  // Se o resultado mudar localmente (nova geração), vai para layout
  useEffect(() => {
      if (result) setActiveTab('layout');
  }, [result]);

  // --- REMAPPING LOGIC: SEQUENTIAL IDs (GLOBAL) ---
  const remappedResult = useMemo(() => {
      if (!result) return null;

      // Helper to resolve project name
      const getProject = (p: { sourceFile?: string }) => p.sourceFile || projectName || "Geral";

      // 1. Collect all unique parts (Project + DisplayID)
      const uniqueParts = new Set<string>();
      const allParts = [
          ...result.sheets.flatMap(s => s.parts),
          ...(result.unplacedParts || [])
      ];

      allParts.forEach(p => {
          const proj = getProject(p);
          uniqueParts.add(`${proj}:::${p.displayId}`);
      });

      // 2. Sort them to determine the sequence
      const sortedKeys = Array.from(uniqueParts).sort((a, b) => {
          const [projA, idA] = a.split(':::');
          const [projB, idB] = b.split(':::');
          
          if (projA !== projB) return projA.localeCompare(projB);
          
          // Numeric sort for IDs
          const numA = parseInt(idA);
          const numB = parseInt(idB);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
      });

      // 3. Create Map
      const idMap = new Map<string, string>();
      sortedKeys.forEach((key, index) => {
          idMap.set(key, (index + 1).toString());
      });

      // 4. Clone and Update Result
      const newSheets = result.sheets.map(sheet => ({
          ...sheet,
          parts: sheet.parts.map(p => {
              const key = `${getProject(p)}:::${p.displayId}`;
              const newId = idMap.get(key) || p.displayId;
              return { ...p, displayId: newId };
          })
      }));

      const newUnplaced = (result.unplacedParts || []).map(p => {
           const key = `${getProject(p)}:::${p.displayId}`;
           const newId = idMap.get(key) || p.displayId;
           return { ...p, displayId: newId };
      });

      return {
          ...result,
          sheets: newSheets,
          unplacedParts: newUnplaced
      };
  }, [result, projectName]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  
  const [projectOrder, setProjectOrder] = useState<string>(generateAutoOrderId);
  const [loadingMsg, setLoadingMsg] = useState('');

  useEffect(() => {
      setSheetDims({ width: globalConfig.sheetWidth, height: globalConfig.sheetHeight });
  }, [globalConfig.sheetWidth, globalConfig.sheetHeight]);

  const getMaterialKey = (p: ProcessedPart) => `${p.materialName} - ${p.dimensions.thickness}mm`;

  const materials = useMemo(() => {
    const map = new Map<string, number>();
    parts.forEach(p => {
        const key = getMaterialKey(p);
        map.set(key, (map.get(key) || 0) + p.quantity);
    });
    return Array.from(map.entries()).map(([key, count]) => ({ key, count }));
  }, [parts]);

  useEffect(() => {
    if (materials.length === 0) {
        setSelectedMaterial('');
        return;
    }
    const isValid = materials.some(m => m.key === selectedMaterial);
    if (!isValid || !selectedMaterial) {
        setSelectedMaterial(materials[0].key);
    }
  }, [materials, selectedMaterial]);

  const getSelectedMaterialInfo = () => {
      if (!selectedMaterial) return { name: '', thickness: 0 };
      const parts = selectedMaterial.split(' - ');
      const name = parts[0];
      const thicknessStr = parts[1] || '0mm';
      const thickness = parseFloat(thicknessStr.replace('mm', ''));
      return { name, thickness };
  };

  const handleGenerate = () => {
    if (!selectedMaterial) {
        alert("Selecione um material para otimizar.");
        return;
    }
    
    // Persistência de Ordem
    try {
        const match = projectOrder.match(/^(\d{2})(\d{2})(\d{2})-(\d{2})$/);
        if (match) {
             const [_, day, month, idStr, year] = match;
             const currentSeq = parseInt(idStr);
             const todayKey = `${day}${month}${year}`;
             if (!isNaN(currentSeq)) {
                 localStorage.setItem('cutlist_order_seq', JSON.stringify({ date: todayKey, count: currentSeq }));
             }
        }
    } catch (e) {}

    setIsGenerating(true);
    
    const msgs = [
        "Testando rotações em 360º...",
        "Forçando encaixe em sobras...",
        "Compactando layout...",
        "Reduzindo cortes...",
        "Gerando visualização..."
    ];
    
    let i = 0;
    const interval = setInterval(() => {
        setLoadingMsg(msgs[i % msgs.length]);
        i++;
    }, 500);

    setTimeout(() => {
        try {
            const activeParts = parts.filter(p => getMaterialKey(p) === selectedMaterial);
            
            if (activeParts.length === 0) {
                throw new Error("Nenhuma peça encontrada para este material.");
            }

            let processedParts = [...activeParts]; 
            let overrideAllowRotation = localSettings.allowRotation;

            if (localSettings.forceOrientation === 'vertical') {
                processedParts = processedParts.map(p => {
                    const dim = p.dimensions;
                    const long = Math.max(dim.width, dim.height);
                    const short = Math.min(dim.width, dim.height);
                    
                    if (dim.width > dim.height) {
                        return {
                            ...p,
                            dimensions: { ...dim, width: short, height: long },
                            edges: { long1: p.edges.short1, long2: p.edges.short2, short1: p.edges.long1, short2: p.edges.long2 }
                        };
                    }
                    return { ...p, dimensions: { ...dim, width: short, height: long } };
                });
                overrideAllowRotation = false;
            } else if (localSettings.forceOrientation === 'horizontal') {
                processedParts = processedParts.map(p => {
                    const dim = p.dimensions;
                    const long = Math.max(dim.width, dim.height);
                    const short = Math.min(dim.width, dim.height);
                    
                    if (dim.height > dim.width) {
                        return {
                            ...p,
                            dimensions: { ...dim, width: long, height: short },
                            edges: { long1: p.edges.short1, long2: p.edges.short2, short1: p.edges.long1, short2: p.edges.long2 }
                        };
                    }
                    return { ...p, dimensions: { ...dim, width: long, height: short } };
                });
                overrideAllowRotation = false;
            }

            const finalConfig: OptimizationConfig = {
                ...globalConfig, 
                sheetWidth: sheetDims.width,
                sheetHeight: sheetDims.height,
                cutDirection: localSettings.cutDirection,
                allowRotation: overrideAllowRotation,
                ignoreGrain: localSettings.ignoreGrain
            };

            const res = generateCuttingPlan(processedParts, finalConfig);
            const matInfo = getSelectedMaterialInfo();
            const resultWithMeta: OptimizationResult = {
                ...res,
                meta: {
                    materialName: matInfo.name,
                    thickness: matInfo.thickness,
                    orderId: projectOrder
                }
            };
            
            setResult(resultWithMeta);
            if (onOptimizationComplete) onOptimizationComplete(resultWithMeta);

            setIsGenerating(false);
            clearInterval(interval);
        } catch (e: any) {
            console.error(e);
            alert("Erro na otimização: " + (e.message || e));
            setIsGenerating(false);
            clearInterval(interval);
        }
    }, 1000); 
  };

  const handlePrintLayout = () => {
    document.body.classList.add('printing-layout');
    setTimeout(() => {
        window.print();
        document.body.classList.remove('printing-layout');
    }, 100);
  };

  const matInfo = getSelectedMaterialInfo();

  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 no-print gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-lg">
                <Scissors size={24} />
            </div>
            <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Plano de Corte Profissional</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motor de Otimização v6.0 (High Density)</p>
            </div>
        </div>
        
        <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200">
            {['config', 'layout', 'globalList', 'labels'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)} 
                disabled={tab !== 'config' && !result}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800 disabled:opacity-30'}`}
              >
                {tab === 'config' ? 'Ajustes' : tab === 'layout' ? 'Mapa' : tab === 'globalList' ? 'Lista' : 'Etiquetas'}
              </button>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl min-h-[500px]">
        {isGenerating ? (
            <div className="h-[500px] flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <RefreshCw className="animate-spin text-blue-600" size={64} />
                    <Scissors className="absolute inset-0 m-auto text-slate-900" size={24} />
                </div>
                <div className="text-center">
                    <p className="text-lg font-black text-slate-800 animate-pulse">{loadingMsg}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Processando geometria...</p>
                </div>
            </div>
        ) : (
            <div className="w-full h-full">
                {activeTab === 'config' && (
                    <div className="p-10 max-w-5xl mx-auto space-y-10">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Layers size={16} /> Material Ativo</h3>
                                <div className="space-y-4">
                                    {materials.length === 0 && (
                                        <div className="text-sm text-slate-400 italic p-2 text-center">Nenhum material encontrado.</div>
                                    )}
                                    {materials.map(m => (
                                        <button 
                                            key={m.key} 
                                            onClick={() => setSelectedMaterial(m.key)}
                                            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${selectedMaterial === m.key ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-white bg-white hover:border-slate-200'}`}
                                        >
                                            <div className="font-black text-slate-800 text-sm">{m.key}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{m.count} peças identificadas</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-8">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                                        <Settings size={14}/> Configurações de Corte
                                    </h4>

                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1"><Hash size={10} /> Ordem / Pedido</label>
                                        <input 
                                            type="text" 
                                            value={projectOrder} 
                                            onChange={e => setProjectOrder(e.target.value)}
                                            placeholder="Ex: 050200-26"
                                            className="w-full bg-slate-100 border-none rounded-xl p-3 font-bold text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono tracking-wide" 
                                        />
                                        <p className="text-[9px] text-slate-400 mt-1 italic">
                                            Gerado automaticamente: DiaMêsID-Ano (Ex: 050200-26)
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase">Largura x Altura da Chapa (mm)</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input type="number" value={sheetDims.width} onChange={e => setSheetDims({...sheetDims, width: Number(e.target.value)})} className="w-full bg-slate-100 border-none rounded-xl p-3 font-bold text-sm text-center" />
                                            <span className="text-slate-300 font-bold">x</span>
                                            <input type="number" value={sheetDims.height} onChange={e => setSheetDims({...sheetDims, height: Number(e.target.value)})} className="w-full bg-slate-100 border-none rounded-xl p-3 font-bold text-sm text-center" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase">Estratégia de Corte (Guilhotina)</label>
                                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mt-1">
                                            <button onClick={() => setLocalSettings({...localSettings, cutDirection: 'auto'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${localSettings.cutDirection === 'auto' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><RefreshCw size={14} /> Auto</button>
                                            <button onClick={() => setLocalSettings({...localSettings, cutDirection: 'vertical'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${localSettings.cutDirection === 'vertical' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><ArrowDown size={14} /> Vert</button>
                                            <button onClick={() => setLocalSettings({...localSettings, cutDirection: 'horizontal'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${localSettings.cutDirection === 'horizontal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><ArrowRight size={14} /> Horiz</button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase">Orientação Global das Peças (Sentido do Veio)</label>
                                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mt-1">
                                            <button 
                                                onClick={() => setLocalSettings({...localSettings, forceOrientation: 'auto'})} 
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${localSettings.forceOrientation === 'auto' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                            >
                                                <RefreshCw size={14} /> Automático
                                            </button>
                                            <button 
                                                onClick={() => setLocalSettings({...localSettings, forceOrientation: 'vertical'})} 
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${localSettings.forceOrientation === 'vertical' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                                title="Força o comprimento (maior lado) a ficar na vertical (Y)"
                                            >
                                                <ArrowUp size={14} /> Vertical (Em Pé)
                                            </button>
                                            <button 
                                                onClick={() => setLocalSettings({...localSettings, forceOrientation: 'horizontal'})} 
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${localSettings.forceOrientation === 'horizontal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                                title="Força o comprimento (maior lado) a ficar na horizontal (X)"
                                            >
                                                <ArrowRight size={14} /> Horizontal (Deitado)
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-1 italic">
                                            * Selecionar vertical ou horizontal desativa a rotação automática para garantir o alinhamento do veio.
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => setLocalSettings({...localSettings, allowRotation: !localSettings.allowRotation})} 
                                            disabled={localSettings.forceOrientation !== 'auto'}
                                            className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all text-xs font-bold ${localSettings.allowRotation ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-400'} ${localSettings.forceOrientation !== 'auto' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                           <RotateCw size={16} /> {localSettings.allowRotation ? 'Rotação Ativada' : 'Rotação Bloqueada'}
                                        </button>
                                        <button onClick={() => setLocalSettings({...localSettings, ignoreGrain: !localSettings.ignoreGrain})} className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all text-xs font-bold ${localSettings.ignoreGrain ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-400'}`}>
                                           <Ban size={16} /> {localSettings.ignoreGrain ? 'Ignorar Veio' : 'Respeitar Veio'}
                                        </button>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <h5 className="text-[9px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                                            Parâmetros de Máquina (Fixos)
                                        </h5>
                                        <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                                            <div>
                                                <span className="block font-bold">Serra:</span> {globalConfig.bladeThickness} mm
                                            </div>
                                            <div>
                                                <span className="block font-bold">Refilo:</span> {globalConfig.margin} mm
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleGenerate}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-4 text-sm uppercase transform active:scale-[0.99]"
                                >
                                    <Scissors size={20} /> Otimizar Plano de Corte
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'layout' && remappedResult && (
                    <div className="p-6 print:p-0">
                        <div className="no-print flex justify-end mb-4">
                             <button onClick={handlePrintLayout} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-black transition-all">
                                <Printer size={16} /> Baixar PDF Visual (Paisagem)
                             </button>
                        </div>
                        <CuttingLayoutViewer 
                            sheets={remappedResult.sheets} 
                            result={remappedResult} 
                            projectName={projectName} 
                            selectedMaterialName={matInfo.name} 
                            projectOrder={projectOrder}
                            materialThickness={matInfo.thickness}
                            colorMode={globalConfig.colorMode}
                            edgeBandStyle={globalConfig.edgeBandStyle || 'solid'}
                        />
                    </div>
                )}

                {activeTab === 'globalList' && remappedResult && (
                    <div className="p-8">
                        <div className="mb-6 flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Lista de Peças Global</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{matInfo.name} - {matInfo.thickness}mm</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-slate-900 leading-none">{remappedResult.sheets.flatMap(s => s.parts).length} <span className="text-xs font-bold text-slate-400">Peças</span></p>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 italic">
                                    <tr>
                                        <th className="p-4 font-black uppercase text-[10px] text-slate-400 text-center w-12">ID</th>
                                        <th className="p-4 font-black uppercase text-[10px] text-slate-400">Descrição da Peça</th>
                                        <th className="p-4 font-black uppercase text-[10px] text-slate-400 text-center">Comp.</th>
                                        <th className="p-4 font-black uppercase text-[10px] text-slate-400 text-center">Larg.</th>
                                        <th className="p-4 font-black uppercase text-[10px] text-slate-400 text-center w-12">Qtd</th>
                                        <th className="p-4 font-black uppercase text-[10px] text-slate-400">Projeto / Origem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {parts
                                        .filter(p => `${p.materialName} - ${p.dimensions.thickness}mm` === selectedMaterial)
                                        .map((p, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 text-center font-black text-slate-800">#{p.displayId}</td>
                                                <td className="p-4 font-bold text-slate-700">{p.finalName}</td>
                                                <td className="p-4 text-center font-mono text-slate-500">{Math.round(p.dimensions.width)}</td>
                                                <td className="p-4 text-center font-mono text-slate-500">{Math.round(p.dimensions.height)}</td>
                                                <td className="p-4 text-center font-black text-blue-600">{p.quantity}</td>
                                                <td className="p-4 text-xs font-bold text-slate-400 uppercase">{p.sourceFile || projectName}</td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'labels' && (
                    <PrintPreview 
                        result={remappedResult} 
                        parts={parts} 
                        projectName={projectName} 
                        projectOrder={projectOrder}
                        materialName={matInfo.name}
                        thickness={matInfo.thickness}
                        edgeBandStyle={globalConfig.edgeBandStyle || 'solid'}
                        hardwareRegistry={hardwareRegistry}
                        defaultOnlyLabels={true}
                    />
                )}
            </div>
        )}
      </div>
    </div>
  );
};
