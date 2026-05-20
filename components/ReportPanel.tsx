
import React, { useMemo, useState } from 'react';
import { OptimizationResult, OptimizationConfig, ProcessedPart, RegisteredMaterial, ExtractedComponent, RegisteredHardware, RegisteredEdgeBand } from '../types';
import { 
    FileText, Printer, DollarSign, Activity, Layers, BarChart3, Clock, Scissors, LayoutDashboard, 
    Download, Copy, FileSpreadsheet, FileBox, FileArchive, RotateCcw, TrendingUp, Info, 
    CheckCircle2, AlertCircle, ChevronDown, Table as TableIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface ReportPanelProps {
  result: OptimizationResult | null;
  config: OptimizationConfig;
  projectName: string;
  parts: ProcessedPart[]; 
  materials: RegisteredMaterial[];
  hardware: ExtractedComponent[];
  hardwareRegistry: RegisteredHardware[];
  edgeRegistry: RegisteredEdgeBand[];
}

export const ReportPanel: React.FC<ReportPanelProps> = ({ 
    result, config, projectName, parts, materials, hardware, hardwareRegistry, edgeRegistry 
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'technical' | 'quote'>('technical');

  // 1. Cálculo de Estimativa de Chapas por Rotação
  const rotationEstimation = useMemo(() => {
    const sheetWidth = config.sheetWidth || 2750;
    const sheetHeight = config.sheetHeight || 1840;
    const sheetArea = (sheetWidth * sheetHeight) / 1000000;
    
    // Agrupa por material
    const mats: Record<string, { totalArea: number, name: string, thickness: number }> = {};
    parts.forEach(p => {
        const key = `${p.materialName}|${Math.round(p.dimensions.thickness)}`;
        if (!mats[key]) mats[key] = { name: p.materialName, thickness: Math.round(p.dimensions.thickness), totalArea: 0 };
        mats[key].totalArea += (p.dimensions.width * p.dimensions.height * p.quantity) / 1000000;
    });

    return Object.values(mats).map(m => {
        return {
            ...m,
            modes: [
                { label: 'Otimização Livre (Máxima)', factor: 1.15, count: Math.ceil((m.totalArea * 1.15) / sheetArea) },
                { label: 'Sentido Horizontal (Com Veio)', factor: 1.28, count: Math.ceil((m.totalArea * 1.28) / sheetArea) },
                { label: 'Sentido Vertical (Com Veio)', factor: 1.35, count: Math.ceil((m.totalArea * 1.35) / sheetArea) }
            ]
        };
    });
  }, [parts, config]);

  // 2. Consolidação de Itens para Cotação
  const quoteItems = useMemo(() => {
    const items: { name: string, unit: string, measure?: string, qty: number, price: number, total: number, category: string }[] = [];

    // Chapas
    rotationEstimation.forEach(matGroup => {
        const material = materials.find(m => m.name === matGroup.name && m.thickness === matGroup.thickness);
        const price = material?.cost || 0;
        const qty = matGroup.modes[0].count; // Default to free rotation for base price
        
        items.push({
            name: `Chapa ${matGroup.name} ${matGroup.thickness}mm`,
            unit: 'un',
            measure: `${config.sheetWidth}x${config.sheetHeight}mm`,
            qty,
            price,
            total: qty * price,
            category: 'Materiais (Chapas)'
        });
    });

    // Fitas
    const edges: Record<string, { length: number, price: number, name: string }> = {};
    parts.forEach(p => {
        const { width, height } = p.dimensions;
        const qty = p.quantity;
        const ed = p.edges;
        const edgeColor = p.detectedEdgeColor || p.materialName;
        
        const reg = edgeRegistry.find(r => r.name.toLowerCase().includes(edgeColor.toLowerCase()) || edgeColor.toLowerCase().includes(r.name.toLowerCase()));
        const key = reg ? reg.name : edgeColor;
        
        if (!edges[key]) edges[key] = { length: 0, price: reg?.pricePerMeter || 0, name: key };
        
        let mm = 0;
        if (ed.long1 !== 'none') mm += width;
        if (ed.long2 !== 'none') mm += width;
        if (ed.short1 !== 'none') mm += height;
        if (ed.short2 !== 'none') mm += height;
        
        edges[key].length += (mm * qty) / 1000;
    });

    Object.values(edges).forEach(e => {
        items.push({
            name: `Fita de Borda ${e.name}`,
            unit: 'm',
            measure: `${e.length.toFixed(1)} m`,
            qty: e.length,
            price: e.price,
            total: e.length * e.price,
            category: 'Fitas de Borda'
        });
    });

    // Ferragens
    hardware.forEach(hw => {
        const reg = hardwareRegistry.find(r => r.name.toLowerCase() === hw.name.toLowerCase());
        const price = reg?.price || 0;
        
        items.push({
            name: hw.name,
            unit: 'un',
            qty: hw.quantity,
            price,
            total: hw.quantity * price,
            category: 'Ferragens e Acessórios'
        });
    });

    return items;
  }, [parts, materials, hardware, edgeRegistry, rotationEstimation, config]);

  const totalQuoteValue = useMemo(() => quoteItems.reduce((acc, i) => acc + i.total, 0), [quoteItems]);

  // 3. Funções de Exportação
  const exportToExcel = () => {
    const data = quoteItems.map(i => ({
        'Categoria': i.category,
        'Item': i.name,
        'Unidade': i.unit,
        'Medida/Metragem': i.measure || '-',
        'Quantidade': i.qty.toFixed(2),
        'Preço Unit.': i.price,
        'Total': i.total
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cotação");
    XLSX.writeFile(wb, `Cotacao_${projectName}_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(18);
    doc.text(`Cotação Técnica: ${projectName}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = quoteItems.map(i => [
        i.name, i.unit, i.qty.toFixed(2), 
        i.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
        i.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    ]);

    doc.autoTable({
        startY: 35,
        head: [['Item', 'Un', 'Qtd', 'Preço Unit', 'Total']],
        body: tableData,
        foot: [['', '', '', 'TOTAL GERAL', totalQuoteValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]],
        theme: 'striped',
        styles: { fontSize: 8 }
    });

    doc.save(`Cotacao_${projectName}.pdf`);
  };

  const exportToWord = async () => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: `Relatório de Cotação: ${projectName}`, heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ text: `Emitido em: ${new Date().toLocaleDateString()}` }),
                new Paragraph({ text: '' }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Item", alignment: AlignmentType.CENTER })], shading: { fill: "f0f0f0" } }),
                                new TableCell({ children: [new Paragraph({ text: "Un", alignment: AlignmentType.CENTER })], shading: { fill: "f0f0f0" } }),
                                new TableCell({ children: [new Paragraph({ text: "Qtd", alignment: AlignmentType.CENTER })], shading: { fill: "f0f0f0" } }),
                                new TableCell({ children: [new Paragraph({ text: "Total", alignment: AlignmentType.CENTER })], shading: { fill: "f0f0f0" } }),
                            ],
                        }),
                        ...quoteItems.map(i => new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(i.name)] }),
                                new TableCell({ children: [new Paragraph(i.unit)] }),
                                new TableCell({ children: [new Paragraph(i.qty.toFixed(2))] }),
                                new TableCell({ children: [new Paragraph(i.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))] }),
                            ]
                        }))
                    ]
                })
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Cotacao_${projectName}.docx`);
  };

  const copyToClipboard = () => {
    const text = quoteItems.map(i => `${i.name} | ${i.unit} | ${i.qty.toFixed(2)} | ${i.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`).join('\n');
    navigator.clipboard.writeText(`Cotação: ${projectName}\n\n${text}\n\nTOTAL: ${totalQuoteValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    alert('Cotação copiada para a área de transferência!');
  };

  if (!result && activeReportTab === 'technical') {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <FileText size={64} className="mb-4 opacity-50"/>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Relatório Técnico Indisponível</h3>
            <p className="max-w-md text-center mb-6">
                Gere um plano de corte para ver os detalhes técnicos, ou acesse a aba de cotação.
            </p>
            <button onClick={() => setActiveReportTab('quote')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg">Ver Cotação Comercial</button>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 pb-20 px-4">
        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 mb-8 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-fit no-print">
            <button 
                onClick={() => setActiveReportTab('technical')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeReportTab === 'technical' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Activity size={16}/> Relatório Técnico
            </button>
            <button 
                onClick={() => setActiveReportTab('quote')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeReportTab === 'quote' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <DollarSign size={16}/> Cotação Comercial
            </button>
        </div>

        {activeReportTab === 'technical' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-8 no-print">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter shrink-0">Relatório de Produção</h2>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Análise Técnica do Plano Atual</p>
                    </div>
                    <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Printer size={18} /> Imprimir Técnico
                    </button>
                </div>
                
                {/* EXISTING TECHNICAL CONTENT (SIMPLIFIED RE-IMPLEMENTATION) */}
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-center">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Chapas (Plano)</span>
                            <div className="text-4xl font-black text-slate-800">{result?.totalSheets}</div>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Aproveitamento</span>
                            <div className="text-4xl font-black text-emerald-600">{((1 - (result?.globalWastePercentage || 0)) * 100).toFixed(1)}%</div>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">Tempo Corte</span>
                            <div className="text-4xl font-black text-blue-600">{Math.ceil(result?.estimatedTime || 0)} min</div>
                        </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                        <TableIcon size={20} className="text-blue-600"/> Detalhamento por Material
                    </h3>
                    <table className="w-full text-sm text-left mb-10 border border-slate-100 rounded-xl overflow-hidden">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Material</th>
                                <th className="px-4 py-3 text-center">Esp.</th>
                                <th className="px-4 py-3 text-right">Área Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rotationEstimation.map((m, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-4 font-bold text-slate-700">{m.name}</td>
                                    <td className="px-4 py-4 text-center font-mono text-slate-400">{m.thickness}mm</td>
                                    <td className="px-4 py-4 text-right font-black text-slate-600">{m.totalArea.toFixed(2)} m²</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h3 className="text-lg font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                        <RotateCcw size={20} className="text-blue-600"/> Análise de Rotação (Sentido do Veio)
                    </h3>
                    <p className="text-xs text-slate-400 mb-6 font-medium italic">*Estimativa baseada na área total e fatores de quebra para cada modalidade.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {rotationEstimation.map((m, i) => (
                            <div key={i} className="md:col-span-3 border border-slate-100 rounded-2xl p-6 bg-slate-50/30">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 block">{m.name} ({m.thickness}mm)</span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {m.modes.map((mode, mi) => (
                                        <div key={mi} className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${mi === 0 ? 'bg-white border-blue-200 shadow-sm' : 'bg-white/50 border-slate-200'}`}>
                                            <span className="text-[10px] font-black text-slate-400 uppercase leading-tight mb-2 h-8 flex items-center">{mode.label}</span>
                                            <div className={`text-2xl font-black ${mi === 0 ? 'text-blue-600' : 'text-slate-600'}`}>{mode.count} <span className="text-[10px] font-bold">chapas</span></div>
                                            <span className="text-[10px] font-bold text-slate-400 mt-2">Perda Est: {((mode.factor-1)*100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-8 no-print">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter shrink-0">Cotação Detalhada</h2>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Resumo de Materiais e Valores</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={copyToClipboard} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 shadow-sm transition-all" title="Copiar como Texto">
                            <Copy size={18}/>
                        </button>
                        <div className="h-6 w-px bg-slate-200 mx-1"></div>
                        <button onClick={exportToExcel} className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 shadow-sm transition-all" title="Exportar Excel">
                            <FileSpreadsheet size={18}/>
                        </button>
                        <button onClick={exportToPDF} className="p-3 bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-100 shadow-sm transition-all" title="Exportar PDF">
                            <FileArchive size={18}/>
                        </button>
                        <button onClick={exportToWord} className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-100 shadow-sm transition-all" title="Exportar Word">
                            <FileBox size={18}/>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 p-8 text-white flex justify-between items-end">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <DollarSign size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight uppercase">Cotação Técnica</h1>
                                <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mt-1">Projeto: {projectName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Estimado</span>
                             <div className="text-4xl font-black text-white">
                                 {totalQuoteValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                             </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="space-y-10">
                            {['Materiais (Chapas)', 'Fitas de Borda', 'Ferragens e Acessórios'].map(cat => {
                                const catItems = quoteItems.filter(i => i.category === cat);
                                if (catItems.length === 0) return null;

                                return (
                                    <div key={cat}>
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                                            {cat === 'Materiais (Chapas)' ? <Layers size={18} className="text-blue-500" /> : 
                                             cat === 'Fitas de Borda' ? <RotateCcw size={18} className="text-emerald-500" /> : 
                                             <FileBox size={18} className="text-amber-500" />}
                                            {cat}
                                        </h3>
                                        <div className="grid grid-cols-1 gap-1">
                                            {catItems.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors rounded-xl border border-transparent hover:border-slate-100">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-800">{item.name}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                {item.unit} {item.measure && `• ${item.measure}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-12 text-right">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Qtd.</span>
                                                            <span className="text-sm font-black text-slate-600">{item.qty.toFixed(item.unit === 'm' ? 1 : 0)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Unit.</span>
                                                            <span className="text-sm font-bold text-slate-800">{item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                        </div>
                                                        <div className="flex flex-col min-w-[100px]">
                                                            <span className="text-[9px] font-bold text-blue-600 uppercase">Total</span>
                                                            <span className="text-sm font-black text-blue-700">{item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-12 pt-8 border-t-2 border-slate-100 flex justify-between items-center bg-slate-50 -mx-8 -mb-8 p-10">
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-xs leading-relaxed">
                                    * Esta cotação é baseada nos parâmetros atuais do catálogo e otimização. Valores podem variar conforme negociação e fornecedor.
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-slate-400 uppercase block mb-1">Subtotal Geral</span>
                                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                                    {totalQuoteValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
