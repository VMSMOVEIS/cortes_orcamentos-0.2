
import React, { useCallback } from 'react';
import { Upload, FileBox } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, disabled }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      
      const file = e.dataTransfer.files[0];
      // Adicionado .json na lista de extensões válidas
      const validExtensions = ['.gltf', '.glb', '.obj', '.fbx', '.dae', '.json'];
      const fileName = file?.name.toLowerCase();
      
      if (file && validExtensions.some(ext => fileName.endsWith(ext))) {
        onFileSelect(file);
      } else {
        alert("Envie um arquivo 3D válido ou um backup de projeto (.json)");
      }
    },
    [disabled, onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
        disabled
          ? 'border-slate-300 bg-slate-100 opacity-50 cursor-not-allowed'
          : 'border-blue-400 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-600 cursor-pointer'
      }`}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        // Adicionado .json no accept
        accept=".gltf,.glb,.obj,.fbx,.dae,.json"
        onChange={handleChange}
        disabled={disabled}
      />
      <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center gap-4">
        <div className="bg-blue-100 p-4 rounded-full text-blue-600">
          <Upload size={32} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Arraste seu modelo 3D ou Projeto Salvo</h3>
          <p className="text-sm text-slate-500 mt-1">Suporta .GLB, .FBX, .OBJ, .DAE e Backups (.JSON)</p>
        </div>
      </label>
    </div>
  );
};
