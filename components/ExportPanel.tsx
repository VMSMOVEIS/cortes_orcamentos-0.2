
import React, { useState, useEffect } from 'react';
import { ProcessedPart } from '../types';
import { Copy, Check, FileJson, FileSpreadsheet, Download, ChevronDown, Table as TableIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportPanelProps {
  parts: ProcessedPart[];
  projectName: string;
}

interface ExportRow {
    id: string;
    material: string;
    thickness: number;
    name: string;
    length: number;
    width: number;
    qty: number;
    grain: string;
    edgeCode: string;
    group: string;
    notes: string;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ parts, projectName }) => {
  const [activeTab, setActiveTab] = useState<'table' | 'json' | 'csv'>('table');
  const [copied, setCopied] = useState(false);
  const [showFormats, setShowFormats] = useState(false);
  
  // Local state for editable table
  const [gridData, setGridData] = useState<ExportRow[]>([]);

  // Initialize data from parts prop
  useEffect(() => {
    const mappedData = parts.map(p => {
        const e = p.edges || { long1: 'none', long2: 'none', short1: 'none', short2: 'none' };
        const longCount = (e.long1 !== 'none' ? 1 : 0) + (e.long2 !== 'none' ? 1 : 0);
        const shortCount = (e.short1 !== 'none' ? 1 : 0) + (e.short2 !== 'none' ? 1 : 0);
        
        let edgeCode = "";
        
        if (longCount === 2 && shortCount === 2) {
            edgeCode = "O";
        } else if (longCount === 2 && shortCount === 1) {
            edgeCode = "U";
        } else if (longCount === 1 && shortCount === 2) {
            edgeCode = "C";
        } else if (longCount === 1 && shortCount === 1) {
            edgeCode = "L";
        } else if (longCount === 2 && shortCount === 0) {
            edgeCode = "H";
        } else if (longCount === 1 && shortCount === 0) {
            edgeCode = "I";
        } else if (longCount === 0 && shortCount > 0) {
            edgeCode = shortCount === 1 ? "L" : "H";
        } else {
            edgeCode = "";
        }

        return {
            id: p.displayId,
            material: p.materialName, 
            thickness: p.dimensions.thickness,
            name: p.finalName,
            length: p.dimensions.height, 
            width: p.dimensions.width,
            qty: p.quantity,
            grain: p.grainDirection,
            edgeCode: edgeCode,
            group: p.groupCategory,
            notes: p.notes?.join(', ') || ''
        };
    });
    setGridData(mappedData);
  }, [parts]);

  const handleCellChange = (index: number, field: keyof ExportRow, value: string | number) => {
      const updated = [...gridData];
      updated[index] = { ...updated[index], [field]: value };
      setGridData(updated);
  };

  // --- Generation Logic using gridData ---

  const generateJSON = () => {
    const materialsMap = new Map<string, any>();
    gridData.forEach((data) => {
        const matKey = `${data.material}-${data.thickness}`;
        if(!materialsMap.has(matKey)) {
            materialsMap.set(matKey, {
                nome: data.material,
                espessura: `${data.thickness}mm`,
                pecas: []
            });
        }
        materialsMap.get(matKey).pecas.push({
            id: data.id,
            nome: data.name,
            comprimento: data.length,
            largura: data.width,
            qtd: data.qty,
            fita: data.edgeCode
        });
    });

    const projectData = {
        projeto: projectName,
        materiais: Array.from(materialsMap.values())
    };
    return JSON.stringify(projectData, null, 2);
  };

  const generateCSV = (includeHeaders = true) => {
    const headers = "Tipo de Material,Comprimento,Largura,Quantidade,Nome da Peça,Fita";
    const rows = gridData.map(d => 
        `${d.material},${d.length},${d.width},${d.qty},"${d.name}",${d.edgeCode}`
    );
    return includeHeaders ? [headers, ...rows].join('\n') : rows.join('\n');
  };

  const generateTSV = (includeHeaders = true) => {
    const headers = "Tipo de Material\tComprimento\tLargura\tQuantidade\tNome da Peça\tFita";
    const rows = gridData.map(d => 
        `${d.material}\t${d.length}\t${d.width}\t${d.qty}\t${d.name}\t${d.edgeCode}`
    );
    return includeHeaders ? [headers, ...rows].join('\n') : rows.join('\n');
  };

  const handleCopy = () => {
    let textToCopy = "";
    if (activeTab === 'json') textToCopy = generateJSON();
    else if (activeTab === 'csv') textToCopy = generateCSV(false);
    else textToCopy = generateTSV(false); 

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadExcel = (extension: 'xlsx' | 'xls' | 'xlsm') => {
    const data = gridData.map(d => ({
        "Tipo de Material": d.material,
        "Comprimento": d.length,
        "Largura": d.width,
        "Quantidade": d.qty,
        "Nome da Peça": d.name,
        "Fita": d.edgeCode 
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
        { wch: 25 }, // Material
        { wch: 12 }, // Comp
        { wch: 12 }, // Larg
        { wch: 10 }, // Qtd
        { wch: 35 }, // Nome
        { wch: 10 }, // Fita
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lista de Corte");
    
    const bookType = extension === 'xls' ? 'xls' : extension === 'xlsm' ? 'xlsm' : 'xlsx';
    XLSX.writeFile(workbook, `${projectName || 'ListaDeCorte'}.${extension}`, { bookType });
    setShowFormats(false);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm mt-6 relative z-10">
      <div className="flex border-b border-slate-200 flex-wrap bg-slate-50 items-center rounded-t-lg">
        <button
          onClick={() => setActiveTab('table')}
          className={`px-4 py-3 flex items-center gap-2 text-sm font-medium transition-colors ${
            activeTab === 'table' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TableIcon size={16} /> Visualizar Tabela
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`px-4 py-3 flex items-center gap-2 text-sm font-medium transition-colors ${
            activeTab === 'json' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileJson size={16} /> JSON
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-3 flex items-center gap-2 text-sm font-medium transition-colors ${
            activeTab === 'csv' ? 'bg-white text-green-600 border-b-2 border-green-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet size={16} /> CSV
        </button>
        
        <div className="ml-auto px-4 py-2 flex items-center gap-2">
            <div className="relative">
                <button
                    onClick={() => setShowFormats(!showFormats)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 rounded text-xs text-white transition-all shadow-sm font-medium"
                >
                    <Download size={14} />
                    Exportar Excel
                    <ChevronDown size={12} className={`transition-transform ${showFormats ? 'rotate-180' : ''}`} />
                </button>
                {showFormats && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-[150px] flex flex-col py-1 animate-fade-in">
                        <button onClick={() => handleDownloadExcel('xlsx')} className="px-4 py-2 text-left text-xs hover:bg-slate-50 text-slate-700 font-medium">
                            Padrão (.xlsx)
                        </button>
                        <button onClick={() => handleDownloadExcel('xls')} className="px-4 py-2 text-left text-xs hover:bg-slate-50 text-slate-700 font-medium">
                            Excel 97-2003 (.xls)
                        </button>
                        <button onClick={() => handleDownloadExcel('xlsm')} className="px-4 py-2 text-left text-xs hover:bg-slate-50 text-slate-700 font-medium">
                            Com Macros (.xlsm)
                        </button>
                    </div>
                )}
            </div>
            <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs text-slate-700 transition-all font-medium"
            >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? 'Copiado' : (activeTab === 'table' ? 'Copiar Conteúdo' : 'Copiar')}
            </button>
        </div>
      </div>
      
      <div className="p-0 relative">
         {showFormats && <div className="fixed inset-0 z-40" onClick={() => setShowFormats(false)}></div>}
         {activeTab === 'table' ? (
             <div className="overflow-auto max-h-[400px] custom-scrollbar rounded-b-lg">
                 <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-200 uppercase">
                    Produto: {projectName}
                 </div>
                 <table className="w-full text-xs text-left border-collapse">
                     <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 shadow-sm font-bold uppercase">
                         <tr>
                             <th className="p-2 border-b border-r border-slate-200 w-1/4">Tipo de Material</th>
                             <th className="p-2 border-b border-r border-slate-200 text-center w-24">Comprimento</th>
                             <th className="p-2 border-b border-r border-slate-200 text-center w-24">Largura</th>
                             <th className="p-2 border-b border-r border-slate-200 text-center w-16">Qtde</th>
                             <th className="p-2 border-b border-r border-slate-200 w-1/3">Nome da Peça</th>
                             <th className="p-2 border-b border-slate-200 text-center w-16">Fita</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {gridData.map((row, idx) => (
                             <tr key={idx} className="hover:bg-blue-50/50 even:bg-slate-50/50">
                                 <td className="p-0 border-r border-slate-200">
                                     <input 
                                        type="text" 
                                        value={row.material} 
                                        onChange={(e) => handleCellChange(idx, 'material', e.target.value)}
                                        className="w-full h-full p-2 bg-transparent border-none outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 font-medium text-slate-700 truncate"
                                     />
                                 </td>
                                 <td className="p-0 border-r border-slate-200">
                                     <input 
                                        type="number" 
                                        value={row.length} 
                                        onChange={(e) => handleCellChange(idx, 'length', Number(e.target.value))}
                                        className="w-full h-full p-2 bg-transparent border-none outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 text-center font-mono text-slate-600"
                                     />
                                 </td>
                                 <td className="p-0 border-r border-slate-200">
                                     <input 
                                        type="number" 
                                        value={row.width} 
                                        onChange={(e) => handleCellChange(idx, 'width', Number(e.target.value))}
                                        className="w-full h-full p-2 bg-transparent border-none outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 text-center font-mono text-slate-600"
                                     />
                                 </td>
                                 <td className="p-0 border-r border-slate-200">
                                     <input 
                                        type="number" 
                                        value={row.qty} 
                                        onChange={(e) => handleCellChange(idx, 'qty', Number(e.target.value))}
                                        className="w-full h-full p-2 bg-transparent border-none outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 text-center font-bold text-blue-600"
                                     />
                                 </td>
                                 <td className="p-0 border-r border-slate-200">
                                     <input 
                                        type="text" 
                                        value={row.name} 
                                        onChange={(e) => handleCellChange(idx, 'name', e.target.value)}
                                        className="w-full h-full p-2 bg-transparent border-none outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 text-slate-800"
                                     />
                                 </td>
                                 <td className="p-0 border-r border-slate-200">
                                     <input 
                                        type="text" 
                                        value={row.edgeCode} 
                                        onChange={(e) => handleCellChange(idx, 'edgeCode', e.target.value)}
                                        className="w-full h-full p-2 bg-transparent border-none outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-500 text-center font-mono font-bold"
                                     />
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         ) : (
            <pre className="custom-scrollbar overflow-auto max-h-[400px] p-4 text-xs font-mono text-slate-600 bg-white rounded-b-lg">
              {activeTab === 'json' ? generateJSON() : generateCSV(true)}
            </pre>
         )}
      </div>
    </div>
  );
};
