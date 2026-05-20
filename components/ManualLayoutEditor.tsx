
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { OptimizationResult, OptimizedSheet, PlacedPart, ProcessedPart } from '../types';
import { ArrowRight, RotateCw, Move, Trash2, ZoomIn, ZoomOut, AlertCircle, Save, Undo2, Maximize } from 'lucide-react';

interface ManualLayoutEditorProps {
  result: OptimizationResult | null;
  onUpdateResult: (newResult: OptimizationResult) => void;
}

interface DragItem {
    type: 'new' | 'move';
    part: PlacedPart | ProcessedPart;
    sheetId?: number; // Only for 'move'
    width: number;
    height: number;
    uuid?: string; // For moving existing parts
}

export const ManualLayoutEditor: React.FC<ManualLayoutEditorProps> = ({ result, onUpdateResult }) => {
    // Local state to manage the editing session
    const [sheets, setSheets] = useState<OptimizedSheet[]>([]);
    const [unplacedPool, setUnplacedPool] = useState<PlacedPart[]>([]);
    const [activeSheetIdx, setActiveSheetIdx] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [history, setHistory] = useState<string[]>([]); // Simple undo stack (JSON strings)

    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Init
    useEffect(() => {
        if (result) {
            setSheets(JSON.parse(JSON.stringify(result.sheets)));
            
            // Convert any initially unplaced ProcessedParts to PlacedPart format for the pool
            const initialUnplaced = result.unplacedParts.map(p => ({
                uuid: `unplaced-${p.id}-${Math.random()}`,
                partId: p.id,
                displayId: p.displayId,
                x: 0, y: 0,
                width: p.dimensions.width,
                height: p.dimensions.height,
                rotated: false,
                name: p.finalName,
                group: p.groupCategory,
                edgeCode: '',
                edges: p.edges,
                sourceFile: p.sourceFile,
                notes: p.notes
            }));
            setUnplacedPool(initialUnplaced);
        }
    }, [result]);

    // Auto Fit to Screen on Load and Sheet Change
    useLayoutEffect(() => {
        handleFitToScreen();
    }, [activeSheetIdx, sheets.length]); // Depend on sheet change

    const handleFitToScreen = () => {
        if (!containerRef.current || sheets.length === 0) return;
        
        const sheet = sheets[activeSheetIdx];
        if (!sheet) return;

        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        const padding = 60; // Space for UI elements

        const scaleX = (containerW - padding) / sheet.width;
        const scaleY = (containerH - padding) / sheet.height;
        
        // Choose smaller scale to fit whole sheet, limit to 95% fit
        const newZoom = Math.min(scaleX, scaleY) * 0.95;
        
        // Don't let it get microscopic, nor huge if sheet is tiny
        setZoom(Math.max(0.1, Math.min(newZoom, 1.5)));
    };

    const saveHistory = () => {
        const state = JSON.stringify({ sheets, unplacedPool });
        setHistory(prev => [...prev.slice(-9), state]); // Keep last 10
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        const parsed = JSON.parse(lastState);
        setSheets(parsed.sheets);
        setUnplacedPool(parsed.unplacedPool);
        setHistory(prev => prev.slice(0, -1));
    };

    // --- ACTIONS ---

    const removePartFromSheet = (sheetIdx: number, partUuid: string) => {
        saveHistory();
        const newSheets = [...sheets];
        const sheet = newSheets[sheetIdx];
        const partIndex = sheet.parts.findIndex(p => p.uuid === partUuid);
        
        if (partIndex > -1) {
            const [removedPart] = sheet.parts.splice(partIndex, 1);
            
            // Recalculate used area/waste for this sheet roughly
            const usedArea = sheet.parts.reduce((acc, p) => acc + (p.width * p.height), 0);
            sheet.usedArea = usedArea;
            sheet.wastePercentage = 1 - (usedArea / (sheet.width * sheet.height));
            
            setSheets(newSheets);
            setUnplacedPool(prev => [...prev, removedPart]);
        }
    };

    const rotateUnplacedPart = (uuid: string) => {
        setUnplacedPool(prev => prev.map(p => {
            if (p.uuid === uuid) {
                return { ...p, width: p.height, height: p.width, rotated: !p.rotated };
            }
            return p;
        }));
    };

    const checkCollision = (rect: {x: number, y: number, w: number, h: number}, existingParts: PlacedPart[], ignoreUuid?: string) => {
        for (const p of existingParts) {
            if (p.uuid === ignoreUuid) continue; // Don't collide with self if moving on same sheet (future feature)
            
            if (
                rect.x < p.x + p.width &&
                rect.x + rect.w > p.x &&
                rect.y < p.y + p.height &&
                rect.y + rect.h > p.y
            ) {
                return true; // Collision detected
            }
        }
        return false;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;

        const data: DragItem = JSON.parse(dataStr);
        if (!svgRef.current) return;

        // If moving from sheet to sheet (re-arranging), remove from original position first
        // Currently we only support "Sidebar -> Sheet" or "Sheet -> Sidebar".
        // Direct move on sheet is tricky with collision, so for now we stick to Sidebar -> Sheet logic.
        // If it was 'move' (from sheet), we remove it from sheet FIRST, then treat as new placement.
        
        let tempSheets = [...sheets];
        let targetSheet = tempSheets[activeSheetIdx];

        if (data.type === 'move') {
            // Remove from current location temporarily to check collision
            const pIdx = targetSheet.parts.findIndex(p => p.uuid === data.uuid);
            if (pIdx > -1) {
                targetSheet.parts.splice(pIdx, 1);
            }
        }

        // Calculate Drop Position relative to SVG
        const svgRect = svgRef.current.getBoundingClientRect();
        const scaleX = sheets[activeSheetIdx].width / svgRect.width;
        const scaleY = sheets[activeSheetIdx].height / svgRect.height;

        const dropX = (e.clientX - svgRect.left) * scaleX;
        const dropY = (e.clientY - svgRect.top) * scaleY;

        // Snap to grid (10mm) or edges for easier placement
        const snap = (val: number) => Math.round(val / 10) * 10;
        
        const finalX = snap(dropX - (data.width / 2)); // Center the part on mouse
        const finalY = snap(dropY - (data.height / 2));

        // Bounds Check
        if (finalX < 0 || finalY < 0 || 
            (finalX + data.width) > sheets[activeSheetIdx].width || 
            (finalY + data.height) > sheets[activeSheetIdx].height) {
            
            // Revert if it was a move
            if (data.type === 'move') {
                 // Re-add to original spot (cancel move) OR push to sidebar?
                 // Let's cancel move by re-fetching state or re-adding.
                 // Simplest: Alert and return. Since we modified tempSheets, we just don't setSheets.
                 alert("A peça não cabe na chapa nesta posição.");
                 return; 
            }
            alert("Fora dos limites da chapa.");
            return;
        }

        // Collision Check
        if (checkCollision({ x: finalX, y: finalY, w: data.width, h: data.height }, targetSheet.parts)) {
            alert("Colisão detectada! A peça sobrepõe outra existente.");
            return;
        }

        // --- EXECUTE PLACEMENT ---
        saveHistory();
        
        // Add to sheet
        const newPart: PlacedPart = {
            ...(data.part as PlacedPart),
            x: finalX,
            y: finalY,
            width: data.width, // Ensure we use the current rotated dimension
            height: data.height,
            uuid: data.uuid || (data.part as PlacedPart).uuid // Keep UUID if moving
        };
        targetSheet.parts.push(newPart);

        // Update stats
        const usedArea = targetSheet.parts.reduce((acc, p) => acc + (p.width * p.height), 0);
        targetSheet.usedArea = usedArea;
        targetSheet.wastePercentage = 1 - (usedArea / (targetSheet.width * targetSheet.height));

        setSheets(tempSheets);

        // Remove from source if it was new
        if (data.type === 'new') {
            setUnplacedPool(prev => prev.filter(p => p.uuid !== (data.part as PlacedPart).uuid));
        }
    };

    const handleDragStart = (e: React.DragEvent, part: PlacedPart | ProcessedPart, type: 'new' | 'move') => {
        // Fix: Properly determine width/height from the union type
        const width = 'width' in part ? part.width : part.dimensions.width;
        const height = 'height' in part ? part.height : part.dimensions.height;
        
        const item: DragItem = {
            type,
            part: part as PlacedPart,
            width,
            height,
            uuid: (part as any).uuid
        };
        
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'move';

        // --- VISUAL GHOST ---
        // Create a temporary element to act as the visual drag ghost
        const ghost = document.createElement("div");
        ghost.style.width = `${Math.min(200, width)}px`; // Limit max visual size
        // Calculate aspect ratio for visual
        const aspect = height / width;
        ghost.style.height = `${Math.min(200, width) * aspect}px`;
        ghost.style.backgroundColor = (part as any).group === 'Lateral' ? '#dbeafe' : (part as any).group === 'Porta' ? '#fef08a' : '#cbd5e1';
        ghost.style.border = "2px solid #3b82f6";
        ghost.style.borderRadius = "4px";
        ghost.style.opacity = "0.8";
        ghost.style.position = "absolute";
        ghost.style.top = "-1000px"; // Hide offscreen
        ghost.textContent = `#${(part as any).displayId}`;
        ghost.style.display = "flex";
        ghost.style.alignItems = "center";
        ghost.style.justifyContent = "center";
        ghost.style.fontWeight = "bold";
        ghost.style.color = "#000";
        ghost.style.zIndex = "1000";
        
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        
        // Cleanup ghost element after drag starts
        setTimeout(() => {
            document.body.removeChild(ghost);
        }, 0);
    };

    // Sidebar Drop Handler (Remove from Sheet)
    const handleSidebarDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;
        
        const data: DragItem = JSON.parse(dataStr);
        
        if (data.type === 'move') {
            // Dragged from Sheet -> Drop on Sidebar = Remove from Sheet
            removePartFromSheet(activeSheetIdx, data.uuid!);
        }
    };

    const handleSaveChanges = () => {
        if (!result) return;
        
        const unplacedProcessed = unplacedPool.map(p => {
            return {
                id: p.partId,
                displayId: p.displayId,
                originalName: p.name,
                materialName: result.meta?.materialName || 'Unknown',
                dimensions: { width: p.width, height: p.height, thickness: result.meta?.thickness || 15 },
                position: {x:0, y:0, z:0},
                volume: 0,
                edges: p.edges,
                finalName: p.name,
                sourceFile: p.sourceFile,
                quantity: 1,
                grainDirection: 'N/A',
                groupCategory: p.group,
                notes: p.notes || []
            } as ProcessedPart;
        });

        const newResult: OptimizationResult = {
            ...result,
            sheets: sheets,
            unplacedParts: unplacedProcessed,
            totalSheets: sheets.length,
            totalUsedArea: sheets.reduce((acc, s) => acc + s.usedArea, 0),
            globalWastePercentage: sheets.reduce((acc, s) => acc + s.wastePercentage, 0) / sheets.length
        };

        onUpdateResult(newResult);
        alert("Alterações salvas no plano de corte! As abas de Visualização e Impressão foram atualizadas.");
    };

    if (!result) return <div className="p-8 text-center text-slate-400">Gere um plano de corte primeiro.</div>;
    if (sheets.length === 0) return <div className="flex h-full items-center justify-center text-slate-400"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mr-2"></div> Carregando editor...</div>;

    const currentSheet = sheets[activeSheetIdx];
    if (!currentSheet) return <div className="p-8 text-center text-red-400">Erro: Chapa não encontrada.</div>;

    return (
        <div className="flex h-full bg-slate-100 overflow-hidden">
            {/* --- LEFT: SHEET CANVAS --- */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="h-14 bg-white border-b border-slate-200 flex justify-between items-center px-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 rounded-lg p-1 overflow-x-auto max-w-[300px] custom-scrollbar">
                            {sheets.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveSheetIdx(idx)}
                                    className={`px-3 py-1 text-xs font-bold rounded whitespace-nowrap ${activeSheetIdx === idx ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    Chapa {idx + 1}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1 hover:bg-slate-100 rounded"><ZoomOut size={16}/></button>
                            <span className="text-xs font-mono w-8 text-center">{(zoom * 100).toFixed(0)}%</span>
                            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1 hover:bg-slate-100 rounded"><ZoomIn size={16}/></button>
                            <button onClick={handleFitToScreen} className="p-1 hover:bg-slate-100 rounded text-blue-600" title="Ajustar à Tela"><Maximize size={16}/></button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleUndo} 
                            disabled={history.length === 0}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded disabled:opacity-50"
                        >
                            <Undo2 size={14} /> Desfazer
                        </button>
                        <button 
                            onClick={handleSaveChanges}
                            className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm"
                        >
                            <Save size={14} /> Salvar Alterações
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div ref={containerRef} className="flex-1 overflow-auto p-8 relative bg-slate-200/50 flex items-center justify-center">
                    <div 
                        className="bg-white shadow-2xl relative transition-transform duration-200 border-4 border-slate-800"
                        style={{ 
                            width: currentSheet.width * zoom, 
                            height: currentSheet.height * zoom,
                            minWidth: currentSheet.width * zoom, // Prevent shrinking
                            minHeight: currentSheet.height * zoom 
                        }}
                    >
                        {/* HEADER DA CHAPA (Visual) */}
                        <div className="absolute top-0 left-0 w-full h-8 bg-slate-100 border-b border-slate-300 flex items-center justify-between px-2 pointer-events-none z-10">
                            <span className="text-[10px] font-bold text-slate-600">
                                {currentSheet.width} x {currentSheet.height} - Chapa #{currentSheet.id}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                                Arraste peças aqui ou para a barra lateral
                            </span>
                        </div>

                        {/* HATCH PATTERN FOR EMPTY SPACE */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                            <defs>
                                <pattern id="editHatch" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
                                    <rect width="40" height="40" fill="#f8fafc" />
                                    <line x1="0" y1="0" x2="0" y2="40" stroke="#e2e8f0" strokeWidth="2" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#editHatch)" />
                        </svg>

                        {/* INTERACTIVE SVG LAYER */}
                        <svg 
                            ref={svgRef}
                            viewBox={`0 0 ${currentSheet.width} ${currentSheet.height}`} 
                            className="absolute inset-0 w-full h-full z-20"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            {currentSheet.parts.map((part) => (
                                <g 
                                    key={part.uuid} 
                                    transform={`translate(${part.x}, ${part.y})`}
                                    className="group cursor-grab hover:opacity-90 transition-opacity"
                                    {...({ draggable: true } as any)}
                                    onDragStart={(e) => handleDragStart(e, part, 'move')}
                                    onClick={(e) => {
                                        // Simple Click to remove (Legacy support, though dragging is preferred now)
                                        if(e.detail === 2) removePartFromSheet(activeSheetIdx, part.uuid);
                                    }}
                                >
                                    <rect 
                                        width={part.width} 
                                        height={part.height} 
                                        fill={part.group === 'Lateral' ? '#dbeafe' : part.group === 'Porta' ? '#fef08a' : '#f1f5f9'}
                                        stroke="black" 
                                        strokeWidth="2"
                                    />
                                    {/* Dimensions - Blue Text like image */}
                                    <text x="5" y="20" fontSize="24" fill="blue" fontWeight="bold" style={{pointerEvents:'none'}}>
                                        {Math.round(part.rotated ? part.height : part.width)}
                                    </text>
                                    
                                    {/* Part ID */}
                                    <text 
                                        x={part.width - 5} 
                                        y={part.height - 10} 
                                        textAnchor="end" 
                                        fontSize="32" 
                                        fontWeight="black" 
                                        fill="black"
                                        style={{pointerEvents:'none'}}
                                    >
                                        #{part.displayId}
                                    </text>

                                    {/* Remove Button Overlay on Hover */}
                                    <foreignObject x={part.width - 30} y={5} width="24" height="24" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div 
                                            title="Remover para área de espera (ou arraste para a direita)"
                                            className="w-6 h-6 bg-red-500 rounded flex items-center justify-center cursor-pointer hover:bg-red-600 text-white shadow-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removePartFromSheet(activeSheetIdx, part.uuid);
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </div>
                                    </foreignObject>
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>
            </div>

            {/* --- RIGHT: UNPLACED PARTS SIDEBAR --- */}
            <div 
                className="w-80 bg-slate-200 border-l border-slate-300 flex flex-col shadow-xl z-30"
                onDragOver={(e) => e.preventDefault()} 
                onDrop={handleSidebarDrop}
            >
                <div className="p-4 bg-slate-300 border-b border-slate-400">
                    <h3 className="font-black text-slate-700 uppercase text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> Peças não colocadas
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                        Arraste para a chapa. <br/>
                        <span className="text-blue-600 font-bold">Dica:</span> Solte peças da chapa aqui para remover.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {unplacedPool.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs italic border-2 border-dashed border-slate-300 rounded">
                            Todas as peças foram alocadas.
                            <br/><br/>
                            Solte peças aqui para removê-las do plano.
                        </div>
                    ) : (
                        unplacedPool.map(part => (
                            <div 
                                key={part.uuid}
                                draggable
                                onDragStart={(e) => handleDragStart(e, part, 'new')}
                                className="bg-white border border-slate-400 rounded p-2 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group relative"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-black text-lg text-slate-800">#{part.displayId}</span>
                                    <button 
                                        onClick={() => rotateUnplacedPart(part.uuid)}
                                        className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded transition-colors"
                                        title="Rotacionar 90°"
                                    >
                                        <RotateCw size={14} />
                                    </button>
                                </div>
                                <div className="text-xs font-bold text-slate-600 truncate mb-2">{part.name}</div>
                                
                                {/* Visual Preview Mini */}
                                <div className="bg-slate-50 border border-slate-200 rounded h-16 flex items-center justify-center relative overflow-hidden">
                                    <div 
                                        className="border-2 border-slate-800 bg-blue-50"
                                        style={{
                                            width: part.width > part.height ? '80%' : `${(part.width/part.height)*60}%`,
                                            height: part.height > part.width ? '80%' : `${(part.height/part.width)*60}%`,
                                            maxHeight: '80%',
                                            maxWidth: '80%'
                                        }}
                                    ></div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity">
                                        <Move size={20} className="text-slate-800"/>
                                    </div>
                                </div>

                                <div className="mt-2 flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                    <span>L: {Math.round(part.width)}</span>
                                    <span>A: {Math.round(part.height)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
