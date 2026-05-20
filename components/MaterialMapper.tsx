
import React, { useMemo } from 'react';
import { ProcessedPart, RegisteredMaterial } from '../types';
import { ArrowRightLeft, Database, Info, ChevronDown, Trash2 } from 'lucide-react';

interface MaterialMapperProps {
  parts: ProcessedPart[];
  registeredMaterials: RegisteredMaterial[];
  onBatchUpdate: (oldName: string, oldThickness: number, newMaterial: RegisteredMaterial) => void;
  onBatchDelete: (name: string, thickness: number) => void;
}

export const MaterialMapper: React.FC<MaterialMapperProps> = ({ parts, registeredMaterials, onBatchUpdate, onBatchDelete }) => {

  // Identifica grupos únicos (Nome + Espessura)
  const uniqueMaterialGroups = useMemo(() => {
    const groups = new Map<string, { name: string, thickness: number, count: number }>();
    
    parts.forEach(p => {
        const t = Math.round(p.dimensions.thickness);
        const key = `${p.materialName}::${t}`;
        
        if (!groups.has(key)) {
            groups.set(key, { name: p.materialName, thickness: t, count: 0 });
        }
        groups.get(key)!.count++;
    });

    return Array.from(groups.values()).sort((a, b) => {
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return b.thickness - a.thickness;
    });
  }, [parts]);

  if (uniqueMaterialGroups.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl mb-4 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2">
      
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Mapeamento de Materiais (Chapas)</h3>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uniqueMaterialGroups.map(group => {
            const matchedMaterial = registeredMaterials.find(rm => 
                rm.name === group.name && rm.thickness === group.thickness
            );
            const isRegistered = !!matchedMaterial;
            
            return (
                <div key={`panel-${group.name}-${group.thickness}`} className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-300 group relative">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col min-w-[120px]">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">Material Original</span>
                            <span className="text-xs font-black text-slate-800 truncate max-w-[160px]" title={group.name}>
                                {group.name} <span className="text-slate-400 font-bold ml-1 text-[10px]">({group.thickness}mm)</span>
                            </span>
                            <span className="text-[9px] text-slate-400 font-black uppercase mt-0.5">{group.count} peças</span>
                        </div>
                        
                        <ArrowRightLeft size={14} className="text-slate-300 shrink-0 group-hover:text-blue-500 transition-colors" />
                        
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5 italic">Mapear Para</span>
                            <div className="relative">
                                <select 
                                    className={`appearance-none text-[11px] font-black border-none bg-slate-50 rounded-lg px-3 py-2 pr-8 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer w-56 ${!isRegistered ? 'text-amber-600 ring-1 ring-amber-200' : 'text-blue-700 ring-1 ring-blue-100 shadow-inner'}`}
                                    value={matchedMaterial ? matchedMaterial.id : ""}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        const found = registeredMaterials.find(rm => rm.id === selectedId);
                                        if (found) {
                                            onBatchUpdate(group.name, group.thickness, found);
                                        }
                                    }}
                                >
                                    <option value="" disabled>Selecionar do Catálogo...</option>
                                    {registeredMaterials.map(rm => (
                                        <option key={rm.id} value={rm.id}>
                                            {rm.name} ({rm.thickness}mm)
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-3.5 text-blue-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => onBatchDelete(group.name, group.thickness)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 ml-4 group-hover:scale-110"
                        title={`Excluir todas as ${group.count} peças deste material`}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            );
          })}
      </div>
      
      <div className="mt-6 flex items-start gap-3 text-[11px] text-slate-400 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 border-dashed">
          <Info size={16} className="shrink-0 mt-0.5 text-blue-400" />
          <p className="font-medium">Ao selecionar um material do catálogo, todas as peças correspondentes serão atualizadas. Use a lixeira para remover todas as peças de um material específico (ex: lixo de importação).</p>
      </div>
    </div>
  );
};
