
import React, { useState, useEffect } from 'react';
import { OptimizedSheet, PlacedPart, OptimizationResult, EdgeType } from '../types';
import { Ruler, MousePointer2, AlertCircle } from 'lucide-react';

interface CuttingLayoutViewerProps {
  sheets: OptimizedSheet[];
  result?: OptimizationResult;
  projectName?: string;
  selectedMaterialName?: string;
  projectOrder?: string;
  materialThickness?: number;
  colorMode: 'white' | 'colored' | 'gray';
  edgeBandStyle?: 'solid' | 'dashed';
}

// Geração de cores otimizada para diversidade vibrante com opacidade reduzida
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Usa HSL com saturação e luminosidade fixas para tons pastéis vibrantes e sólidos
  const h = Math.abs(hash) % 360;
  // Opacidade 0.6 para economizar tinta e suavizar visualização
  return `hsla(${h}, 70%, 60%, 0.6)`; 
};

export const CuttingLayoutViewer: React.FC<CuttingLayoutViewerProps> = ({ sheets, colorMode, result, projectName, selectedMaterialName, projectOrder, materialThickness }) => {
  const [localSheets, setLocalSheets] = useState<OptimizedSheet[]>([]);
  const [activeTool, setActiveTool] = useState<'select' | 'dimension'>('select');

  useEffect(() => { setLocalSheets(JSON.parse(JSON.stringify(sheets))); }, [sheets]);

  return (
    <div className="w-full flex flex-col gap-8 pb-12 print:pb-0 print:block">
      
      {/* Alerta de Peças Não Alocadas */}
      {result?.unplacedParts && result.unplacedParts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-2 no-print shadow-sm">
            <h3 className="text-red-800 font-black text-sm uppercase flex items-center gap-2 mb-4">
                <AlertCircle size={20} /> 
                Atenção: {result.unplacedParts.length} Peças Não Alocadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                {result.unplacedParts.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-red-100 text-xs shadow-sm">
                        <div>
                            <span className="font-bold text-slate-700 block">#{p.displayId} - {p.finalName}</span>
                            <span className="text-[10px] text-red-500">{p.notes.join(', ') || 'Erro de dimensão'}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{Math.round(p.dimensions.width)}x{Math.round(p.dimensions.height)}</span>
                    </div>
                ))}
            </div>
            <p className="text-[10px] font-bold uppercase text-red-400 mt-4 tracking-wide">
                Dica: Verifique se as peças são maiores que a chapa (considerando margens) ou se a orientação de veio impede o encaixe.
            </p>
        </div>
      )}

      {/* Barra de Ferramentas Flutuante */}
      {localSheets.length > 0 && (
          <div className="no-print sticky top-4 z-50 flex items-center justify-between bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                <button onClick={() => setActiveTool('select')} className={`p-2 rounded ${activeTool === 'select' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white'}`}><MousePointer2 size={18}/></button>
                <button onClick={() => setActiveTool('dimension')} className={`p-2 rounded ${activeTool === 'dimension' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white'}`}><Ruler size={18}/></button>
              </div>
              <div className="text-xs font-bold text-slate-400 border-l pl-3 uppercase">Plano Técnico</div>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Eficiência Total</p>
                    <p className="text-sm font-black text-emerald-600">{result ? ((1 - result.globalWastePercentage) * 100).toFixed(1) : 0}%</p>
                </div>
            </div>
          </div>
      )}

      {/* Renderização das Chapas */}
      {localSheets.length === 0 && !result?.unplacedParts?.length ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">Nenhuma chapa gerada. Verifique se há peças ativas para este material.</p>
          </div>
      ) : (
          <div className="w-full flex flex-col gap-8 print:gap-0 print:block print-section-sheets">
            {localSheets.map((sheet) => (
              <div key={`sheet-page-${sheet.id}`} className="page-landscape group border-2 border-slate-200">
                <div className="print-title-area border-b-2 border-slate-900 mb-4 pb-2">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="font-black text-2xl uppercase tracking-tighter text-slate-900">CHAPA #{sheet.id}</h2>
                            <div className="text-xs font-bold text-slate-600 uppercase mt-2 flex flex-col gap-0.5">
                                <span>MATERIAL: <span className="text-slate-900">{selectedMaterialName} {materialThickness ? `(${materialThickness}mm)` : ''}</span></span>
                                {projectOrder && <span>ORDEM: <span className="text-slate-900">{projectOrder}</span></span>}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-slate-900 leading-none">{sheet.width} x {sheet.height} mm</p>
                            <p className="text-[10px] font-black text-emerald-600 uppercase mt-1">Aproveitamento: {((1 - sheet.wastePercentage) * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                </div>

                <div className="svg-container bg-white rounded-lg overflow-auto border border-slate-200 shadow-inner max-h-[70vh] flex items-center justify-center p-4">
                    <SheetSVG 
                        sheet={sheet} 
                        colorMode={colorMode} 
                        viewBox={`-150 -150 ${sheet.width + 300} ${sheet.height + 300}`}
                        className="max-w-full max-h-[60vh] w-auto h-auto"
                    />
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
};

const EdgeMarkersSVG = ({ 
    edges, 
    yOffset = 12, 
    barWidth = 60 
}: { 
    edges: [EdgeType, EdgeType], 
    yOffset?: number, 
    barWidth?: number 
}) => {
    
    if (edges[0] === 'none' && edges[1] === 'none') return null;
    
    const renderLine = (type: EdgeType, y: number) => {
        if (type === 'none') return null;
        
        if (type === 'colored') {
             return (
                <line 
                    x1={-barWidth/2} y1={y} x2={barWidth/2} y2={y} 
                    stroke="#f97316"
                    strokeWidth="5" 
                    strokeLinecap="butt" 
                />
            );
        }

        const dashArray = type === 'dashed' ? "6 4" : "none";
        
        return (
            <line 
                x1={-barWidth/2} y1={y} x2={barWidth/2} y2={y} 
                stroke="#000" 
                strokeWidth="4" 
                strokeDasharray={dashArray} 
                strokeLinecap="butt" 
            />
        );
    };

    return (
        <g transform={`translate(0, ${yOffset})`}>
            {renderLine(edges[0], 0)}
            {renderLine(edges[1], 8)}
        </g>
    );
};

export const SheetSVG: React.FC<{ 
    sheet: OptimizedSheet; 
    viewBox: string; 
    colorMode: 'white' | 'colored' | 'gray'; 
    edgeBandStyle?: 'solid' | 'dashed';
    className?: string;
}> = ({ sheet, viewBox, colorMode, className = "w-full h-full" }) => {
    const hatchId = `hatch-${sheet.id}`;

    return (
        <svg viewBox={viewBox} className={className} preserveAspectRatio="xMidYMid meet">
            <defs>
                <pattern id={hatchId} patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                    <rect width="20" height="20" fill="#f8fafc" />
                    <line x1="0" y1="0" x2="0" y2="20" stroke="#94a3b8" strokeWidth="2" />
                </pattern>
                
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
            </defs>

            {/* 1. FUNDO DA CHAPA (Totalmente Hachurado) */}
            <rect 
                x={0} 
                y={0} 
                width={sheet.width} 
                height={sheet.height} 
                fill={`url(#${hatchId})`} 
                stroke="#000" 
                strokeWidth="2" 
            />
            
            {/* 2. SOBRAS ÚTEIS (OFFCUTS) */}
            {sheet.offcuts?.map((off: any, idx: number) => (
                <g key={`off-${idx}`}>
                    <rect 
                        x={off.x} 
                        y={off.y} 
                        width={off.width} 
                        height={off.height} 
                        fill={`url(#${hatchId})`} 
                        stroke="#64748b" 
                        strokeWidth="1"
                        strokeDasharray="4 2" 
                    />
                    {off.width > 150 && off.height > 100 && (
                        <g transform={`translate(${off.x + off.width / 2}, ${off.y + off.height / 2})`}>
                             <rect x="-90" y="-22" width="180" height="44" rx="8" fill="white" stroke="#000" strokeWidth="2" opacity="1" />
                             <text textAnchor="middle" y="11" fontSize="16" fontWeight="900" fill="#000">
                                SOBRA {Math.round(off.width)}x{Math.round(off.height)}
                             </text>
                        </g>
                    )}
                </g>
            ))}

            {/* 3. PEÇAS DO PROJETO */}
            {sheet.parts.map((p: any) => {
                let fillColor = 'white';
                if (colorMode === 'colored') {
                    // Usa a cor gerada a partir do nome da peça para garantir que peças iguais tenham a mesma cor
                    fillColor = stringToColor(p.name);
                } else if (colorMode === 'gray') {
                    fillColor = '#cbd5e1'; 
                }
                
                const e = p.edges || { long1: 'none', long2: 'none', short1: 'none', short2: 'none' };
                
                let isRotated = p.rotated;
                
                if (p.originalDimensions) {
                    const diffW_H = Math.abs(p.width - p.originalDimensions.height);
                    const diffH_W = Math.abs(p.height - p.originalDimensions.width);
                    
                    if (diffW_H < 1 && diffH_W < 1) {
                        isRotated = true;
                    } 
                    else if (Math.abs(p.width - p.originalDimensions.width) < 1) {
                        isRotated = false;
                    }
                }

                const visualWidthEdges: [EdgeType, EdgeType] = isRotated ? [e.short1, e.short2] : [e.long1, e.long2];
                const visualHeightEdges: [EdgeType, EdgeType] = isRotated ? [e.long1, e.long2] : [e.short1, e.short2];

                return (
                    <g key={p.uuid} className="piece-group">
                        <rect 
                            x={p.x} 
                            y={p.y} 
                            width={p.width} 
                            height={p.height} 
                            fill={fillColor} 
                            stroke="#000" 
                            strokeWidth="3" 
                        />
                        
                        {/* ID reposicionado para canto inferior direito (interno) */}
                        <text 
                            x={p.x + p.width - 15} 
                            y={p.y + p.height - 15} 
                            textAnchor="end" 
                            fontSize={Math.max(22, Math.min(48, Math.round(p.width / 6)))} 
                            fontWeight="900" 
                            fill="#000"
                            style={{paintOrder:'stroke', stroke:'white', strokeWidth:'6px'}}
                        >
                            #{p.displayId}
                        </text>
                        
                        {/* Dimensões Internas com Fita Personalizada */}
                        {/* Horizontal Dimension Text (Width on screen) */}
                        <g transform={`translate(${p.x + p.width/2}, ${p.y + Math.min(60, p.height/2)})`}>
                            <text textAnchor="middle" fontSize={Math.max(20, Math.min(48, Math.round(p.width / 6)))} fontWeight="800" fill="#000" style={{paintOrder:'stroke', stroke:'white', strokeWidth:'6px'}}>{Math.round(p.width)}</text>
                            <EdgeMarkersSVG edges={visualWidthEdges} yOffset={12} />
                        </g>

                        {/* Vertical Dimension Text (Height on screen) */}
                        <g transform={`translate(${p.x + Math.min(60, p.width/2)}, ${p.y + p.height/2}) rotate(-90)`}>
                            <text textAnchor="middle" fontSize={Math.max(20, Math.min(48, Math.round(p.height / 6)))} fontWeight="800" fill="#000" style={{paintOrder:'stroke', stroke:'white', strokeWidth:'6px'}}>{Math.round(p.height)}</text>
                            <EdgeMarkersSVG edges={visualHeightEdges} yOffset={12} />
                        </g>

                        <g transform={`translate(${p.x + p.width - 30}, ${p.y + 30})`}>
                            <path d="M-15,0 L15,0 M10,-5 L15,0 L10,5" fill="none" stroke="#64748b" strokeWidth="3" transform={isRotated ? 'rotate(90)' : ''} />
                        </g>
                    </g>
                );
            })}
        </svg>
    );
}
