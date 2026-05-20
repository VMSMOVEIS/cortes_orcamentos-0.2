
import React, { useState, useMemo } from 'react';
import { OptimizationResult, ProcessedPart, PlacedPart, EdgeType, RegisteredHardware, ExtractedComponent } from '../types';
import { SheetSVG } from './CuttingLayoutViewer';
import { Printer, Check, Layers, Maximize, BarChart3, Timer, Loader2, Palette, Download, FolderOpen, LayoutTemplate, AlertTriangle, Hammer, Wrench, Box, Ruler } from 'lucide-react';
import { generateAssemblyJSON } from '../services/assemblyEngine';
import { ScrewDrawing, DowelDrawing, HingeDrawing, MinifixDrawing, NailDrawing } from './HardwareIcons';

interface PrintPreviewProps {
    result: OptimizationResult | null;
    parts: ProcessedPart[];
    projectName: string;
    projectOrder?: string;
    materialName?: string;
    thickness?: number;
    edgeBandStyle?: 'solid' | 'dashed';
    hardwareRegistry: RegisteredHardware[];
    defaultOnlyLabels?: boolean;
    extractedHardware?: ExtractedComponent[];
}

// --- HELPERS ---

// Agrupa peças de uma chapa específica para o resumo da chapa
interface GroupedSheetPart {
    displayId: string;
    width: number;
    height: number;
    count: number;
    name: string;
    originalWidth?: number; 
    originalHeight?: number;
}

const getPartsOnSheet = (sheetParts: PlacedPart[]): GroupedSheetPart[] => {
    const groups: Record<string, GroupedSheetPart> = {};
    
    sheetParts.forEach(p => {
        const key = p.displayId;
        if (!groups[key]) {
            groups[key] = {
                displayId: p.displayId,
                width: p.width,
                height: p.height,
                name: p.name,
                count: 0,
                originalWidth: p.originalDimensions?.width,
                originalHeight: p.originalDimensions?.height
            };
        }
        groups[key].count += 1;
    });

    return Object.values(groups).sort((a, b) => {
        const numA = parseInt(a.displayId);
        const numB = parseInt(b.displayId);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.displayId.localeCompare(b.displayId);
    });
};

const EdgeLine = ({ type }: { type: EdgeType }) => {
    if (type === 'none') return null;
    if (type === 'colored') return <div className="w-full h-[2.5px] bg-orange-500 mb-[1px]"></div>;
    return <div className={`w-full h-[1.5px] ${type === 'dashed' ? 'border-b-2 border-slate-900 border-dashed h-0 bg-transparent' : 'bg-slate-900'}`}></div>;
};

const DimensionWithTapeCell = ({ value, edges }: { value: number, edges: [EdgeType, EdgeType] }) => (
    <div className="flex flex-col items-center justify-center leading-none py-1">
        <span className="font-mono font-bold text-slate-800 text-sm">{Math.round(value)}</span>
        <div className="flex flex-col gap-[1px] w-8 items-center mt-0.5 min-h-[4px]">
            <EdgeLine type={edges[0]} />
            <EdgeLine type={edges[1]} />
        </div>
    </div>
);

const EdgeLineLabel = ({ type }: { type: EdgeType }) => {
    if (type === 'none') return null;
    if (type === 'colored') return <div className="w-[80%] h-[3px] bg-orange-500 rounded-full mb-[1px]"></div>;
    return <div className={`w-[80%] ${type === 'dashed' ? 'h-0 border-t-2 border-black border-dashed' : 'h-[2px] bg-black rounded-full'}`}></div>;
};

const DimensionWithTapeLabel = ({ value, edges, className = "" }: { value: number, edges: [EdgeType, EdgeType], className?: string }) => {
    return (
        <div className={`flex flex-col items-center justify-center leading-none ${className}`}>
            <span className="z-10">{Math.round(value)}</span>
            <div className="flex flex-col gap-[1px] mt-[1px] w-full items-center">
                <EdgeLineLabel type={edges[0]} />
                <EdgeLineLabel type={edges[1]} />
            </div>
        </div>
    );
};

const ReportHeader = ({ title, result, order, material, thickness, pageNum, totalPages }: { title: string, result: OptimizationResult, order?: string, material?: string, thickness?: number, pageNum?: number, totalPages?: number }) => (
    <div className="border-b-2 border-slate-800 pb-2 mb-2 flex justify-between items-end h-[70px] shrink-0">
        <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{title}</h1>
            {pageNum && totalPages && (
                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                    Página {pageNum} de {totalPages}
                </div>
            )}
        </div>
        <div className="text-right">
            {order && <div className="text-sm font-black text-slate-900 uppercase mb-0.5">ORDEM: {order}</div>}
            {(material || thickness) && <div className="text-xs font-bold text-slate-600 uppercase">{material || 'Padrão'} {thickness ? `(${thickness}mm)` : ''}</div>}
            <div className="text-[9px] text-slate-400 mt-0.5 font-medium uppercase">{new Date().toLocaleDateString()}</div>
        </div>
    </div>
);

type PrintRow = 
    | { type: 'header', project: string }
    | { type: 'part', part: PlacedPart, count: number, project: string, isUnplaced?: boolean };

export const PrintPreview: React.FC<PrintPreviewProps> = ({ result, parts, projectName, projectOrder, materialName, thickness, hardwareRegistry, defaultOnlyLabels, extractedHardware = [] }) => {
    const [options, setOptions] = useState({ 
        showCutList: !defaultOnlyLabels, 
        showCuttingPlan: !defaultOnlyLabels, 
        showLabels: !!defaultOnlyLabels,
        showHardwareList: false,
        showAssemblyGuide: false,
        showProductionSheet: false
    });
    const [colorMode, setColorMode] = useState<'colored' | 'gray' | 'white'>('white');
    const [isDownloading, setIsDownloading] = useState(false);

    // Resumo da Extração de Ferragens para os Cards de Métricas
    const hardwareSummary = useMemo(() => {
        const uniqueTypes = new Set(extractedHardware.map(h => `${h.name.toLowerCase()}-${h.dimensions ? h.dimensions.replace(/\s/g, '') : 'STD'}`)).size;
        const totalItems = extractedHardware.reduce((acc, h) => acc + h.quantity, 0);
        
        const getLengthMmLocal = (dimStr?: string): number => {
            if (!dimStr || dimStr === '-' || dimStr === '') return 0;
            const nums = dimStr.split('x').map(s => parseFloat(s)).filter(n => !isNaN(n));
            if (nums.length === 0) return 0;
            return Math.max(...nums);
        };
        const totalLengthMm = extractedHardware.reduce((acc, h) => {
            const len = getLengthMmLocal(h.dimensions);
            return acc + (len * h.quantity);
        }, 0);
        
        return {
            uniqueTypes,
            totalItems,
            linearMeters: totalLengthMm / 1000
        };
    }, [extractedHardware]);

    // Grouping of extracted hardware by project for reporting
    const groupedHardware = useMemo(() => {
        const groups: Record<string, ExtractedComponent[]> = {};
        extractedHardware.forEach(h => {
             const proj = h.sourceFile || "Manual / Desconhecido";
             if (!groups[proj]) groups[proj] = [];
             groups[proj].push(h);
        });
        return groups;
    }, [extractedHardware]);

    // Use result directly (it is already remapped by parent if needed)
    const activeResult = result;

    const groupedGlobalParts = useMemo(() => {
        if (!activeResult) return {};
        
        const grouped: Record<string, { part: ProcessedPart; count: number; isUnplaced: boolean }[]> = {};
        
        // Obter todas as peças colocadas em todas as chapas
        const allPlacedParts = activeResult.sheets.flatMap(s => s.parts);
        
        // Agrupar peças colocadas por ID
        const placedCountMap = new Map<string, number>();
        allPlacedParts.forEach(pp => {
            placedCountMap.set(pp.partId, (placedCountMap.get(pp.partId) || 0) + 1);
        });

        // Filtrar as peças originais que têm pelo menos uma unidade colocada
        parts.forEach(p => {
            const placedCount = placedCountMap.get(p.id) || 0;
            
            // Se a peça saiu no plano de cortes (pelo menos uma unidade)
            if (placedCount > 0) {
                const project = p.sourceFile || projectName || "Geral";
                if (!grouped[project]) grouped[project] = [];
                
                // Adicionamos a peça ao grupo com a contagem real de peças alocadas
                grouped[project].push({ 
                    part: p, 
                    count: placedCount, 
                    isUnplaced: false 
                });
            }
        });

        return grouped;
    }, [parts, activeResult, projectName]);

    const cutListPages = useMemo(() => {
        const rows: PrintRow[] = [];
        const sortedProjects = Object.keys(groupedGlobalParts).sort();
        
        sortedProjects.forEach(proj => {
            rows.push({ type: 'header', project: proj });
            const items = groupedGlobalParts[proj].sort((a, b) => {
                return parseInt(a.part.displayId) - parseInt(b.part.displayId);
            });
            
            items.forEach(item => {
                const p = item.part;
                const mockPlaced: PlacedPart = {
                    uuid: p.id,
                    partId: p.id,
                    displayId: p.displayId,
                    x: 0,
                    y: 0,
                    width: p.dimensions.width,
                    height: p.dimensions.height,
                    rotated: false,
                    name: p.finalName,
                    group: p.groupCategory,
                    edgeCode: '',
                    edges: p.edges,
                    sourceFile: p.sourceFile,
                    notes: p.notes,
                    originalDimensions: { width: p.dimensions.width, height: p.dimensions.height }
                };
                rows.push({ type: 'part', part: mockPlaced, count: item.count, project: proj, isUnplaced: false });
            });
        });

        const pages: PrintRow[][] = [];
        let currentPage: PrintRow[] = [];
        const ITEMS_ON_PAGE_1 = 12; 
        const ITEMS_ON_PAGE_N = 19; 
        let currentLimit = ITEMS_ON_PAGE_1;

        rows.forEach((row) => {
            if (currentPage.length >= currentLimit) {
                pages.push(currentPage);
                currentPage = [];
                currentLimit = ITEMS_ON_PAGE_N;
            }
            currentPage.push(row);
        });
        if (currentPage.length > 0) pages.push(currentPage);
        return pages;
    }, [groupedGlobalParts, activeResult]);

    const labelPages = useMemo(() => {
        if (!activeResult) return [];
        const allParts = activeResult.sheets.flatMap(s => s.parts.map(p => ({...p, sheetId: s.id})));
        allParts.sort((a, b) => {
            const idA = parseInt(a.displayId) || 0;
            const idB = parseInt(b.displayId) || 0;
            if (idA !== idB) return idA - idB;
            return a.displayId.localeCompare(b.displayId);
        });
        const pages = [];
        const ITEMS_PER_PAGE = 18; 
        for (let i = 0; i < allParts.length; i += ITEMS_PER_PAGE) {
            pages.push(allParts.slice(i, i + ITEMS_PER_PAGE));
        }
        return pages;
    }, [activeResult]);

    const toggleLabels = (e: React.MouseEvent) => {
        e.preventDefault(); 
        const isTurningOn = !options.showLabels;
        if (isTurningOn) {
            if (options.showCutList || options.showCuttingPlan) {
                const confirmExclusive = window.confirm("Etiquetas geralmente são impressas em papel adesivo separado.\n\nDeseja imprimir APENAS as etiquetas agora?");
                if (confirmExclusive) setOptions({ showLabels: true, showCutList: false, showCuttingPlan: false, showHardwareList: false, showAssemblyGuide: false, showProductionSheet: false });
                else setOptions({ ...options, showLabels: true });
            } else setOptions({ ...options, showLabels: true });
        } else setOptions({ ...options, showLabels: false });
    };

    if (!activeResult) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <LayoutTemplate size={64} className="mb-4 opacity-50"/>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Nada para imprimir ainda</h3>
                <p className="max-w-md text-center">Gere um plano de corte na aba <strong>Resultados</strong> primeiro.</p>
            </div>
        );
    }

    const handlePrint = () => {
        document.body.classList.add('custom-print-mode');
        if(!options.showCutList) document.body.classList.add('hide-cutlist');
        if(!options.showCuttingPlan) document.body.classList.add('hide-plan');
        if(!options.showLabels) document.body.classList.add('hide-labels');
        if(!options.showHardwareList) document.body.classList.add('hide-hardware');
        if(!options.showAssemblyGuide) document.body.classList.add('hide-assembly');
        if(!options.showProductionSheet) document.body.classList.add('hide-production');
        window.print();
        setTimeout(() => {
             document.body.classList.remove('custom-print-mode', 'hide-cutlist', 'hide-plan', 'hide-labels', 'hide-hardware', 'hide-assembly', 'hide-production');
        }, 500);
    };

    const handleDownloadPDF = async () => {
        // @ts-ignore
        if (!window.html2pdf) { alert("Erro: Biblioteca PDF ausente."); return; }
        setIsDownloading(true);
        document.body.classList.add('custom-print-mode');
        const element = document.getElementById('print-area');
        const fileName = `${projectName.replace(/[^a-z0-9]/gi, '_')}_PlanoCorte.pdf`;
        const opt = {
            margin: 0, filename: fileName, image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };
        try {
             // @ts-ignore
             await window.html2pdf().set(opt).from(element).save();
        } catch (error) { console.error(error); alert("Erro ao gerar PDF."); } 
        finally { document.body.classList.remove('custom-print-mode'); setIsDownloading(false); }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-slate-200 overflow-hidden rounded-xl border border-slate-300">
            <style>{`
                .a4-page-view {
                    width: 210mm; height: 297mm; background: white; margin: 0 auto 2rem auto; padding: 10mm;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15); position: relative; box-sizing: border-box; overflow: hidden;
                }
                .sheet-page-container {
                    width: 210mm; height: 297mm; background: white; margin: 0 auto 2rem auto;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15); position: relative; overflow: hidden;
                    box-sizing: border-box; display: flex; flex-direction: column; padding: 10mm;
                }
                .sheet-content-wrapper { flex: 1; position: relative; width: 100%; overflow: hidden; }
                .rotated-sheet-content {
                    position: absolute; top: 50%; left: 50%; width: 260mm; height: 190mm;
                    transform: translate(-50%, -50%) rotate(90deg); display: flex; gap: 5mm; background: white;
                }
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .a4-page-view, .sheet-page-container {
                        width: 100% !important; height: 297mm !important; margin: 0 !important; padding: 10mm !important;
                        box-shadow: none !important; page-break-after: always !important; break-after: page !important;
                        break-inside: avoid !important; border: none !important; overflow: hidden !important; transform: scale(1) !important;
                        max-width: 210mm !important;
                    }
                    .flex-1.bg-slate-300\\/50 { background: white !important; }
                    ::-webkit-scrollbar { display: none; }
                    .custom-print-mode .print-controls { display: none !important; }
                    .custom-print-mode .a4-page-view { box-shadow: none !important; margin: 0 !important; width: 100% !important; border: none !important; }
                    .hide-cutlist .print-section-cutlist { display: none !important; }
                    .hide-plan .print-section-plan { display: none !important; }
                    .hide-labels .print-section-labels { display: none !important; }
                    .hide-hardware .print-section-hardware { display: none !important; }
                    .hide-assembly .print-section-assembly { display: none !important; }
                    .hide-production .print-section-production { display: none !important; }
                }
            `}</style>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-500/10 custom-scrollbar relative">
                <div id="print-area">
                    {options.showCutList && (
                        <div className="print-section-cutlist">
                            {cutListPages.map((pageRows, pageIndex) => (
                                <div key={`cutlist-page-${pageIndex}`} className="a4-page-view">
                                    <ReportHeader title="Lista de Peças" result={activeResult} order={projectOrder} material={materialName} thickness={thickness} pageNum={pageIndex + 1} totalPages={cutListPages.length} />
                                    {pageIndex === 0 && (
                                        <div className="mb-6 space-y-3 border-b-2 border-slate-100 pb-4">
                                            {/* Resumo de Chapas e Cortes */}
                                            <div className="grid grid-cols-4 gap-3">
                                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-1.5 mb-1"><Layers size={12} className="text-slate-400"/><p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Chapas</p></div>
                                                    <p className="text-xl font-black text-slate-800 leading-none">{activeResult.totalSheets}</p>
                                                </div>
                                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-1.5 mb-1"><Maximize size={12} className="text-slate-400"/><p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Área Útil</p></div>
                                                    <p className="text-xl font-black text-slate-800 leading-none">{(activeResult.totalUsedArea / 1000000).toFixed(2)} m²</p>
                                                </div>
                                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-1.5 mb-1"><BarChart3 size={12} className="text-slate-400"/><p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Eficiência</p></div>
                                                    <p className="text-xl font-black text-emerald-600 leading-none">{((1 - activeResult.globalWastePercentage) * 100).toFixed(1)}%</p>
                                                </div>
                                                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-1.5 mb-1"><Timer size={12} className="text-slate-400"/><p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Tempo Corte Estipulado</p></div>
                                                    <p className="text-xl font-black text-slate-800 leading-none">{Math.ceil(activeResult.estimatedTime)} min</p>
                                                </div>
                                            </div>
                                            
                                            {/* Resumo da Extração (Insumos/Ferragens) */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="p-2.5 bg-amber-50/20 rounded-lg border border-amber-200/50">
                                                    <div className="flex items-center gap-1.5 mb-1"><Layers size={12} className="text-amber-500"/><p className="text-[8px] font-black text-amber-600 uppercase tracking-wider">Tipos Únicos Ferragens</p></div>
                                                    <p className="text-xl font-black text-slate-800 leading-none">{hardwareSummary.uniqueTypes}</p>
                                                </div>
                                                <div className="p-2.5 bg-blue-50/20 rounded-lg border border-blue-200/50">
                                                    <div className="flex items-center gap-1.5 mb-1"><Box size={12} className="text-blue-500"/><p className="text-[8px] font-black text-blue-600 uppercase tracking-wider">Total Itens Ferragens</p></div>
                                                    <p className="text-xl font-black text-slate-800 leading-none">{hardwareSummary.totalItems}</p>
                                                </div>
                                                <div className="p-2.5 bg-emerald-50/20 rounded-lg border border-emerald-200/50">
                                                    <div className="flex items-center gap-1.5 mb-1"><Ruler size={12} className="text-emerald-500"/><p className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">Metragem Linear</p></div>
                                                    <p className="text-xl font-black text-slate-800 leading-none">{hardwareSummary.linearMeters.toFixed(2)}m</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="w-full">
                                        <table className="w-full text-xs text-left border-collapse border border-slate-300">
                                            <thead className="bg-slate-50 border-b border-slate-300">
                                                <tr>
                                                    <th className="p-2 border border-slate-300 w-10 text-center">ID</th>
                                                    <th className="p-2 border border-slate-300">Peça</th>
                                                    <th className="p-2 border border-slate-300 w-14 text-center">Comp.</th>
                                                    <th className="p-2 border border-slate-300 w-14 text-center">Larg.</th>
                                                    <th className="p-2 border border-slate-300 w-10 text-center">Qtd</th>
                                                    <th className="p-2 border border-slate-300 w-80 text-center">Observação</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pageRows.map((row, rIdx) => {
                                                    if (row.type === 'header') {
                                                        return (
                                                            <tr key={`h-${rIdx}`} className="bg-blue-50/50">
                                                                <td colSpan={6} className="p-2 border border-slate-300 font-bold text-blue-800 uppercase text-[10px]">
                                                                    <div className="flex items-center gap-1"><FolderOpen size={10}/> {row.project}</div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    } else {
                                                        const p = row.part;
                                                        const e = p.edges || { long1: 'none', long2: 'none', short1: 'none', short2: 'none' };
                                                        const logicalLength = p.width;
                                                        const logicalWidth = p.height;
                                                        const lengthEdges: [EdgeType, EdgeType] = [e.long1, e.long2];
                                                        const widthEdges: [EdgeType, EdgeType] = [e.short1, e.short2];

                                                        return (
                                                            <tr key={`p-${rIdx}`} className={`${row.isUnplaced ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}>
                                                                <td className={`p-2 border border-slate-300 text-center font-black ${row.isUnplaced ? 'text-red-500' : 'text-slate-800'}`}>
                                                                    {row.isUnplaced && <AlertTriangle size={12} className="inline mr-1" />}{p.displayId}
                                                                </td>
                                                                <td className={`p-2 border border-slate-300 font-bold ${row.isUnplaced ? 'text-red-700' : 'text-slate-700'}`}>{p.name}</td>
                                                                <td className="p-2 border border-slate-300 text-center"><DimensionWithTapeCell value={logicalLength} edges={lengthEdges} /></td>
                                                                <td className="p-2 border border-slate-300 text-center"><DimensionWithTapeCell value={logicalWidth} edges={widthEdges} /></td>
                                                                <td className="p-2 border border-slate-300 text-center font-black">{row.count}</td>
                                                                <td className={`p-2 border border-slate-300 text-xs font-medium ${row.isUnplaced ? 'text-red-600' : 'text-slate-600'}`}>{p.notes?.filter(n => !n.startsWith('Fita')).join(', ')}</td>
                                                            </tr>
                                                        );
                                                    }
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="absolute bottom-8 left-0 right-0 text-center text-[10px] text-slate-400 font-medium">Smart 3D Cut Pro • Página {pageIndex + 1} de {cutListPages.length}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {options.showCuttingPlan && (
                        <div className="print-section-plan">
                            {activeResult.sheets.map((sheet) => {
                                const sheetParts = getPartsOnSheet(sheet.parts);
                                return (
                                    <div key={`sheet-${sheet.id}`} className="sheet-page-container flex flex-col">
                                        <ReportHeader title={`Plano de Corte - Chapa #${sheet.id}`} result={activeResult} order={projectOrder} material={materialName} thickness={thickness} pageNum={sheet.id} totalPages={activeResult.sheets.length} />
                                        <div className="sheet-content-wrapper flex-1 relative">
                                            <div className="rotated-sheet-content">
                                                <div className="flex-1 h-full border-2 border-slate-800 relative bg-white flex items-center justify-center p-2 rounded-lg">
                                                    <div className="w-full h-full">
                                                        <SheetSVG sheet={sheet} colorMode={colorMode} viewBox={`-50 -50 ${sheet.width + 100} ${sheet.height + 100}`} />
                                                    </div>
                                                    <div className="absolute top-2 left-2 text-[12px] font-bold text-slate-500 uppercase bg-white/90 px-2 py-1 rounded border border-slate-200 shadow-sm">
                                                        CHAPA #{sheet.id} <span className="font-normal text-slate-600">| {sheet.width}x{sheet.height}mm</span>
                                                    </div>
                                                </div>
                                                <div className="w-[20%] h-full flex flex-col border border-slate-300 rounded-lg p-2 bg-slate-50/50">
                                                    <div className="border-b-2 border-slate-800 pb-2 mb-2">
                                                        <h2 className="font-black text-2xl uppercase leading-none">Resumo</h2>
                                                        <div className="text-[10px] font-bold text-emerald-600 uppercase leading-tight mt-1 pt-1"><p>{((1 - sheet.wastePercentage) * 100).toFixed(1)}% Aproveitamento</p></div>
                                                    </div>
                                                    <div className="flex-1 overflow-hidden relative">
                                                        <div className="absolute inset-0 overflow-hidden">
                                                            <table className="w-full text-[9px] text-left">
                                                                <thead className="border-b border-slate-300 bg-slate-100">
                                                                    <tr><th className="py-1 px-1 text-center w-6">Qtd</th><th className="py-1 px-1 w-8">ID</th><th className="py-1 px-1">Peça</th><th className="py-1 px-1 text-right">Dim.</th></tr>
                                                                </thead>
                                                                <tbody>
                                                                    {sheetParts.slice(0, 45).map((sp, idx) => (
                                                                        <tr key={idx} className="border-b border-slate-200 last:border-0">
                                                                            <td className="py-1 px-1 text-center font-black bg-slate-100">{sp.count}</td>
                                                                            <td className="py-1 px-1 font-bold text-slate-500">#{sp.displayId}</td>
                                                                            <td className="py-1 px-1 truncate max-w-[60px]" title={sp.name}>{sp.name}</td>
                                                                            <td className="py-1 px-1 text-right font-mono whitespace-nowrap">{Math.round(sp.originalHeight ?? sp.height)}x{Math.round(sp.originalWidth ?? sp.width)}</td>
                                                                        </tr>
                                                                    ))}
                                                                    {sheetParts.length > 45 && (<tr><td colSpan={4} className="text-center italic text-slate-400 py-1">... mais {sheetParts.length - 45}</td></tr>)}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {options.showHardwareList && (
                        <div className="print-section-hardware">
                            <div className="a4-page-view">
                                <ReportHeader title="Lista de Ferragens por Projeto" result={activeResult} order={projectOrder} material={materialName} thickness={thickness} pageNum={1} totalPages={1} />
                                <div className="mt-4 space-y-6">
                                    {Object.entries(groupedHardware).length === 0 ? (
                                        <p className="text-xs text-slate-500 italic">Nenhuma ferragem extraída disponível.</p>
                                    ) : (
                                        Object.entries(groupedHardware).map(([projectName, hwList], idx) => (
                                            <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm">
                                                <h3 className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-1.5 mb-2">
                                                    <FolderOpen size={12} /> {projectName}
                                                </h3>
                                                <table className="w-full text-xs border-collapse border border-slate-200">
                                                    <thead className="bg-slate-50 border-b border-slate-200">
                                                        <tr>
                                                            <th className="p-1 px-2 border border-slate-200 text-center w-12 text-[10px]">Ícone</th>
                                                            <th className="p-1 px-2 border border-slate-200 text-left text-[10px]">Nome / Descrição</th>
                                                            <th className="p-1 px-2 border border-slate-200 text-center w-24 text-[10px]">Dimensões</th>
                                                            <th className="p-1 px-2 border border-slate-200 text-center w-20 text-[10px]">Quantidade</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {hwList.map((hw: any, i: number) => {
                                                            const getIcon = (name: string) => {
                                                                const reg = hardwareRegistry.find(h => h.name.toLowerCase() === name.toLowerCase());
                                                                if (reg && reg.imageUrl) return <img src={reg.imageUrl} className="w-4 h-4 mx-auto object-contain" referrerPolicy="no-referrer" />;
                                                                if (name.includes('Parafuso')) return <ScrewDrawing className="w-4 h-4 mx-auto text-slate-600"/>;
                                                                if (name.includes('Cavilha')) return <DowelDrawing className="w-4 h-4 mx-auto text-amber-700"/>;
                                                                if (name.includes('Dobradiça')) return <HingeDrawing className="w-4 h-4 mx-auto text-slate-600"/>;
                                                                if (name.includes('Minifix')) return <MinifixDrawing className="w-4 h-4 mx-auto text-slate-600"/>;
                                                                if (name.includes('Prego')) return <NailDrawing className="w-4 h-4 mx-auto text-slate-800"/>;
                                                                return <span className="text-[7px] text-slate-400 font-bold">HW</span>;
                                                            };
                                                            return (
                                                                <tr key={i} className="hover:bg-slate-50">
                                                                    <td className="p-1 px-2 border border-slate-200 text-center">{getIcon(hw.name)}</td>
                                                                    <td className="p-1 px-2 border border-slate-200 font-bold text-slate-700">{hw.name}</td>
                                                                    <td className="p-1 px-2 border border-slate-200 text-center font-mono text-slate-500 text-[10px]">{hw.dimensions || '-'}</td>
                                                                    <td className="p-1 px-2 border border-slate-200 text-center font-black text-slate-900">{hw.quantity}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="absolute bottom-6 left-0 right-0 text-center text-[9px] text-slate-400 font-medium italic">Lista gerada com base nos itens extraídos de cada arquivo do projeto.</div>
                            </div>
                        </div>
                    )}

                    {options.showAssemblyGuide && (
                        <div className="print-section-assembly">
                            {(() => {
                                // Tenta carregar manuais salvos no localStorage
                                const savedManuals = localStorage.getItem('cutlist_manuals_v2');
                                const manualProjects = savedManuals ? JSON.parse(savedManuals) : [];
                                
                                // Se não houver nenhum manual salvo, gera um automático como fallback
                                if (manualProjects.length === 0) {
                                    const assemblyData = generateAssemblyJSON(parts, projectName);
                                    return assemblyData.modulos.map((mod: any, mIdx: number) => (
                                        <div key={mIdx} className="a4-page-view">
                                            <ReportHeader title="Guia de Montagem (Auto)" result={activeResult} order={projectOrder} material={materialName} thickness={thickness} pageNum={mIdx + 1} totalPages={assemblyData.modulos.length} />
                                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
                                                <h3 className="font-black text-slate-800 uppercase text-sm mb-1">{mod.nome}</h3>
                                                <p className="text-[10px] text-slate-500">{mod.resumo}</p>
                                            </div>
                                            <div className="space-y-6">
                                                {mod.passos.slice(0, 5).map((passo: any, pIdx: number) => (
                                                    <div key={pIdx} className="border-l-4 border-blue-500 pl-4 py-1">
                                                        <h4 className="font-black text-xs text-blue-800 uppercase">{passo.passo}º Passo: {passo.titulo}</h4>
                                                        <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{passo.descricao_tecnica}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="absolute bottom-8 left-0 right-0 text-center text-[10px] text-slate-400 font-medium italic">Gerado automaticamente. Personalize na aba "Montagem".</div>
                                        </div>
                                    ));
                                }

                                // Se houver manuais salvos, imprime todos eles
                                return manualProjects.map((proj: any, projIdx: number) => (
                                    <div key={proj.id} className="print-project-manual">
                                        {/* PÁGINA DE RESUMO DO MANUAL */}
                                        <div className="a4-page-view">
                                            <ReportHeader title="Manual de Montagem" result={activeResult} order={projectOrder} material={materialName} thickness={thickness} />
                                            <div className="mt-8 mb-12">
                                                <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter border-l-8 border-slate-900 pl-6 py-2">{proj.name}</h2>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 px-8">Projeto Personalizado - {proj.steps.length} Passos Detalhados</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-8">
                                                <div>
                                                    <h3 className="text-xs font-black text-slate-500 uppercase mb-3 flex items-center gap-2"><Hammer size={14}/> Componentes principais</h3>
                                                    <div className="space-y-1">
                                                        {parts.filter(p => (p.sourceFile || "Geral") === proj.name).slice(0, 15).map(p => (
                                                            <div key={p.id} className="flex justify-between text-[10px] border-b border-slate-100 pb-1">
                                                                <span className="font-bold text-slate-700">{p.finalName}</span>
                                                                <span className="font-black text-slate-400">x{p.quantity}</span>
                                                            </div>
                                                        ))}
                                                        {parts.filter(p => (p.sourceFile || "Geral") === proj.name).length > 15 && <p className="text-[9px] text-slate-300 italic pt-1">... e outros componentes</p>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-black text-slate-500 uppercase mb-3 flex items-center gap-2"><Box size={14}/> Ferragens Necessárias</h3>
                                                    <div className="space-y-1">
                                                        {proj.hardware.map((hw: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between text-[10px] border-b border-slate-100 pb-1">
                                                                <span className="font-bold text-slate-700">{hw.nome}</span>
                                                                <span className="font-black text-blue-600">x{hw.quantidade}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-12 left-12 right-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <p className="text-[10px] text-slate-500 leading-relaxed italic text-center">As especificações de hardware e os passos detalhados a seguir foram configurados manualmente para garantir a precisão da montagem.</p>
                                            </div>
                                        </div>

                                        {/* PÁGINAS DE PASSOS (Agrupados para economizar papel se possível, ou um por página como no original) */}
                                        {/* Para manter a qualidade do A4, vamos imprimir os passos com imagens em páginas dedicadas */}
                                        {proj.steps.map((step: any, sIdx: number) => (
                                            <div key={step.id} className="a4-page-view">
                                                <div className="border-b-2 border-slate-100 pb-2 mb-6 flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{proj.name}</span>
                                                    <span className="text-xs font-black text-blue-600">PASSO {sIdx + 1}</span>
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800 uppercase italic mb-2">{step.title}</h3>
                                                <p className="text-sm text-slate-600 mb-8 border-l-4 border-slate-200 pl-4">{step.description}</p>
                                                
                                                <div className="flex-1 border-2 border-slate-50 rounded-3xl bg-slate-50/30 flex items-center justify-center p-4 min-h-[500px]">
                                                    {step.image ? (
                                                        <img src={step.image} className="max-w-full max-h-[180mm] object-contain shadow-2xl rounded-lg" alt={step.title} />
                                                    ) : (
                                                        <div className="text-slate-300 italic text-sm">Nenhum diagrama fornecido para este passo</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ));
                            })()}
                        </div>
                    )}

                    {options.showProductionSheet && (
                        <div className="print-section-production">
                            <div className="a4-page-view">
                                <ReportHeader title="Cronograma / Ficha de Produção" result={activeResult} order={projectOrder} material={materialName} thickness={thickness} />
                                <div className="mt-6 space-y-4">
                                    {(() => {
                                        const saved = localStorage.getItem('cutlist_timeline_v1');
                                        const stages = saved ? JSON.parse(saved) : [
                                            { name: 'CORTE', color: 'bg-orange-500' },
                                            { name: 'COLAGEM', color: 'bg-amber-500' },
                                            { name: 'USINAGEM', color: 'bg-indigo-500' },
                                            { name: 'MONTAGEM', color: 'bg-cyan-500' },
                                            { name: 'LIMPEZA', color: 'bg-slate-500' }
                                        ];

                                        // Calcular tempo de corte idêntico ao do orçamento
                                        const materialsSaved = localStorage.getItem('cutlist_materials_pro_v4');
                                        const materials = materialsSaved ? JSON.parse(materialsSaved) : [];

                                        const configSaved = localStorage.getItem('cutlist_config_pro_v4');
                                        const globalConfig = configSaved ? JSON.parse(configSaved) : { minutesPerSqMeter: 10 };

                                        const groupedParts: Record<string, ProcessedPart[]> = {};
                                        parts.forEach(p => {
                                            const key = `${p.materialName}|${p.dimensions.thickness}`;
                                            if (!groupedParts[key]) groupedParts[key] = [];
                                            groupedParts[key].push(p);
                                        });

                                        let calculatedCorteTime = 0;
                                        Object.entries(groupedParts).forEach(([key, groupParts]) => {
                                            const [matName, thicknessStr] = key.split('|');
                                            const thickness = Number(thicknessStr);
                                            const material = Array.isArray(materials) 
                                                ? materials.find((m: any) => m.name === matName && m.thickness === thickness) 
                                                : null;

                                            const totalAreaM2 = groupParts.reduce((acc, p) => {
                                                return acc + (p.dimensions.width * p.dimensions.height * p.quantity) / 1000000;
                                            }, 0);

                                            const prodTimePerM2 = material?.productionTime || globalConfig.minutesPerSqMeter || 0;
                                            calculatedCorteTime += totalAreaM2 * prodTimePerM2;
                                        });

                                        const cuttingTimeMinutes = Math.round(calculatedCorteTime);

                                        return stages.slice(0, 5).map((stage: any, idx: number) => (
                                            <div key={idx} className="border-2 border-slate-200 rounded-xl overflow-hidden break-inside-avoid">
                                                <div className={`${stage.color || 'bg-slate-900'} text-white px-3 py-1.5 text-[10px] font-black uppercase flex justify-between`}>
                                                    <span>{idx + 1}. {stage.name}</span>
                                                    <span>Responsável: {stage.responsibleWorker || '________________'}</span>
                                                </div>
                                                <div className="p-3 grid grid-cols-4 gap-4 bg-white">
                                                    <div className="border-b border-slate-100">
                                                        <p className="text-[7px] font-black text-slate-400 uppercase">T. Execução</p>
                                                        <p className="text-[10px] font-bold">
                                                            {stage.name?.toUpperCase() === 'CORTE' 
                                                                ? `${cuttingTimeMinutes} min` 
                                                                : (stage.estimatedTime || '_______')}
                                                        </p>
                                                    </div>
                                                    <div className="border-b border-slate-100"><p className="text-[7px] font-black text-slate-400 uppercase">Tempo Real</p><p className="text-[10px] font-bold">{stage.realTime || '_______'}</p></div>
                                                    <div className="border-b border-slate-100"><p className="text-[7px] font-black text-slate-400 uppercase">Finalização</p><p className="text-[10px] font-bold">{stage.finishDate || '_______'}</p></div>
                                                    <div className="border-b border-slate-100"><p className="text-[7px] font-black text-slate-400 uppercase">Retrabalho</p><p className="text-[10px] font-bold">{stage.isRework ? `SIM (${stage.reworkTime})` : 'NÃO / _____'}</p></div>
                                                </div>
                                                {stage.observations && (
                                                    <div className="px-3 pb-2 bg-white">
                                                        <p className="text-[7px] font-black text-slate-300 uppercase italic">Obs: {stage.observations}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ));
                                    })()}
                                </div>
                                
                                <div className="mt-8 grid grid-cols-2 gap-8">
                                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                                        <h4 className="text-[9px] font-black text-slate-400 uppercase mb-4">Notas de Fábrica</h4>
                                        <div className="h-24 border-b border-slate-200 border-dashed"></div>
                                        <div className="h-24 border-b border-slate-200 border-dashed"></div>
                                    </div>
                                    <div className="flex flex-col justify-end gap-12 pb-4">
                                        <div className="text-center border-t border-slate-900 pt-2"><p className="text-[9px] font-black uppercase text-slate-900">Assinatura de Entrega de Turno</p></div>
                                        <div className="text-center border-t border-slate-900 pt-2"><p className="text-[9px] font-black uppercase text-slate-900">Visto Controle de Qualidade</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {options.showLabels && (
                        <div className="print-section-labels">
                            {labelPages.map((pageParts, pIdx) => (
                                <div key={`labels-page-${pIdx}`} className="a4-page-view">
                                    <ReportHeader title="Etiquetas de Identificação" result={activeResult} order={projectOrder} material={materialName} thickness={thickness} pageNum={pIdx + 1} totalPages={labelPages.length} />
                                    <div className="grid grid-cols-3 gap-2">
                                        {pageParts.map((part, idx) => {
                                             const e = part.edges || { long1: 'none', long2: 'none', short1: 'none', short2: 'none' };
                                             const logicalLength = part.width;
                                             const logicalWidth = part.height;
                                             const lengthEdges: [EdgeType, EdgeType] = [e.long1, e.long2];
                                             const widthEdges: [EdgeType, EdgeType] = [e.short1, e.short2];
                                             const notesStr = part.notes?.filter(n => n && !n.includes("NÃO ALOCADA") && !n.startsWith('Fita')).join(', ');

                                             return (
                                                <div key={idx} className="border border-slate-800 rounded-lg p-2 flex flex-col justify-between h-[140px] relative overflow-hidden bg-white shadow-sm">
                                                    <div className="flex justify-between items-start border-b border-slate-300 pb-1 mb-1">
                                                        <div className="flex items-start gap-1.5">
                                                            <span className="text-xl font-black text-slate-900 leading-none mt-0.5">#{part.displayId}</span>
                                                            <div className="flex flex-col justify-center gap-0.5">
                                                                {projectOrder && <span className="text-[8px] font-bold text-slate-900 leading-none uppercase tracking-tighter">ORD: {projectOrder}</span>}
                                                                {materialName && <span className="text-[7px] font-medium text-slate-500 leading-none uppercase tracking-tighter truncate max-w-[65px]" title={materialName}>{materialName}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-right leading-tight"><div className="text-[7px] uppercase font-bold text-slate-500">Chapa</div><div className="text-xs font-black">{part.sheetId}</div></div>
                                                    </div>
                                                    <div className="font-bold text-[10px] truncate uppercase mb-1 leading-tight">{part.name}</div>
                                                    <div className="flex items-center gap-2 justify-center bg-slate-100 rounded p-1">
                                                        <DimensionWithTapeLabel value={logicalLength} edges={lengthEdges} className="text-sm font-black font-mono" /><span className="text-slate-400 text-[10px]">x</span><DimensionWithTapeLabel value={logicalWidth} edges={widthEdges} className="text-sm font-black font-mono" />
                                                    </div>
                                                    {notesStr && <div className="mx-1 mt-1 text-[8px] font-bold text-slate-700 bg-yellow-100 border border-yellow-200 rounded px-1 text-center truncate leading-tight">{notesStr}</div>}
                                                    <div className="mt-auto text-[9px] font-black text-slate-900 uppercase text-center truncate pt-1">{part.sourceFile || projectName}</div>
                                                </div>
                                             );
                                        })}
                                    </div>
                                    <div className="absolute bottom-8 left-0 right-0 text-center text-[10px] text-slate-400 font-medium">Página {pIdx + 1} de {labelPages.length}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col gap-6 shadow-xl z-20 overflow-y-auto custom-scrollbar">
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><Printer size={16} /> Configurar Impressão</h3>
                    <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 mb-3"><Palette size={14} className="text-slate-500"/><label className="text-[10px] font-black text-slate-500 uppercase">Estilo das Peças</label></div>
                        <div className="flex gap-2">
                            <button onClick={() => setColorMode('colored')} className={`flex-1 h-8 rounded-lg border text-[10px] font-bold uppercase ${colorMode === 'colored' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white text-slate-500'}`}>Colorido</button>
                            <button onClick={() => setColorMode('gray')} className={`flex-1 h-8 rounded-lg border text-[10px] font-bold uppercase ${colorMode === 'gray' ? 'bg-slate-200 border-slate-500 text-slate-800' : 'bg-white text-slate-500'}`}>Cinza</button>
                            <button onClick={() => setColorMode('white')} className={`flex-1 h-8 rounded-lg border text-[10px] font-bold uppercase ${colorMode === 'white' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white text-slate-500'}`}>Branco</button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors select-none">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.showCutList ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>{options.showCutList && <Check size={14} />}</div>
                            <input type="checkbox" className="hidden" checked={options.showCutList} onChange={() => setOptions({...options, showCutList: !options.showCutList})} /><span className="text-sm font-bold text-slate-700">1. Lista de Peças</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors select-none">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.showCuttingPlan ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>{options.showCuttingPlan && <Check size={14} />}</div>
                            <input type="checkbox" className="hidden" checked={options.showCuttingPlan} onChange={() => setOptions({...options, showCuttingPlan: !options.showCuttingPlan})} /><span className="text-sm font-bold text-slate-700">2. Plano de Corte</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors select-none">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.showHardwareList ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>{options.showHardwareList && <Check size={14} />}</div>
                            <input type="checkbox" className="hidden" checked={options.showHardwareList} onChange={() => setOptions({...options, showHardwareList: !options.showHardwareList})} /><span className="text-sm font-bold text-slate-700">3. Lista de Ferragens</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors select-none">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.showAssemblyGuide ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>{options.showAssemblyGuide && <Check size={14} />}</div>
                            <input type="checkbox" className="hidden" checked={options.showAssemblyGuide} onChange={() => setOptions({...options, showAssemblyGuide: !options.showAssemblyGuide})} /><span className="text-sm font-bold text-slate-700">4. Guia de Montagem</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors select-none">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.showProductionSheet ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>{options.showProductionSheet && <Check size={14} />}</div>
                            <input type="checkbox" className="hidden" checked={options.showProductionSheet} onChange={() => setOptions({...options, showProductionSheet: !options.showProductionSheet})} /><span className="text-sm font-bold text-slate-700">5. Cronograma (Ficha Prod.)</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors select-none" onClick={toggleLabels}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.showLabels ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>{options.showLabels && <Check size={14} />}</div>
                            <span className="text-sm font-bold text-slate-700">6. Etiquetas Adesivas</span>
                        </label>
                    </div>
                </div>
                <div className="mt-auto space-y-3">
                    <button onClick={handlePrint} className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"><Printer size={20} /> Imprimir Documentos</button>
                    <button onClick={handleDownloadPDF} disabled={isDownloading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95">{isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}{isDownloading ? 'Gerando...' : 'Baixar PDF'}</button>
                </div>
            </div>
        </div>
    );
};
