
import React, { useState, useEffect } from 'react';
import { DropZone } from './DropZone';
import { X, Type, FileUp, Check } from 'lucide-react';

interface FileImportModalProps {
  onConfirm: (file: File, name: string, swapDimensions?: boolean) => void;
  onCancel: () => void;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({ onConfirm, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [swapDimensions, setSwapDimensions] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    // Sugere o nome baseado no arquivo (sem extensão)
    const defaultName = selectedFile.name.replace(/\.[^/.]+$/, "");
    setName(defaultName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file && name.trim()) {
      onConfirm(file, name.trim(), swapDimensions);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileUp size={24} className="text-blue-600" />
            Abrir Arquivo
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!file ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 mb-2">
                Arraste um modelo 3D para importar peças ou um arquivo <strong>.JSON</strong> para restaurar um projeto salvo.
              </p>
              <div className="h-48">
                <DropZone onFileSelect={handleFileSelect} disabled={false} />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* File Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-lg border border-blue-100 flex items-center justify-center shadow-sm">
                    <FileUp size={24} className="text-blue-500" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-400 uppercase">Arquivo Selecionado</p>
                    <p className="text-sm font-bold text-slate-700 truncate" title={file.name}>{file.name}</p>
                    <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                 </div>
                 <button 
                    type="button" 
                    onClick={() => { setFile(null); setName(''); }}
                    className="text-xs font-bold text-blue-600 hover:underline"
                 >
                    Alterar
                 </button>
              </div>

              {/* Name Input - Só mostra se NÃO for JSON, pois JSON já tem nome */}
              {!file.name.toLowerCase().endsWith('.json') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                      <Type size={14} /> Nomear Peça / Grupo
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-lg font-medium border-2 border-slate-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                      placeholder="Ex: Armário Superior"
                      autoFocus
                    />
                    <p className="text-[10px] text-slate-400 mt-2">
                      Este nome será usado para identificar o conjunto de peças na lista.
                    </p>
                  </div>
              )}

              {/* Extraction Options */}
              {!file.name.toLowerCase().endsWith('.json') && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      id="swapDims"
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                      checked={swapDimensions}
                      onChange={(e) => setSwapDimensions(e.target.checked)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Inverter Comprimento e Largura</p>
                      <p className="text-[10px] text-slate-500">Troca as medidas se a extração 3D não identificar a orientação correta.</p>
                    </div>
                  </label>
                </div>
              )}
              
              {file.name.toLowerCase().endsWith('.json') && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium">
                      <p>Este arquivo parece ser um backup de projeto. Ao confirmar, o projeto atual será substituído pelo conteúdo deste arquivo.</p>
                  </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={18} /> 
                  {file.name.toLowerCase().endsWith('.json') ? 'Restaurar Projeto' : 'Importar Peças'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
