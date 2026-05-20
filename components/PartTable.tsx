
import React, { useState, useMemo } from 'react';
import { ProcessedPart, RegisteredMaterial, EdgeBanding, EdgeType, RegisteredEdgeBand } from '../types';
import { Trash2, Copy, PlusCircle, Palette, ArrowLeftRight, Wrench, FileOutput, SlidersHorizontal, ChevronLeft, ChevronRight, RotateCw, Wind, Filter } from 'lucide-react';

interface PartTableProps {
  parts: ProcessedPart[];
  availableMaterials: RegisteredMaterial[];
  availableEdgeBands: RegisteredEdgeBand[];
  onUpdatePart: (id: string, field: string, value: any) => void;
  onDeletePart: (id: string) => void;
  onMoveToHardware: (id: string) => void;
  onDuplicatePart: (id: string) => void;
  onAddPart: () => void;
}

// Helper checkbox component
const EdgeCheckbox = ({ checked, onClick, colorClass = "bg-slate-700 border-slate-700" }: { checked: boolean; onClick: () => void, colorClass?: string }) => (
    <div 
        onClick={onClick}
        className={`w-4 h-4 border rounded cursor-pointer transition-all flex items-center justify-center ${
            checked 
                ? colorClass 
                : 'bg-white border-slate-300 hover:border-blue-400 shadow-sm'
        }`}
    >
        {checked && <div className="w-2 h-2 bg-white rounded-sm"></div>}
    </div>
);

interface EdgeSelectorProps {
  edges: EdgeBanding;
  onUpdate: (edges: EdgeBanding) => void;
  type: 'comp' | 'larg';
  showLabels?: boolean;
}

const EdgeSelector: React.FC<EdgeSelectorProps> = ({ edges, onUpdate, type, showLabels = true }) => {
    
    const handleToggle = (side: keyof EdgeBanding, edgeType: EdgeType) => {
        const current = edges[side];
        const newType = current === edgeType ? 'none' : edgeType;
        onUpdate({ ...edges, [side]: newType });
    };

    const side1 = type === 'comp' ? 'long1' : 'short1';
    const side2 = type === 'comp' ? 'long2' : 'short2';

    return (
        <div className="flex flex-col gap-1.5 py-1">
            {/* ROW 1: SOLID */}
            <div className="flex items-center gap-2">
                {showLabels && <span className="text-[8px] font-black text-slate-400 uppercase w-10 text-right leading-none">Sólida</span>}
                <div className="flex gap-1.5">
                    <EdgeCheckbox checked={edges[side1] === 'solid'} onClick={() => handleToggle(side1, 'solid')} />
                    <EdgeCheckbox checked={edges[side2] === 'solid'} onClick={() => handleToggle(side2, 'solid')} />
                </div>
            </div>

            {/* ROW 2: DASHED */}
            <div className="flex items-center gap-2">
                {showLabels && <span className="text-[8px] font-black text-blue-500 uppercase w-10 text-right leading-none">Pont.</span>}
                <div className="flex gap-1.5">
                    <EdgeCheckbox checked={edges[side1] === 'dashed'} onClick={() => handleToggle(side1, 'dashed')} colorClass="bg-blue-600 border-blue-600" />
                    <EdgeCheckbox checked={edges[side2] === 'dashed'} onClick={() => handleToggle(side2, 'dashed')} colorClass="bg-blue-600 border-blue-600" />
                </div>
            </div>

            {/* ROW 3: COLORED */}
            <div className="flex items-center gap-2">
                {showLabels && <span className="text-[8px] font-black text-amber-500 uppercase w-10 text-right leading-none whitespace-nowrap">Cor</span>}
                <div className="flex gap-1.5">
                    <EdgeCheckbox checked={edges[side1] === 'colored'} onClick={() => handleToggle(side1, 'colored')} colorClass="bg-amber-500 border-amber-500" />
                    <EdgeCheckbox checked={edges[side2] === 'colored'} onClick={() => handleToggle(side2, 'colored')} colorClass="bg-amber-500 border-amber-500" />
                </div>
            </div>
        </div>
    );
};

export const PartTable: React.FC<PartTableProps> = ({ parts, availableMaterials, availableEdgeBands, onUpdatePart, onDeletePart, onMoveToHardware, onDuplicatePart, onAddPart }) => {
  const [activeTab, setActiveTab] = useState('Todas');
  const [materialFilter, setMaterialFilter] = useState('all');

  const materialsInProject = useMemo(() => {
    const mats = new Set(parts.map(p => p.materialName));
    return Array.from(mats).sort();
  }, [parts]);

  const filteredParts = useMemo(() => {
    return parts.filter(p => {
        const matchesMaterial = materialFilter === 'all' || p.materialName === materialFilter;
        if (!matchesMaterial) return false;

        if (activeTab === 'Todas') return true;
        
        const name = (p.finalName || '').toLowerCase();
        const cat = (p.groupCategory || '').toLowerCase();
        
        if (activeTab === 'estruturas') {
            return ['lateral', 'base', 'tampo', 'rodape', 'rodapé', 'travessa', 'divisoria', 'divisória', 'montante', 'ripa'].some(k => name.includes(k) || cat.includes(k));
        }
        if (activeTab === 'portas') {
            return ['porta', 'frente'].some(k => name.includes(k) || cat.includes(k)) && !name.includes('gaveta');
        }
        if (activeTab === 'gavetas') {
            return ['gaveta'].some(k => name.includes(k) || cat.includes(k));
        }
        if (activeTab === 'prateleiras') {
            return ['prateleira'].some(k => name.includes(k) || cat.includes(k));
        }
        if (activeTab === 'fundos') {
            return ['fundo'].some(k => name.includes(k) || cat.includes(k));
        }
        if (activeTab === 'diversos') {
            const isStructural = ['lateral', 'base', 'tampo', 'rodape', 'rodapé', 'travessa', 'divisoria', 'divisória', 'montante', 'ripa'].some(k => name.includes(k) || cat.includes(k));
            const isPorta = ['porta', 'frente'].some(k => name.includes(k) || cat.includes(k)) && !name.includes('gaveta');
            const isGaveta = ['gaveta'].some(k => name.includes(k) || cat.includes(k));
            const isPrateleira = ['prateleira'].some(k => name.includes(k) || cat.includes(k));
            const isFundo = ['fundo'].some(k => name.includes(k) || cat.includes(k));
            return !isStructural && !isPorta && !isGaveta && !isPrateleira && !isFundo;
        }
        return true;
    });
  }, [parts, activeTab, materialFilter]);

  return (
    <div className="flex flex-col gap-4 w-full">
        {/* TABS FOR VIEW FILTERING */}
        <div className="flex items-center gap-2 mb-2 h-10">
            {[
                { id: 'Todas', label: 'Todas as Peças' },
                { id: 'estruturas', label: 'Estruturas' },
                { id: 'portas', label: 'Portas' },
                { id: 'gavetas', label: 'Gavetas' },
                { id: 'prateleiras', label: 'Prateleiras' },
                { id: 'fundos', label: 'Fundos' },
                { id: 'diversos', label: 'Diversos' }
            ].map((tab) => (
                <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tight transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600'}`}
                >
                    {tab.label}
                </button>
            ))}
            <div className="flex-1"></div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                <Filter size={12} className="text-slate-400" />
                <select 
                    value={materialFilter || 'all'}
                    onChange={(e) => setMaterialFilter(e.target.value)}
                    className="text-[10px] font-black uppercase text-slate-600 outline-none bg-transparent cursor-pointer"
                >
                    <option value="all">Materiais: Todos</option>
                    {materialsInProject.map(mat => (
                        <option key={mat} value={mat}>{mat}</option>
                    ))}
                </select>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-slate-50">
                <FileOutput size={14}/> Exportar Planilha
            </button>
            <button className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-blue-600">
                <SlidersHorizontal size={16}/>
            </button>
        </div>

        <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-700 table-fixed border-collapse min-w-[1000px]">
                <thead className="bg-[#f8f9fb] text-[8px] uppercase text-slate-400 font-black leading-tight border-b border-slate-200">
                <tr>
                    <th className="px-2 py-4 w-[35px] text-center border-r border-slate-100">#</th>
                    <th className="px-2 py-4 w-[70px] border-r border-slate-100">Projeto</th>
                    <th className="px-2 py-4 w-[90px] border-r border-slate-100">Material</th>
                    <th className="px-2 py-4 w-[120px] border-r border-slate-100">Nome da Peça</th> 
                    <th className="px-1.5 py-4 w-[50px] text-right border-r border-slate-100">Comp.</th>
                    <th className="px-1.5 py-4 w-[50px] text-right border-r border-slate-100">Larg.</th>
                    <th className="px-1 py-4 w-[35px] text-center border-r border-slate-100">Esp.</th>
                    <th className="px-1 py-4 w-[35px] text-center border-r border-slate-100">Inv.</th>
                    <th className="px-1 py-4 w-[35px] text-center border-r border-slate-100">Veio</th>
                    <th className="px-1 py-4 w-[75px] text-center border-r border-slate-100">Fitas (C)</th>
                    <th className="px-1 py-4 w-[45px] text-center border-r border-slate-100">Fitas (L)</th>
                    <th className="px-1 py-4 w-[35px] text-center border-r border-slate-100">Qtd.</th>
                    <th className="px-2 py-4 w-[90px] border-r border-slate-100">Cor</th>
                    <th className="px-2 py-4 w-[80px] border-r border-slate-100">Obs.</th> 
                    <th className="px-2 py-4 w-[75px] text-center">Ações</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                {filteredParts.map((part) => {
                    const hasColoredEdge = 
                        part.edges?.long1 === 'colored' || 
                        part.edges?.long2 === 'colored' || 
                        part.edges?.short1 === 'colored' || 
                        part.edges?.short2 === 'colored';

                    const mat = availableMaterials.find(m => m.name === part.materialName);

                    return (
                    <tr key={part.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-2 py-4 text-center font-bold text-slate-300 text-[10px] border-r border-slate-50">
                        {part.displayId}
                    </td>

                    <td className="px-2 py-4 border-r border-slate-50">
                        <input 
                            type="text" 
                            value={part.sourceFile}
                            onChange={(e) => onUpdatePart(part.id, 'sourceFile', e.target.value)}
                            className="bg-transparent text-[10px] font-black text-blue-600 uppercase outline-none truncate w-full"
                        />
                    </td>

                    <td className="px-2 py-4 border-r border-slate-50">
                        <select 
                            value={part.materialName}
                            onChange={(e) => {
                                onUpdatePart(part.id, 'materialName', e.target.value);
                                const found = availableMaterials.find(m => m.name === e.target.value);
                                if (found) {
                                    onUpdatePart(part.id, 'thickness', found.thickness);
                                }
                            }}
                            className="w-full bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-[10px] font-bold text-slate-700 outline-none truncate cursor-pointer hover:border-blue-300"
                        >
                            {!availableMaterials.some(m => m.name === part.materialName) && (
                                <option value={part.materialName}>{part.materialName}</option>
                            )}
                            {availableMaterials.map(mat => (
                                <option key={mat.id} value={mat.name}>{mat.name}</option>
                            ))}
                        </select>
                    </td>
                    
                    <td className="px-2 py-4 border-r border-slate-50">
                        <input 
                            type="text" 
                            value={part.finalName}
                            onChange={(e) => onUpdatePart(part.id, 'finalName', e.target.value)}
                            className="bg-transparent text-[11px] font-black text-slate-800 outline-none w-full truncate"
                        />
                    </td>

                    <td className="px-1.5 py-4 text-right border-r border-slate-50">
                        <input 
                            type="number"
                            value={part.dimensions.width}
                            onChange={(e) => onUpdatePart(part.id, 'width', Number(e.target.value))}
                            className="w-full text-right text-slate-500 font-bold bg-transparent outline-none text-[10px]"
                        />
                    </td>
                    
                    <td className="px-1.5 py-4 text-right border-r border-slate-50">
                        <input 
                            type="number"
                            value={part.dimensions.height}
                            onChange={(e) => onUpdatePart(part.id, 'height', Number(e.target.value))}
                            className="w-full text-right text-slate-500 font-bold bg-transparent outline-none text-[10px]"
                        />
                    </td>
                    
                    <td className="px-1 py-4 text-center border-r border-slate-50">
                        <input 
                            type="number"
                            value={part.dimensions.thickness}
                            onChange={(e) => onUpdatePart(part.id, 'thickness', e.target.value)}
                            className="w-full text-center font-black text-amber-500 bg-transparent outline-none text-[10px]"
                        />
                    </td>

                    <td className="px-1 py-4 text-center border-r border-slate-50">
                        <button 
                            onClick={() => onUpdatePart(part.id, 'invertDimensions', !part.invertDimensions)}
                            className={`p-1 rounded-lg transition-all ${part.invertDimensions ? 'bg-blue-100 text-blue-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                            title="Inverter Comprimento x Largura"
                        >
                            <RotateCw size={12} />
                        </button>
                    </td>

                    <td className="px-1 py-4 text-center border-r border-slate-50">
                        <button 
                            onClick={() => onUpdatePart(part.id, 'hasGrain', !part.hasGrain)}
                            className={`p-1 rounded-lg transition-all ${part.hasGrain ? 'bg-orange-100 text-orange-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                            title="Respeitar Veio (Comprimento horizontal)"
                        >
                            <Wind size={12} />
                        </button>
                    </td>
                    
                    {/* EDGE SELECTORS */}
                    <td className="px-1 py-2 border-r border-slate-50">
                        <EdgeSelector 
                            edges={part.edges} 
                            onUpdate={(newEdges) => onUpdatePart(part.id, 'edges', newEdges)}
                            type="comp"
                        />
                    </td>
                    <td className="px-1 py-2 border-r border-slate-50">
                        <EdgeSelector 
                            edges={part.edges} 
                            onUpdate={(newEdges) => onUpdatePart(part.id, 'edges', newEdges)}
                            type="larg"
                            showLabels={false}
                        />
                    </td>
                    
                    <td className="px-1 py-4 text-center border-r border-slate-50">
                        <input 
                            type="number" 
                            min="1"
                            value={part.quantity}
                            onChange={(e) => onUpdatePart(part.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="bg-blue-50/50 border border-blue-100 rounded-lg w-8 py-1.5 text-center text-blue-700 font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs"
                        />
                    </td>

                    <td className="px-2 py-4 border-r border-slate-50">
                        <select
                            value={part.detectedEdgeColor || ''}
                            onChange={(e) => onUpdatePart(part.id, 'detectedEdgeColor', e.target.value)}
                            className={`w-full bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-[9px] font-bold text-slate-600 outline-none truncate hover:border-blue-300 ${!hasColoredEdge ? 'opacity-40' : ''}`}
                        >
                            <option value="">{part.detectedEdgeColor ? 'Remover Fita' : 'Selecionar Cor...'}</option>
                            {availableEdgeBands.map(eb => (
                                <option key={eb.id} value={eb.name}>{eb.name}</option>
                            ))}
                            {/* Se o material for padrão e não estiver na lista, mostra como opção */}
                            {part.materialName && !availableEdgeBands.some(eb => eb.name === part.materialName) && (
                                <option value={part.materialName}>{part.materialName} (Auto)</option>
                            )}
                        </select>
                    </td>

                    <td className="px-2 py-4 border-r border-slate-50">
                        <input 
                            type="text"
                            value={part.notes?.filter(n => !n.startsWith('Fita')).join(', ') || ''}
                            onChange={(e) => {
                                const otherNotes = part.notes?.filter(n => n.startsWith('Fita')) || [];
                                const userNote = e.target.value;
                                onUpdatePart(part.id, 'notes', userNote ? [...otherNotes, userNote] : otherNotes);
                            }}
                            placeholder="Obs..."
                            className="w-full bg-transparent text-[9px] font-medium text-slate-500 italic outline-none border-b border-transparent focus:border-blue-300 transition-all"
                        />
                    </td>

                    <td className="px-2 py-4">
                        <div className="flex items-center justify-center gap-1">
                            <button 
                                onClick={() => onMoveToHardware(part.id)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100 group/move relative"
                                title="Mover para Extração de Ferragens"
                            >
                                <Wrench size={14} />
                            </button>
                            <button 
                                onClick={() => onDuplicatePart(part.id)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100"
                            >
                                <Copy size={14} />
                            </button>
                            <button 
                                onClick={() => onDeletePart(part.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </td>
                    </tr>
                )})}
                </tbody>
            </table>
        </div>
        
        <div className="flex justify-between items-center py-4 bg-[#f8f9fb] px-6 rounded-2xl border border-slate-200">
            <span className="text-xs font-black text-slate-400 uppercase tracking-tight">Total: {filteredParts.length} {filteredParts.length === 1 ? 'peça' : 'peças'} extraídas</span>
        </div>

        <button 
            onClick={onAddPart}
            className="flex items-center justify-center gap-2 w-full py-4 bg-white border border-dashed border-slate-300 rounded-2xl text-slate-500 font-black uppercase text-[10px] tracking-widest hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
        >
            <PlusCircle size={18} />
            Adicionar Peça Manualmente
        </button>
    </div>
  );
};
