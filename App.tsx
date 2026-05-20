
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PartTable } from './components/PartTable';
import { ExportPanel } from './components/ExportPanel';
import { OptimizationPanel } from './components/OptimizationPanel';
import { PrintPreview } from './components/PrintPreview'; 
import { MaterialManager } from './components/MaterialManager';
import { HardwareManager } from './components/HardwareManager';
import { EdgeBandManager } from './components/EdgeBandManager'; 
import { ExtractedHardwarePanel } from './components/ExtractedHardwarePanel'; 
import { AssemblyGuide } from './components/AssemblyGuide'; 
import { FinancialSettings } from './components/FinancialSettings';
import { ReportPanel } from './components/ReportPanel'; 
import { ProjectNameModal } from './components/ProjectNameModal';
import { NewProjectModal } from './components/NewProjectModal';
import { FileImportModal } from './components/FileImportModal'; 
import { MaterialMapper } from './components/MaterialMapper';
import { ManualLayoutEditor } from './components/ManualLayoutEditor'; 
import { TimelineView } from './components/TimelineView';
import { DropZone } from './components/DropZone'; 
import { parse3DFile } from './services/geometryEngine';
import { analyzePartsLocally, generateAutomatedNotes } from './services/localAnalyzer'; 
import { 
  ProcessedPart, ExtractedComponent, ProcessingStatus, RegisteredMaterial, 
  RegisteredHardware, RegisteredEdgeBand, OptimizationResult, OptimizationConfig, 
  EdgeBanding, EdgeType, RegisteredCollaborator, RegisteredSupplier, 
  RegisteredUnit, RegisteredTax, RegisteredIndirectCost, RegisteredEquipment 
} from './types';
import { BudgetPanel } from './components/BudgetPanel';
import { RegistrationsView } from './components/RegistrationsView';
import { 
  Menu, Save, SlidersHorizontal, LayoutList, 
  LayoutGrid, Move, Printer, FilePlus, FolderOpen, 
  FileOutput, Settings, LogOut, FileType, Flag,
  Box, Scissors, ChevronRight, ChevronUp, ChevronDown, X, Loader2, FileSpreadsheet, Trash2, Home, ArrowDown, ArrowRight, RefreshCw, Ban, RotateCw, UploadCloud, GripHorizontal, Disc, Wrench, Hammer, FileText, Undo2, Redo2, Calculator, TrendingUp, CheckCircle2, ClipboardList, Calendar
} from 'lucide-react';

import { DEFAULT_HARDWARE_LIST } from './src/constants';

const STORAGE_KEYS = {
    PARTS: 'cutlist_parts_pro_v4',
    EXTRACTED_HARDWARE: 'cutlist_hardware_extracted_pro_v4', 
    PROJECT_NAME: 'cutlist_project_pro_v4',
    MATERIALS: 'cutlist_materials_pro_v4',
    HARDWARE: 'cutlist_hardware_pro_v4',
    EDGE_BANDS: 'cutlist_edgebands_pro_v4', 
    CONFIG: 'cutlist_config_pro_v4', 
    LAST_UPDATE: 'cutlist_last_sync_pro',
    COLLABORATORS: 'cutlist_collaborators_v1',
    SUPPLIERS: 'cutlist_suppliers_v1',
    UNITS: 'cutlist_units_v1',
    TAXES: 'cutlist_taxes_v1',
    INDIRECT_COSTS: 'cutlist_indirect_costs_v1',
    EQUIPMENT: 'cutlist_equipment_v1'
};

type ViewMode = 'home' | 'parts' | 'hardware' | 'results' | 'editor' | 'assembly' | 'report' | 'print' | 'config' | 'export' | 'budget' | 'registrations' | 'timeline';

const App: React.FC = () => {
  // --- STATE ---
  const [status, setStatus] = useState<ProcessingStatus>({ step: 'idle', message: '' });
  const [activeView, setActiveView] = useState<ViewMode>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCutProjectExpanded, setIsCutProjectExpanded] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false); 
  
  // Auto-expand Cut Project menu if active view is a child
  useEffect(() => {
      if (['hardware', 'results', 'report', 'editor', 'assembly', 'export', 'print'].includes(activeView)) {
          setIsCutProjectExpanded(true);
      }
  }, [activeView]);

  // Lifted State: Optimization Result
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  
  // Configurações Globais de Corte (Persistentes)
  const [globalConfig, setGlobalConfig] = useState<OptimizationConfig>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return saved ? JSON.parse(saved) : {
        sheetWidth: 2750,
        sheetHeight: 1830,
        bladeThickness: 3,
        margin: 10,
        trimming: 0,
        allowRotation: true,
        ignoreGrain: false,
        colorMode: 'colored',
        cutDirection: 'auto', 
        forceOrientation: 'auto', // Default setting
        sawSpeed: 20,
        minutesPerSqMeter: 5, // Default 5 min/m2
        edgeBandStyle: 'solid',
        costPerCut: 0.50, // Default value
        monthlyRevenueGoal: 50000, // Default goal
        financialSettings: {
            desiredMonthlyProfit: 15000, // Default profit
            opportunityCost: 2000, // Default opportunity cost
            theoreticalVariableCost: 0 // Default
        },
        laborCostSettings: {
            hourlyRate: 50,
            workedHours: 8,
            directCosts: 0,
            indirectCosts: 0,
            assemblyTimePerPart: 10, // Default 10 minutes per part
            numberOfEmployees: 1,
            workingDays: 22,
            hoursPerDay: 8
        }
      };
  });

  const [parts, setParts] = useState<ProcessedPart[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.PARTS);
      if (!saved) return [];
      try {
          const parsed = JSON.parse(saved);
          return parsed.map((p: any) => ({
              ...p,
              notes: Array.isArray(p.notes) ? p.notes : [],
              // Migrate old boolean edges to new EdgeType structure if needed
              edges: p.edges ? {
                  long1: typeof p.edges.long1 === 'boolean' ? (p.edges.long1 ? 'solid' : 'none') : p.edges.long1,
                  long2: typeof p.edges.long2 === 'boolean' ? (p.edges.long2 ? 'solid' : 'none') : p.edges.long2,
                  short1: typeof p.edges.short1 === 'boolean' ? (p.edges.short1 ? 'solid' : 'none') : p.edges.short1,
                  short2: typeof p.edges.short2 === 'boolean' ? (p.edges.short2 ? 'solid' : 'none') : p.edges.short2,
              } : { long1: 'none', long2: 'none', short1: 'none', short2: 'none' },
              originalData: p.originalData || []
          }));
      } catch (e) { return []; }
  });

  // --- UNDO / REDO STATE ---
  const [history, setHistory] = useState<ProcessedPart[][]>([]);
  const [future, setFuture] = useState<ProcessedPart[][]>([]);

  // Helper: Registra o estado atual no histórico antes de uma mudança
  const updatePartsWithHistory = (newPartsAction: ProcessedPart[] | ((prev: ProcessedPart[]) => ProcessedPart[])) => {
      setHistory(prevHist => [...prevHist, parts]);
      setFuture([]); // Limpa o futuro quando uma nova ação é feita
      setParts(newPartsAction);
  };

  const handleUndo = useCallback(() => {
      if (history.length === 0) return;
      const previous = history[history.length - 1];
      const newHistory = history.slice(0, history.length - 1);
      
      setFuture(prevFut => [parts, ...prevFut]); // Salva o atual no futuro
      setParts(previous);
      setHistory(newHistory);
  }, [history, parts]);

  const handleRedo = useCallback(() => {
      if (future.length === 0) return;
      const next = future[0];
      const newFuture = future.slice(1);

      setHistory(prevHist => [...prevHist, parts]); // Salva o atual no passado
      setParts(next);
      setFuture(newFuture);
  }, [future, parts]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
              e.preventDefault();
              if (e.shiftKey) handleRedo();
              else handleUndo();
          }
          if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
              e.preventDefault();
              handleRedo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);


  // Novo estado para ferragens extraídas
  const [extractedHardware, setExtractedHardware] = useState<ExtractedComponent[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.EXTRACTED_HARDWARE);
      if (!saved) return [];
      try {
          return JSON.parse(saved);
      } catch (e) { return []; }
  });

  const [projectName, setProjectName] = useState(() => localStorage.getItem(STORAGE_KEYS.PROJECT_NAME) || 'Novo Projeto');
  
  const [materials, setMaterials] = useState<RegisteredMaterial[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      return saved ? JSON.parse(saved) : [
          { id: '1', name: 'MDF Branco TX 15mm', thickness: 15, hasEdgeBand: true, edgeStyle: 'solid' },
          { id: '2', name: 'MDF Branco 6mm', thickness: 6, hasEdgeBand: true, edgeStyle: 'solid' },
          { id: '3', name: 'MDF Louro Freijó 15mm', thickness: 15, hasEdgeBand: true, edgeStyle: 'solid', edgeColor: 'Louro Freijó' },
          { id: '4', name: 'Duraplac 3mm', thickness: 3, hasEdgeBand: false },
          { id: '5', name: 'Vidro 4mm', thickness: 4, hasEdgeBand: false },
          { id: '6', name: 'Espelho 3mm', thickness: 3, hasEdgeBand: false }
      ];
  });

  const [edgeRegistry, setEdgeRegistry] = useState<RegisteredEdgeBand[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.EDGE_BANDS);
      return saved ? JSON.parse(saved) : [
          { id: '1', name: 'Fita Branca TX', thickness: 0.45, colorCategory: 'Unicolor' },
          { id: '2', name: 'Fita Louro Freijó', thickness: 0.45, colorCategory: 'Madeirado' },
          { id: '3', name: 'Fita Preta TX', thickness: 0.45, colorCategory: 'Unicolor' }
      ];
  });

  // Estado para armazenar o material padrão selecionado na criação do projeto
  const [activeDefaultMaterial, setActiveDefaultMaterial] = useState<RegisteredMaterial | null>(null);

  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // --- STATS ---
  const projectStats = useMemo(() => {
      let doors = 0;
      let drawers = 0;
      parts.forEach(p => {
          const name = (p.finalName || '').toLowerCase();
          const orig = (p.originalName || '').toLowerCase();
          const cat = (p.groupCategory || '').toLowerCase();
          const combined = `${name} ${orig} ${cat}`;

          if (combined.includes('porta') || combined.includes('basculante')) doors += p.quantity;
          else if (combined.includes('gaveta') || combined.includes('gav.') || combined.includes('gav') ) drawers += p.quantity;
      });
      return { doors, drawers };
  }, [parts]);

  const [hardwareRegistry, setHardwareRegistry] = useState<RegisteredHardware[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.HARDWARE);
      if (saved) return JSON.parse(saved);
      return DEFAULT_HARDWARE_LIST;
  });

  const [collaborators, setCollaborators] = useState<RegisteredCollaborator[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.COLLABORATORS);
      const defaultCollaborators: RegisteredCollaborator[] = [
          { id: '1', code: 'COL-001', name: 'Carlos Alberto', role: 'Marceneiro', sector: 'Montagem', type: 'Hora Produtiva', monthRate: 3800.00, hourRate: 17.27, productionHours: 220, status: 'Ativo' },
          { id: '2', code: 'COL-002', name: 'João Pereira', role: 'Marceneiro', sector: 'Acabamento', type: 'Hora Produtiva', monthRate: 3500.00, hourRate: 15.91, productionHours: 220, status: 'Ativo' },
          { id: '3', code: 'COL-003', name: 'Ricardo Santos', role: 'Auxiliar', sector: 'Montagem', type: 'Hora Produtiva', monthRate: 2200.00, hourRate: 10.00, productionHours: 220, status: 'Ativo' },
          { id: '4', code: 'COL-004', name: 'Roberto Silva', role: 'Oper. Seccionadora', sector: 'Corte', type: 'Hora Produtiva', monthRate: 3000.00, hourRate: 13.64, productionHours: 220, status: 'Ativo' },
          { id: '5', code: 'COL-005', name: 'Rafael Santos', role: 'Oper. Coladeira', sector: 'Bordeamento', type: 'Hora Produtiva', monthRate: 3200.00, hourRate: 14.55, productionHours: 220, status: 'Ativo' },
      ];
      if (!saved) return defaultCollaborators;
      try {
          const parsed = JSON.parse(saved);
          // Migration/Safety: Ensure all have productionHours
          return parsed.map((c: any) => ({
              ...c,
              productionHours: c.productionHours || 220,
              hourRate: c.hourRate || (c.productionHours ? c.monthRate / c.productionHours : c.monthRate / 220)
          }));
      } catch (e) { return defaultCollaborators; }
  });

  const [suppliers, setSuppliers] = useState<RegisteredSupplier[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return saved ? JSON.parse(saved) : [
          { id: '1', code: 'FOR-001', name: 'Leo Madeiras', category: 'Chapas/Acessórios', contact: 'Leo Silva', phone: '(11) 98888-7777' },
          { id: '2', code: 'FOR-002', name: 'Gasometro Madeiras', category: 'Chapas/Maquinas', contact: 'Ana Clara', phone: '(11) 97777-6666' },
      ];
  });

  const [units, setUnits] = useState<RegisteredUnit[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.UNITS);
      return saved ? JSON.parse(saved) : [
          { id: 'UN', name: 'Unidade', category: 'Contagem' },
          { id: 'M2', name: 'Metro Quadrado', category: 'Área' },
          { id: 'ML', name: 'Metro Linear', category: 'Comprimento' },
      ];
  });

  const [taxes, setTaxes] = useState<RegisteredTax[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.TAXES);
      return saved ? JSON.parse(saved) : [
          { id: '1', code: 'IMP-001', name: 'Simples Nacional', value: 6.5, type: 'Faturamento', status: 'Ativo' },
      ];
  });

  const [indirectCosts, setIndirectCosts] = useState<RegisteredIndirectCost[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.INDIRECT_COSTS);
      return saved ? JSON.parse(saved) : [
          { id: '1', code: 'CI-001', name: 'Aluguel Galpão', value: 2500.00, category: 'Fixo' },
          { id: '2', code: 'CI-002', name: 'Energia Elétrica', value: 450.00, category: 'Variável' },
      ];
  });

  const [equipment, setEquipment] = useState<RegisteredEquipment[]>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
      return saved ? JSON.parse(saved) : [
          { id: '1', code: 'EQP-001', name: 'Seccionadora Vertical', brand: 'Inmes', power: '5HP', status: 'Operacional' },
          { id: '2', code: 'EQP-002', name: 'Coladeira de Bordas', brand: 'Frama', power: '3Kw', status: 'Operacional' },
      ];
  });

  // Seed default hardware if missing (for existing users)
  useEffect(() => {
      setHardwareRegistry(prev => {
          const missingDefaults = DEFAULT_HARDWARE_LIST.filter(def => 
              !prev.some(curr => curr.name === def.name)
          );
          
          if (missingDefaults.length === 0) return prev;
          
          // Merge and return new array
          return [...prev, ...missingDefaults];
      });
  }, []);

  // --- REFS & EFFECTS ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(parts));
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toLocaleString());
      if (parts.length > 0 && activeView === 'home') setActiveView('parts');
  }, [parts]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.EXTRACTED_HARDWARE, JSON.stringify(extractedHardware));
  }, [extractedHardware]);

  useEffect(() => localStorage.setItem(STORAGE_KEYS.PROJECT_NAME, projectName), [projectName]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials)), [materials]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.HARDWARE, JSON.stringify(hardwareRegistry)), [hardwareRegistry]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.EDGE_BANDS, JSON.stringify(edgeRegistry)), [edgeRegistry]); // Salva fitas
  useEffect(() => localStorage.setItem(STORAGE_KEYS.COLLABORATORS, JSON.stringify(collaborators)), [collaborators]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers)), [suppliers]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units)), [units]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(taxes)), [taxes]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.INDIRECT_COSTS, JSON.stringify(indirectCosts)), [indirectCosts]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment)), [equipment]);
  // Salva config sempre que mudar
  useEffect(() => localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(globalConfig)), [globalConfig]);

  const [tempFile, setTempFile] = useState<File | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false); // Nova modal unificada
  const [showMaterialManager, setShowMaterialManager] = useState(false);
  const [showHardwareManager, setShowHardwareManager] = useState(false);
  const [showEdgeBandManager, setShowEdgeBandManager] = useState(false); // Novo estado
  const [configTab, setConfigTab] = useState<'general' | 'financial'>('general');

  // --- ACTIONS ---

  const handleNewProjectClick = () => {
    if (parts.length > 0 && !confirm("Deseja iniciar um novo projeto? Todas as peças atuais serão removidas.")) return;
    setIsMenuOpen(false);
    setShowNewProjectModal(true);
  };
  
  const handleClearProject = () => {
      if (confirm("Tem certeza que deseja apagar todo o projeto atual? Todas as peças serão removidas permanentemente.")) {
          localStorage.removeItem(STORAGE_KEYS.PARTS);
          localStorage.removeItem(STORAGE_KEYS.EXTRACTED_HARDWARE);
          localStorage.setItem(STORAGE_KEYS.PROJECT_NAME, 'Novo Projeto');
          
          setHistory([]);
          setFuture([]);
          
          setParts([]);
          setExtractedHardware([]);
          setOptimizationResult(null);
          setProjectName('Novo Projeto');
          setActiveDefaultMaterial(null);
          setIsMenuOpen(false);
          setActiveView('home');
      }
  };

  const handleSaveProjectToDisk = async () => {
      try {
          const projectData = {
              version: '4.1',
              type: 'project_backup',
              date: new Date().toISOString(),
              name: projectName,
              parts: parts,
              extractedHardware: extractedHardware,
              materials: materials,
              hardware: hardwareRegistry,
              edgeBands: edgeRegistry // Inclui fitas no backup
          };

          const jsonString = JSON.stringify(projectData, null, 2);
          const fileName = `${projectName.replace(/[^a-z0-9]/gi, '_')}_Backup.json`;

          if ('showSaveFilePicker' in window) {
              const opts = {
                  suggestedName: fileName,
                  types: [{
                      description: 'Smart 3D Cut Project',
                      accept: { 'application/json': ['.json'] },
                  }],
              };
              // @ts-ignore
              const handle = await window.showSaveFilePicker(opts);
              const writable = await handle.createWritable();
              await writable.write(jsonString);
              await writable.close();
              alert('Projeto salvo com sucesso no seu computador!');
          } else {
              const blob = new Blob([jsonString], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              alert('Download do projeto iniciado!');
          }
      } catch (err: any) {
          if (err.name !== 'AbortError') {
              console.error(err);
              alert("Erro ao salvar projeto.");
          }
      }
  };

  const handleCreateProject = (data: { orderId: string; name: string; date: string; material: RegisteredMaterial }) => {
      setParts([]);
      setHistory([]);
      setFuture([]);
      setExtractedHardware([]);
      setOptimizationResult(null);
      setProjectName(`${data.name} (${data.orderId})`);
      setActiveDefaultMaterial(data.material);
      setShowNewProjectModal(false);
      setActiveView('parts');
  };

  const handleOpenFile = () => {
    setShowImportModal(true);
    setIsMenuOpen(false);
  };

  // Lógica Unificada para carregar arquivo (JSON ou 3D)
  const handleUnifiedFileLoad = async (file: File, name: string, swapDimensions: boolean = false) => {
      const fileName = file.name.toLowerCase();

      // ... existing logic ...
      if (fileName.endsWith('.json')) {
          // ... (reader logic)
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const content = e.target?.result as string;
                  const data = JSON.parse(content);
                  
                  if (data.type === 'project_backup') {
                      if(parts.length > 0 && !confirm("Carregar este backup substituirá todo o projeto atual. Continuar?")) return;

                      // Restaura Estado
                      setProjectName(data.name || "Projeto Restaurado");
                      setParts(data.parts || []);
                      setExtractedHardware(data.extractedHardware || []);
                      if(data.materials) setMaterials(data.materials);
                      if(data.hardware) setHardwareRegistry(data.hardware);
                      if(data.edgeBands) setEdgeRegistry(data.edgeBands); // Restaura fitas
                      
                      setHistory([]);
                      setFuture([]);
                      setOptimizationResult(null);
                      setActiveView('parts');
                      alert("Projeto restaurado com sucesso!");
                  } else {
                      alert("O arquivo JSON selecionado não é um backup de projeto válido.");
                  }
              } catch (err) {
                  alert("Erro ao ler arquivo de projeto: Arquivo corrompido ou inválido.");
                  console.error(err);
              }
          };
          reader.readAsText(file);
          return;
      }

      // 2. SE FOR ARQUIVO 3D
      processFileWithName(file, name, swapDimensions);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Se for JSON, abre direto sem pedir nome extra (pois o nome está no JSON)
          if (file.name.toLowerCase().endsWith('.json')) {
              handleUnifiedFileLoad(file, "");
          } else {
              setTempFile(file);
              setShowNameModal(true);
          }
      }
      e.target.value = '';
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const validExtensions = ['.gltf', '.glb', '.obj', '.fbx', '.dae', '.json'];
        const fileName = file.name.toLowerCase();
        
        if (validExtensions.some(ext => fileName.endsWith(ext))) {
           if (fileName.endsWith('.json')) {
                handleUnifiedFileLoad(file, "");
           } else {
                setTempFile(file);
                setShowNameModal(true);
           }
        } else {
           alert("Arquivo inválido. Use .gltf, .glb, .obj, .fbx, .dae ou backups .json");
        }
    }
  };

  const processFileWithName = async (file: File, customSourceName: string, swapDimensions: boolean = false) => {
    try {
      if (parts.length === 0) setProjectName(customSourceName);
      setStatus({ step: 'parsing', message: `Lendo ${file.name}...` });
      const rawParts = await parse3DFile(file);
      if (rawParts.length === 0) throw new Error("Arquivo vazio ou inválido.");
      
      setStatus({ step: 'analyzing', message: 'Aplicando engenharia...' });
      
      // NOVA LÓGICA: Separar Painéis de Ferragens
      const { panels, hardware } = analyzePartsLocally(rawParts, parts.length, swapDimensions, edgeRegistry);
      
      const partsWithSource = panels.map(p => {
          let edgeColor = p.detectedEdgeColor;
          // Se não houver fita detectada mas temos fitas cadastradas, tenta usar a melhor fita correspondente ou deixa livre
          if (!edgeColor && edgeRegistry.length > 0) {
              const matLower = p.materialName.toLowerCase();
              const found = edgeRegistry.find(eb => {
                  const ebName = eb.name.toLowerCase();
                  return matLower.includes(ebName) || ebName.includes(matLower);
              });
              if (found) {
                  edgeColor = found.name;
              } else {
                  edgeColor = edgeRegistry[0]?.name || '';
              }
          }
          return { 
              ...p, 
              sourceFile: customSourceName, 
              detectedEdgeColor: edgeColor || '' 
          };
      });
      const hardwareWithSource = hardware.map(h => ({ ...h, sourceFile: customSourceName }));
      
      // Use updatePartsWithHistory to handle the new parts addition
      updatePartsWithHistory(prev => [...prev, ...partsWithSource]);
      setExtractedHardware(prev => [...prev, ...hardwareWithSource]);
      
      setStatus({ step: 'complete', message: 'Sucesso!' });
      setActiveView('parts');
      setTimeout(() => setStatus({ step: 'idle', message: '' }), 1500);
    } catch (error: any) {
      setStatus({ step: 'error', message: error.message || "Erro." });
      setTimeout(() => setStatus({ step: 'idle', message: '' }), 3000);
    }
  };

  const handleAddManualPart = () => {
      // Find default material: Either explicitly selected OR the most common one in current parts
      let defaultMat = activeDefaultMaterial || materials[0];
      
      if (parts.length > 0) {
          const matCounts: Record<string, number> = {};
          parts.forEach(p => {
              const key = p.materialName; 
              matCounts[key] = (matCounts[key] || 0) + 1;
          });
          // Find material with max count
          const bestMatName = Object.keys(matCounts).reduce((a, b) => matCounts[a] > matCounts[b] ? a : b);
          const found = materials.find(m => m.name === bestMatName);
          if (found) {
              defaultMat = found;
          }
      }

      const initialEdges: EdgeBanding = (defaultMat && defaultMat.hasEdgeBand === false) 
        ? { long1: 'none', long2: 'none', short1: 'none', short2: 'none' }
        : { long1: 'none', long2: 'none', short1: 'none', short2: 'none' };
      
      // @ts-ignore
      const newPart: ProcessedPart = {
          id: `manual_${Date.now()}`,
          displayId: (parts.length + 1).toString(),
          originalName: 'Peça Manual',
          finalName: 'Nova Peça',
          materialName: defaultMat ? defaultMat.name : 'Padrão',
          dimensions: { width: 500, height: 300, thickness: defaultMat ? defaultMat.thickness : 15 },
          position: { x: 0, y: 0, z: 0 },
          volume: 0,
          edges: initialEdges,
          quantity: 1,
          grainDirection: 'N/A',
          groupCategory: 'Peça',
          notes: [],
          sourceFile: 'Manual',
          hasGrain: false,
          invertDimensions: false
      };
      
      // Use history wrapper
      updatePartsWithHistory(prev => [...prev, newPart]);
      setActiveView('parts');
  };

  const handleUpdateMaterial = (updatedMaterial: RegisteredMaterial) => {
    // 1. Update materials list
    setMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));

    // 2. Check for category change migration
    const oldMaterial = materials.find(m => m.id === updatedMaterial.id);
    if (!oldMaterial) return;

    const wasSheet = !oldMaterial.category || oldMaterial.category === 'sheet';
    const isSheet = !updatedMaterial.category || updatedMaterial.category === 'sheet';

    if (wasSheet && !isSheet) {
        // Migration: Sheet -> Hardware/Component
        const partsToMigrate = parts.filter(p => p.materialName === oldMaterial.name);
        
        if (partsToMigrate.length > 0) {
            const newHardwareItems: ExtractedComponent[] = partsToMigrate.map(p => {
                return {
                    id: p.id,
                    name: updatedMaterial.name, 
                    originalName: `${p.finalName} (${p.originalName})`, 
                    category: updatedMaterial.category === 'hardware' ? 'Ferragem' : 'Componente',
                    quantity: p.quantity,
                    sourceFile: p.sourceFile,
                    dimensions: `${p.dimensions.width}x${p.dimensions.height}x${p.dimensions.thickness}`,
                    materialName: updatedMaterial.name 
                };
            });

            setExtractedHardware(prev => [...prev, ...newHardwareItems]);
            updatePartsWithHistory(prev => prev.filter(p => p.materialName !== oldMaterial.name));
            
            setStatus({ step: 'complete', message: `${partsToMigrate.length} peças movidas para Ferragens.` });
            setTimeout(() => setStatus({ step: 'idle', message: '' }), 3000);
        }
    } else if (!wasSheet && isSheet) {
        // Migration: Hardware/Component -> Sheet
        const hardwareToMigrate = extractedHardware.filter(h => h.materialName === updatedMaterial.name);
        
        if (hardwareToMigrate.length > 0) {
            const newParts: ProcessedPart[] = hardwareToMigrate.map(h => {
                let width = 0, height = 0, thickness = updatedMaterial.thickness;
                if (h.dimensions) {
                    const dims = h.dimensions.split('x').map(Number);
                    if (dims.length >= 2) {
                        width = dims[0];
                        height = dims[1];
                        if (dims.length >= 3) thickness = dims[2];
                    }
                }

                return {
                    id: h.id,
                    displayId: 'R',
                    originalName: h.originalName,
                    finalName: h.name,
                    materialName: updatedMaterial.name,
                    dimensions: { width, height, thickness },
                    position: { x: 0, y: 0, z: 0 },
                    volume: (width * height * thickness) / 1000000000,
                    edges: { long1: 'none', long2: 'none', short1: 'none', short2: 'none' },
                    quantity: h.quantity,
                    grainDirection: 'N/A',
                    groupCategory: 'Peça',
                    notes: [],
                    sourceFile: h.sourceFile,
                    hasGrain: false,
                    invertDimensions: false
                };
            });

            updatePartsWithHistory(prev => [...prev, ...newParts]);
            setExtractedHardware(prev => prev.filter(h => h.materialName !== updatedMaterial.name));
            
            setStatus({ step: 'complete', message: `${hardwareToMigrate.length} itens movidos para Peças.` });
            setTimeout(() => setStatus({ step: 'idle', message: '' }), 3000);
        }
    }
  };

  const handleMovePartToHardware = (partId: string) => {
    const partToMove = parts.find(p => p.id === partId);
    if (!partToMove) return;

    const newHardware: ExtractedComponent = {
        id: partToMove.id,
        name: partToMove.finalName || partToMove.originalName,
        originalName: partToMove.originalName,
        category: 'Componente',
        quantity: partToMove.quantity,
        sourceFile: partToMove.sourceFile,
        dimensions: `${partToMove.dimensions.width}x${partToMove.dimensions.height}x${partToMove.dimensions.thickness}`,
        materialName: partToMove.materialName
    };

    setExtractedHardware(prev => [...prev, newHardware]);
    updatePartsWithHistory(prev => prev.filter(p => p.id !== partId));
    
    setStatus({ step: 'complete', message: `Peça movida para Ferragens.` });
    setTimeout(() => setStatus({ step: 'idle', message: '' }), 2000);
  };

  const handleMoveHardwareToParts = (hardwareId: string) => {
    const hardwareToMove = extractedHardware.find(h => h.id === hardwareId);
    if (!hardwareToMove) return;

    let width = 0, height = 0, thickness = 15;
    if (hardwareToMove.dimensions) {
        const dims = hardwareToMove.dimensions.split('x').map(Number);
        if (dims.length >= 2) {
            width = dims[0];
            height = dims[1];
            if (dims.length >= 3) thickness = dims[2];
        }
    }

    const newPart: ProcessedPart = {
        id: hardwareToMove.id,
        displayId: (parts.length + 1).toString(),
        originalName: hardwareToMove.originalName,
        finalName: hardwareToMove.name,
        materialName: hardwareToMove.materialName || 'Padrão',
        dimensions: { width, height, thickness },
        position: { x: 0, y: 0, z: 0 },
        volume: (width * height * thickness) / 1000000000,
        edges: { long1: 'none', long2: 'none', short1: 'none', short2: 'none' },
        quantity: hardwareToMove.quantity,
        grainDirection: 'N/A',
        groupCategory: 'Peça',
        notes: [],
        sourceFile: hardwareToMove.sourceFile,
        hasGrain: false,
        invertDimensions: false
    };

    updatePartsWithHistory(prev => [...prev, newPart]);
    setExtractedHardware(prev => prev.filter(h => h.id !== hardwareId));
    
    setStatus({ step: 'complete', message: `Item movido para Extração de Peças.` });
    setTimeout(() => setStatus({ step: 'idle', message: '' }), 2000);
  };

  // --- UI COMPONENTS ---

  const SidebarBtn = ({ icon: Icon, label, active, onClick }: any) => (
      <button 
        onClick={onClick}
        className={`relative group w-full flex flex-col items-center justify-center py-3.5 px-1 transition-all duration-300 outline-none ${
            active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        }`}
      >
          <div className={`transition-all duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
          </div>
          <span className={`text-[8px] font-bold uppercase tracking-[0.1em] mt-2 transition-all duration-300 ${active ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
            {label}
          </span>
          
          {/* Active indicator */}
          {active && (
            <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full shadow-[2px_0_10px_rgba(59,130,246,0.8)] animate-in fade-in slide-in-from-left-2" />
          )}

          {/* Subtle glow for active */}
          {active && (
            <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
          )}
      </button>
  );

  const MenuItem = ({ icon: Icon, label, shortcut, onClick, danger = false }: any) => (
      <button 
        onClick={onClick}
        className={`w-full text-left px-4 py-3 cursor-pointer flex items-center gap-4 rounded-xl transition-all duration-200 group ${danger ? 'text-red-500 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
          <div className={`p-2 rounded-lg transition-colors ${danger ? 'bg-red-100/50' : 'bg-slate-50 group-hover:bg-white'}`}>
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <span className="flex-1 font-bold text-xs uppercase tracking-wider">{label}</span>
          {shortcut && <span className="text-[10px] font-black text-slate-300 bg-white border border-slate-100 px-1.5 py-0.5 rounded shadow-sm transition-all group-hover:text-slate-500 group-hover:border-slate-200">{shortcut}</span>}
      </button>
  );

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans text-slate-900 select-none">
      
      {/* 1. SIDEBAR (Left) */}
      <aside className="w-20 bg-slate-950 flex flex-col border-r border-slate-800 z-50 shrink-0 print:hidden shadow-2xl relative">
          {/* Menu Button Area */}
          <div className="p-3 border-b border-slate-800/50">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-full aspect-square flex items-center justify-center rounded-xl transition-all duration-300 ${isMenuOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50'}`}
            >
                <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-sidebar-scrollbar py-2">
            <SidebarBtn icon={ClipboardList} label="Cadastros" active={activeView === 'registrations'} onClick={() => setActiveView('registrations')} />
            <SidebarBtn icon={LayoutList} label="Extração" active={activeView === 'parts'} onClick={() => setActiveView('parts')} />
            <SidebarBtn icon={FileSpreadsheet} label="Exportar" active={activeView === 'export'} onClick={() => setActiveView('export')} />
            <SidebarBtn icon={Calculator} label="Orçamentos" active={activeView === 'budget'} onClick={() => setActiveView('budget')} />
            <SidebarBtn icon={FileText} label="Relatórios" active={activeView === 'report'} onClick={() => setActiveView('report')} />
            <SidebarBtn icon={LayoutGrid} label="Resultados" active={activeView === 'results'} onClick={() => setActiveView('results')} />
            <SidebarBtn icon={Move} label="Editor" active={activeView === 'editor'} onClick={() => setActiveView('editor')} />
            <SidebarBtn icon={Hammer} label="Montagem" active={activeView === 'assembly'} onClick={() => setActiveView('assembly')} />
            <SidebarBtn icon={Calendar} label="Cronograma" active={activeView === 'timeline'} onClick={() => setActiveView('timeline')} />
            <SidebarBtn icon={Printer} label="Impressão" active={activeView === 'print'} onClick={() => setActiveView('print')} />
          </div>
          
          <div className="p-4 border-t border-slate-800/50">
             <div className="text-[7px] text-center text-slate-600 font-bold uppercase tracking-tighter leading-tight">
               Smart 3D<br/><span className="text-blue-500/50">Cut Pro v4.1</span>
             </div>
          </div>
      </aside>

      {/* 2. MENU DRAWER */}
      {isMenuOpen && (
          <>
            {/* Backdrop for closing */}
            <div className="fixed inset-0 z-30 bg-black/5" onClick={() => setIsMenuOpen(false)} />
            
            <div className="absolute top-0 left-20 bottom-0 w-72 bg-white border-r border-slate-200 shadow-[0_0_40px_rgba(0,0,0,0.1)] z-40 animate-in slide-in-from-left-10 fade-in duration-300 print:hidden flex flex-col">
                <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center group">
                    <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-sm uppercase tracking-wider">Ações do Projeto</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Gerenciamento Geral</span>
                    </div>
                    <button 
                        onClick={() => setIsMenuOpen(false)}
                        className="p-1.5 hover:bg-white hover:text-red-500 rounded-lg text-slate-400 border border-transparent hover:border-slate-200 transition-all active:scale-95"
                    >
                        <X size={16}/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <MenuItem icon={Home} label="Visão Geral / Início" onClick={() => { setActiveView('home'); setIsMenuOpen(false); }} />
                  
                  <div className="pt-4 pb-2 px-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ferramentas de Fluxo</span>
                  </div>
                  
                  <MenuItem icon={FilePlus} label="Novo Projeto" onClick={handleNewProjectClick} />
                  <MenuItem icon={FolderOpen} label="Importar Arquivo" shortcut="Ctrl+O" onClick={handleOpenFile} />
                  <MenuItem icon={Save} label="Backup do Projeto (.json)" shortcut="Ctrl+S" onClick={() => { handleSaveProjectToDisk(); setIsMenuOpen(false); }} />
                  
                  <div className="pt-4 pb-2 px-3 flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sistema</span>
                  </div>
                  
                  <MenuItem icon={Settings} label="Configurações Técnicas" onClick={() => { setActiveView('config'); setIsMenuOpen(false); }} />
                  <MenuItem icon={Trash2} label="Resetar Ambiente" onClick={handleClearProject} danger />
                  
                  <div className="mt-auto px-4 py-6 border-t border-slate-50">
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white transition-all duration-300"
                    >
                        <LogOut size={14} /> Sair da Aplicação
                    </button>
                  </div>
                </div>
            </div>
          </>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-white relative overflow-hidden">
          
          {/* Top Bar */}
          <div className="h-12 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0 print:hidden shadow-sm z-20">
             <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Módulo Ativo</span>
                        <div className="flex items-center gap-2">
                            <span className="font-black text-xs uppercase text-blue-600 transition-all">
                              {activeView === 'home' ? 'Painel Início' : 
                               activeView === 'config' ? 'Configurações' : 
                               activeView === 'hardware' ? 'Ferragens' : 
                               activeView === 'timeline' ? 'Cronograma' : 
                               activeView}
                            </span>
                            <ChevronRight size={10} className="text-slate-300" />
                            <input 
                                type="text" 
                                value={projectName} 
                                onChange={e => setProjectName(e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-blue-500/30 focus:border-blue-500 text-sm font-black text-slate-900 outline-none w-64 transition-all"
                            />
                        </div>
                    </div>
                 </div>
 
                 {parts.length > 0 && (
                     <div className="flex items-center gap-4 ml-2 border-l border-slate-100 pl-6 h-8">
                         <div className="flex flex-col items-center" title="Total de Portas detectadas">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Portas</span>
                             <div className="flex items-center gap-1">
                                <Box size={10} className="text-blue-500" />
                                <span className="text-xs font-black text-slate-800">{projectStats.doors}</span>
                             </div>
                         </div>
                         <div className="flex flex-col items-center" title="Total de Gavetas detectadas">
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Gavetas</span>
                             <div className="flex items-center gap-1">
                                <LayoutGrid size={10} className="text-emerald-500" />
                                <span className="text-xs font-black text-slate-800">{projectStats.drawers}</span>
                             </div>
                         </div>
                     </div>
                 )}
 
                 {/* Undo/Redo Controls */}
                 <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200 ml-4 group">
                     <button 
                        onClick={handleUndo} 
                        disabled={history.length === 0}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-20 transition-all active:scale-90"
                        title="Desfazer (Ctrl+Z)"
                     >
                         <Undo2 size={16} />
                     </button>
                     <div className="w-px h-4 bg-slate-200 mx-1"></div>
                     <button 
                        onClick={handleRedo} 
                        disabled={future.length === 0}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-20 transition-all active:scale-90"
                        title="Refazer (Ctrl+Y)"
                     >
                         <Redo2 size={16} />
                     </button>
                 </div>
             </div>
 
             {status.step !== 'idle' && (
                 <div className="flex items-center gap-3 bg-blue-50 text-blue-600 border border-blue-100 pl-2 pr-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm animate-in zoom-in-95 duration-300">
                     <div className="bg-blue-600 p-1 rounded-lg">
                        <Loader2 size={12} className="animate-spin text-white" />
                     </div>
                     {status.message}
                 </div>
             )}
          </div>

          {/* Viewport Content */}
          <div className="flex-1 overflow-auto custom-scrollbar relative bg-[#f0f2f5] p-2 print:p-0 print:bg-white">
              
              {activeView === 'home' && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="mb-8 relative group">
                          <Scissors size={80} className="text-blue-600 relative z-10" strokeWidth={1.5} />
                          <div className="absolute inset-0 bg-blue-200 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      </div>
                      
                      <h1 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">Smart 3D Cut <span className="text-blue-600">Pro</span></h1>
                      <p className="text-slate-500 mb-8 font-medium">Extração automática de peças e planos de corte</p>
                      
                      <div className="w-full max-w-md space-y-6">
                          <DropZone onFileSelect={(file) => {
                              if (file.name.toLowerCase().endsWith('.json')) {
                                  handleUnifiedFileLoad(file, "");
                              } else {
                                  setTempFile(file);
                                  setShowNameModal(true);
                              }
                          }} disabled={false} />
                          
                          <div className="relative flex items-center justify-center">
                              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300"></div></div>
                              <span className="relative bg-[#f0f2f5] px-2 text-xs text-slate-500 font-bold uppercase">Ou inicie manualmente</span>
                          </div>

                          <button onClick={handleNewProjectClick} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 hover:shadow-lg rounded-xl font-bold text-slate-600 transition-all">
                              <FilePlus size={20}/>
                              <span>Criar Novo Projeto em Branco</span>
                          </button>
                      </div>

                      <div className="text-xs text-slate-400 mt-8 font-medium">Versão Profissional v4.1</div>
                  </div>
              )}

              {activeView === 'parts' && (
                  <div 
                      className="w-full space-y-6 pb-20 relative min-h-full"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                  >
                        {/* Drag Overlay */}
                        {isDraggingOver && (
                           <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-xl z-50 flex items-center justify-center pointer-events-none backdrop-blur-sm m-4">
                              <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center animate-bounce">
                                 <UploadCloud size={64} className="text-blue-600 mb-4"/>
                                 <h3 className="text-2xl font-black text-slate-800">Solte para Adicionar</h3>
                                 <p className="text-slate-500 font-medium">O arquivo será mesclado ao projeto atual.</p>
                              </div>
                           </div>
                        )}

                        {parts.length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
                               <p className="mb-4 font-medium">Nenhuma peça carregada.</p>
                               <div className="flex gap-4">
                                  <button onClick={handleAddManualPart} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-2">
                                      <FilePlus size={18}/> Inserir Peça Manual
                                  </button>
                                  <button onClick={handleOpenFile} className="bg-white border border-slate-300 text-slate-600 px-6 py-2 rounded-lg font-bold hover:bg-slate-50 flex items-center gap-2">
                                      <FolderOpen size={18}/> Carregar Arquivo
                                  </button>
                               </div>
                           </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                <div className="flex gap-6 items-start w-full">
                                    <div className="flex-1 space-y-6 overflow-hidden">
                                {/* NEW HEADER */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                                            <div className="p-2 bg-slate-100 rounded-lg"><LayoutList className="text-blue-600" size={28}/></div>
                                            Gerenciamento de Peças
                                        </h2>
                                        <p className="text-sm text-slate-500 font-medium ml-12 -mt-2">Extração e organização das peças do projeto</p>
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <button 
                                            onClick={handleOpenFile} 
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all shadow-sm text-sm"
                                        >
                                            <FolderOpen size={18}/>
                                            Adicionar Arquivo 3D
                                        </button>
                                        <button 
                                            onClick={handleNewProjectClick} 
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xl shadow-blue-200 transition-all text-sm uppercase tracking-wider"
                                        >
                                            <FilePlus size={18}/>
                                            Novo Projeto
                                        </button>
                                    </div>
                                </div>

                                {/* STATS GRID */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {[
                                        { 
                                            label: 'TOTAL DE PEÇAS', 
                                            value: parts.reduce((acc, p) => acc + (p.quantity || 1), 0), 
                                            unit: 'peças', 
                                            sub: 'Encontradas no projeto', 
                                            icon: Box, 
                                            color: 'text-blue-600', 
                                            bg: 'bg-blue-100' 
                                        },
                                        { 
                                            label: 'ÁREA TOTAL', 
                                            value: (parts.reduce((acc, p) => acc + (p.dimensions.width * p.dimensions.height * p.quantity), 0) / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
                                            unit: 'm²', 
                                            sub: 'Área total das peças', 
                                            icon: LayoutGrid, 
                                            color: 'text-emerald-600', 
                                            bg: 'bg-emerald-100' 
                                        },
                                        { 
                                            label: 'VOLUME TOTAL', 
                                            value: (parts.reduce((acc, p) => acc + (p.dimensions.width * p.dimensions.height * p.dimensions.thickness * p.quantity), 0) / 1000000000).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }), 
                                            unit: 'm³', 
                                            sub: 'Volume das peças', 
                                            icon: Disc, 
                                            color: 'text-orange-600', 
                                            bg: 'bg-orange-100' 
                                        },
                                        { label: 'MATERIAIS UTILIZADOS', value: new Set(parts.map(p => p.materialName)).size, unit: 'materiais', sub: 'Tipos de materiais', icon: Home, color: 'text-purple-600', bg: 'bg-purple-100' },
                                        { label: 'APROVEITAMENTO', value: '78,4', unit: '%', sub: 'Média do projeto', icon: CheckCircle2, color: 'text-cyan-600', bg: 'bg-cyan-100' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-blue-300 transition-colors">
                                            <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                                                <stat.icon size={28} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-slate-800">{stat.value}</span>
                                                    <span className="text-xs font-bold text-slate-500">{stat.unit}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium">{stat.sub}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <MaterialMapper 
                                    parts={parts} 
                                    registeredMaterials={materials} 
                                    onBatchDelete={(name, thickness) => {
                                        const count = parts.filter(p => p.materialName === name && Math.round(p.dimensions.thickness) === thickness).length;
                                        if(window.confirm(`Tem certeza que deseja excluir TODAS as ${count} peças do material "${name}" (${thickness}mm)?`)) {
                                            // Use history wrapper
                                            updatePartsWithHistory(prev => prev.filter(p => !(p.materialName === name && Math.round(p.dimensions.thickness) === thickness)));
                                        }
                                    }}
                                    onBatchUpdate={(oldN, oldT, newM) => {
                                        // Use history wrapper
                                        updatePartsWithHistory(prev => prev.map(p => {
                                            // Match by Name AND Thickness
                                            if (p.materialName === oldN && Math.round(p.dimensions.thickness) === Math.round(oldT)) {
                                                // FIX: PRESERVE EXISTING EDGES UNLESS THE NEW MATERIAL EXPLICITLY FORBIDS THEM
                                                const newEdges = (newM.hasEdgeBand === false) 
                                                    ? { long1: 'none', long2: 'none', short1: 'none', short2: 'none' } as EdgeBanding
                                                    : p.edges; // Mantém a configuração de fita atual
                                                
                                                // Extract existing CUSTOM color to preserve it
                                                let customEdgeColor = undefined;
                                                const existingNote = p.notes?.find(n => n.startsWith('Fita ') && n.includes(' em '));
                                                if (existingNote) {
                                                    const match = existingNote.match(/Fita\s+(.+?)\s+em/);
                                                    if (match && match[1] !== '2ª Cor') {
                                                        customEdgeColor = match[1];
                                                    }
                                                }

                                                // Determine effective edge material name for logic
                                                const materialForGen = { 
                                                    ...newM, 
                                                    edgeColor: customEdgeColor || newM.edgeColor 
                                                };

                                                // Auto-Sync: Regenerate automated notes using the new material's definitions OR custom preserved color
                                                // Detect Boleado from Original Name (UPDATED KEYWORDS)
                                                const isBoleado = (p.originalName || '').toLowerCase().match(/bolead|abalu|arredond|curv/);
                                                const systemNotes = generateAutomatedNotes(newEdges, { ...p.dimensions, thickness: newM.thickness }, materialForGen, p.detectedEdgeColor, !!isBoleado);
                                                
                                                // Preserve manual notes
                                                const manualNotes = (p.notes || []).filter(n => !n.startsWith('Fita') && !n.startsWith('Fita:'));

                                                return { 
                                                    ...p, 
                                                    materialName: newM.name, 
                                                    dimensions: { ...p.dimensions, thickness: newM.thickness }, 
                                                    edges: newEdges,
                                                    notes: [...manualNotes, ...systemNotes] 
                                                };
                                            }
                                            return p;
                                        }));
                                    }}
                                />
                                <PartTable 
                                    parts={parts} 
                                    availableMaterials={materials}
                                    availableEdgeBands={edgeRegistry} // Pass the edge registry to PartTable
                                    onUpdatePart={(id, f, v) => updatePartsWithHistory(prev => prev.map(p => {
                                        if (p.id !== id) return p;
                                        
                                        let updatedPart = { ...p, [f]: v };
                                        
                                        // Detect Boleado from Original Name (UPDATED KEYWORDS)
                                        const isBoleado = (p.originalName || '').toLowerCase().match(/bolead|abalu|arredond|curv/);

                                        // Special logic for Material Change or Dimension Change -> Recalculate Notes
                                        if (f === 'materialName') {
                                            const mat = materials.find(m => m.name === v);
                                            if (mat) {
                                                // FIX: PRESERVE EXISTING EDGES UNLESS THE NEW MATERIAL EXPLICITLY FORBIDS THEM
                                                const newEdges = (mat.hasEdgeBand === false) 
                                                    ? { long1: 'none', long2: 'none', short1: 'none', short2: 'none' } as EdgeBanding
                                                    : p.edges; // Mantém a configuração de fita atual
                                                
                                                updatedPart = { ...updatedPart, dimensions: { ...p.dimensions, thickness: mat.thickness }, edges: newEdges };
                                                updatedPart.notes = generateAutomatedNotes(newEdges, updatedPart.dimensions, mat, p.detectedEdgeColor, !!isBoleado);
                                            }
                                        } else if (f === 'width' || f === 'height' || f === 'thickness') {
                                            const val = Number(v);
                                            let newDim = { ...p.dimensions, [f]: val };
                                            let newEdges = { ...p.edges };
                                            
                                            // NOVO: Garantir que o maior sempre fique no COMPRIMENTO (width)
                                            if (f !== 'thickness' && (newDim.width < newDim.height)) {
                                                const temp = newDim.width;
                                                newDim.width = newDim.height;
                                                newDim.height = temp;
                                            }

                                            updatedPart = { ...p, dimensions: newDim, edges: newEdges };
                                            const mat = materials.find(m => m.name === p.materialName);
                                            updatedPart.notes = generateAutomatedNotes(newEdges, updatedPart.dimensions, mat, p.detectedEdgeColor, !!isBoleado);
                                        } else if (f === 'swapDimensions') {
                                            const newDimensions = {
                                                ...p.dimensions,
                                                width: p.dimensions.height,
                                                height: p.dimensions.width
                                            };
                                            const newEdges: EdgeBanding = {
                                                long1: p.edges.short1,
                                                long2: p.edges.short2,
                                                short1: p.edges.long1,
                                                short2: p.edges.long2
                                            };
                                            updatedPart = { ...p, dimensions: newDimensions, edges: newEdges };
                                            const mat = materials.find(m => m.name === p.materialName);
                                            updatedPart.notes = generateAutomatedNotes(newEdges, newDimensions, mat, p.detectedEdgeColor, !!isBoleado);
                                        } else if (f === 'invertDimensions') {
                                            // NOVO: Quando inverter dimensões, fazemos o swap real de W/H e fitas
                                            // para que apareça instantaneamente na lista conforme solicitado
                                            const newDimensions = {
                                                ...p.dimensions,
                                                width: p.dimensions.height,
                                                height: p.dimensions.width
                                            };
                                            const newEdges: EdgeBanding = {
                                                long1: p.edges.short1,
                                                long2: p.edges.short2,
                                                short1: p.edges.long1,
                                                short2: p.edges.long2
                                            };
                                            updatedPart = { 
                                                ...p, 
                                                dimensions: newDimensions, 
                                                edges: newEdges,
                                                invertDimensions: v // Mantém o estado boolean para controle visual
                                            };
                                            const mat = materials.find(m => m.name === p.materialName);
                                            updatedPart.notes = generateAutomatedNotes(newEdges, newDimensions, mat, p.detectedEdgeColor, !!isBoleado);
                                        } else if (f === 'hasGrain') {
                                            // Sincroniza o boolean hasGrain com o campo grainDirection ('0' = Horizontal, 'N/A' = Livre)
                                            updatedPart = { 
                                                ...p, 
                                                hasGrain: v,
                                                grainDirection: v ? '0' : 'N/A'
                                            };
                                        } else if (f === 'edges') {
                                            const mat = materials.find(m => m.name === p.materialName);
                                            
                                            const currentNotes = p.notes || [];
                                            const manualNotes = currentNotes.filter(n => !n.startsWith('Fita'));
                                            const newAutoNotes = generateAutomatedNotes(v, p.dimensions, mat, p.detectedEdgeColor, !!isBoleado);
                                            
                                            updatedPart.notes = [...manualNotes, ...newAutoNotes];
                                        } else if (f === 'detectedEdgeColor') {
                                            const mat = materials.find(m => m.name === p.materialName);
                                            const currentNotes = p.notes || [];
                                            const manualNotes = currentNotes.filter(n => !n.startsWith('Fita'));
                                            // Pass the new edge color (v) to regenerate notes
                                            const newAutoNotes = generateAutomatedNotes(p.edges, updatedPart.dimensions, mat, v, !!isBoleado);
                                            updatedPart.notes = [...manualNotes, ...newAutoNotes];
                                        }

                                        return updatedPart;
                                    }))}
                                    onDeletePart={id => updatePartsWithHistory(prev => prev.filter(p => p.id !== id))}
                                    onMoveToHardware={handleMovePartToHardware}
                                    onDuplicatePart={id => {
                                        const p = parts.find(p => p.id === id);
                                        if(p) updatePartsWithHistory(prev => [...prev, { ...p, id: `copy_${Date.now()}`, displayId: (prev.length+1).toString(), finalName: `${p.finalName} (Cópia)`}]);
                                    }}
                                    onAddPart={handleAddManualPart}
                                />

                                {/* INTEGRATED HARDWARE SECTION */}
                                <div className="mt-10 pt-10 border-t border-slate-200">
                                    <ExtractedHardwarePanel 
                                        hardware={extractedHardware} 
                                        hardwareRegistry={hardwareRegistry}
                                        onDelete={(id) => setExtractedHardware(prev => prev.filter(h => h.id !== id))} 
                                        onMoveToParts={handleMoveHardwareToParts}
                                        onAdd={(hw) => setExtractedHardware(prev => [...prev, hw])}
                                    />
                                </div>
                            </div>

                                    {/* SIDEBAR */}
                                    {isRightSidebarOpen ? (
                                        <div className="w-80 space-y-6 shrink-0 hidden xl:block animate-in slide-in-from-right-10 duration-300">
                                            <div className="flex justify-between items-center bg-white px-4 py-2 rounded-t-2xl border-x border-t border-slate-200">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Painel de Resumo</span>
                                                <button onClick={() => setIsRightSidebarOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                                                    <ArrowRight size={14} />
                                                </button>
                                            </div>
                                            <div className="space-y-6">
                                                {/* RESUMO DO PROJETO */}
                                                <div className="bg-white p-6 rounded-b-2xl border border-slate-200 shadow-sm mt-[-1px]">
                                                    <div className="space-y-3">
                                                        {[
                                                            { label: 'Total de Peças', value: `${parts.reduce((acc, p) => acc + (p.quantity || 1), 0)} peças` },
                                                            { label: 'Área Total', value: `${(parts.reduce((acc, p) => acc + (p.dimensions.width * p.dimensions.height * p.quantity), 0) / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} m²` },
                                                            { label: 'Volume Total', value: `${(parts.reduce((acc, p) => acc + (p.dimensions.width * p.dimensions.height * p.dimensions.thickness * p.quantity), 0) / 1000000000).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} m³` },
                                                            { label: 'Materiais Utilizados', value: new Set(parts.map(p => p.materialName)).size },
                                                            ...(() => {
                                                                const edgeTotals: Record<string, number> = {};
                                                                parts.forEach(p => {
                                                                    const qty = p.quantity || 1;
                                                                    const { width, height } = p.dimensions;
                                                                    const { long1, long2, short1, short2 } = p.edges;
                                                                    
                                                                    const getEdgeName = (type: string) => {
                                                                        if (type === 'none') return null;
                                                                        if (p.detectedEdgeColor) return p.detectedEdgeColor;
                                                                        if (type === 'solid') return 'Sólida';
                                                                        if (type === 'dashed') return 'Pontilhada';
                                                                        if (type === 'colored') return 'Cor';
                                                                        return 'Fita';
                                                                    };

                                                                    [long1, long2].forEach(edge => {
                                                                        const name = getEdgeName(edge);
                                                                        if (name) edgeTotals[name] = (edgeTotals[name] || 0) + (width * qty);
                                                                    });
                                                                    [short1, short2].forEach(edge => {
                                                                        const name = getEdgeName(edge);
                                                                        if (name) edgeTotals[name] = (edgeTotals[name] || 0) + (height * qty);
                                                                    });
                                                                });
                                                                return Object.entries(edgeTotals)
                                                                    .filter(([_, mm]) => mm > 0)
                                                                    .sort((a, b) => b[1] - a[1])
                                                                    .map(([l, mm]) => ({ label: `Fita ${l}`, value: (mm / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' m' }));
                                                            })(),
                                                            { label: 'Aproveitamento Médio', value: '78,4 %' },
                                                        ].map((item, i) => (
                                                            <div key={i} className="flex justify-between items-center bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                                                                <span className="text-xs font-black text-slate-700">{item.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* ARQUIVO 3D */}
                                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Arquivo 3D</h3>
                                                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-4 mb-4">
                                                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
                                                            <CheckCircle2 size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black text-emerald-700 uppercase leading-none">Modelo carregado</div>
                                                            <div className="text-[10px] text-emerald-600 font-medium mt-1 truncate w-40">Extração concluída com sucesso</div>
                                                        </div>
                                                    </div>
                                                    <button onClick={handleOpenFile} className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-2 text-xs font-black text-slate-700 uppercase tracking-widest transition-all">
                                                        <RefreshCw size={14} className="text-blue-600" />
                                                        Trocar Arquivo
                                                    </button>
                                                </div>

                                                {/* OBSERVAÇÕES */}
                                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Observações</h3>
                                                    <div className="bg-slate-50 p-4 rounded-xl text-[10px] text-slate-500 leading-relaxed font-medium">
                                                        Peças extraídas automaticamente do modelo 3D. Revise as medidas e os acabamentos antes de gerar o orçamento.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-12 h-full shrink-0 hidden xl:flex flex-col items-center py-6 border-l border-slate-200 bg-white animate-in fade-in duration-300">
                                            <button 
                                                onClick={() => setIsRightSidebarOpen(true)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm border border-blue-100 hover:bg-blue-100 transition-all mb-4"
                                                title="Abrir Resumo"
                                            >
                                                <ArrowDown className="-rotate-90" size={18} />
                                            </button>
                                            <div className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                Resumo do Projeto
                                            </div>
                                        </div>
                                    )}
                        </div>
                    </div>
                )}
            </div>
        )}

              {activeView === 'hardware' && (
                  <ExtractedHardwarePanel 
                    hardware={extractedHardware} 
                    hardwareRegistry={hardwareRegistry}
                    onDelete={(id) => setExtractedHardware(prev => prev.filter(h => h.id !== id))} 
                    onMoveToParts={handleMoveHardwareToParts}
                    onAdd={(hw) => setExtractedHardware(prev => [...prev, hw])}
                  />
              )}

              {activeView === 'results' && (
                  <div className="min-h-full pb-20">
                      <OptimizationPanel 
                        parts={parts} 
                        projectName={projectName} 
                        hardwareRegistry={hardwareRegistry} 
                        globalConfig={globalConfig}
                        onOptimizationComplete={setOptimizationResult} 
                        result={optimizationResult} // Passa o resultado otimizado para persistência
                      />
                  </div>
              )}

              {/* ABA DE RELATÓRIO DEDICADA */}
              {activeView === 'report' && (
                  <ReportPanel 
                    result={optimizationResult} 
                    config={globalConfig}
                    projectName={projectName}
                    parts={parts} 
                    materials={materials}
                    hardware={extractedHardware}
                    hardwareRegistry={hardwareRegistry}
                    edgeRegistry={edgeRegistry}
                  />
              )}

              {activeView === 'editor' && (
                  <div className="h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <ManualLayoutEditor 
                        result={optimizationResult}
                        onUpdateResult={setOptimizationResult} 
                      />
                  </div>
              )}

              {/* ABA DE MONTAGEM */}
              {activeView === 'assembly' && (
                  <div className="min-h-full pb-20">
                      <AssemblyGuide 
                        parts={parts} 
                        projectName={projectName} 
                        hardwareRegistry={hardwareRegistry} 
                        extractedHardware={extractedHardware}
                      />
                  </div>
              )}

              {activeView === 'budget' && (
                  <div className="min-h-full pb-20">
                      <BudgetPanel 
                        parts={parts}
                        hardware={extractedHardware}
                        materials={materials}
                        hardwareRegistry={hardwareRegistry}
                        edgeRegistry={edgeRegistry}
                        collaborators={collaborators}
                        globalConfig={globalConfig}
                        setGlobalConfig={setGlobalConfig}
                        optimizationResult={optimizationResult}
                        projectName={projectName}
                        onUpdateParts={setParts}
                        onUpdateHardware={setExtractedHardware}
                        onUpdateMaterials={setMaterials}
                        onUpdateEdges={setEdgeRegistry}
                        onUpdateHardwareRegistry={setHardwareRegistry}
                      />
                  </div>
              )}

              {activeView === 'registrations' && (
                  <div className="min-h-full pb-20">
                      <RegistrationsView 
                        materials={materials}
                        edgeRegistry={edgeRegistry}
                        hardwareRegistry={hardwareRegistry}
                        collaborators={collaborators}
                        suppliers={suppliers}
                        units={units}
                        taxes={taxes}
                        indirectCosts={indirectCosts}
                        equipment={equipment}
                        onUpdateMaterials={setMaterials}
                        onUpdateEdges={setEdgeRegistry}
                        onUpdateHardware={setHardwareRegistry}
                        onUpdateCollaborators={setCollaborators}
                        onUpdateSuppliers={setSuppliers}
                        onUpdateUnits={setUnits}
                        onUpdateTaxes={setTaxes}
                        onUpdateIndirectCosts={setIndirectCosts}
                        onUpdateEquipment={setEquipment}
                        onClose={() => setActiveView('home')}
                      />
                  </div>
              )}

              {activeView === 'timeline' && <TimelineView />}

              {activeView === 'export' && (
                  <div className="max-w-6xl mx-auto mt-6 p-4 pb-20 animate-fade-in">
                      <h2 className="text-2xl font-black text-slate-700 mb-6 flex items-center gap-2">
                          <FileSpreadsheet className="text-green-600" size={28}/> Exportar Dados
                      </h2>
                      <ExportPanel parts={parts} projectName={projectName} />
                  </div>
              )}

              {activeView === 'print' && (
                  <div className="max-w-7xl mx-auto mt-6">
                       <PrintPreview 
                        result={optimizationResult} 
                        parts={parts} 
                        projectName={projectName}
                        projectOrder={optimizationResult?.meta?.orderId}
                        materialName={optimizationResult?.meta?.materialName}
                        thickness={optimizationResult?.meta?.thickness}
                        edgeBandStyle={globalConfig.edgeBandStyle || 'solid'} // PASSANDO CONFIGURAÇÃO VISUAL
                        hardwareRegistry={hardwareRegistry}
                        extractedHardware={extractedHardware}
                      />
                  </div>
              )}
              
              {activeView === 'config' && (
                  <div className="max-w-5xl mx-auto mt-6 pb-20 animate-fade-in">
                      <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <Settings className="text-slate-600" size={28} /> Configurações do Sistema
                      </h2>

                      {/* TABS */}
                      <div className="flex gap-2 mb-6 border-b border-slate-200">
                          <button 
                              onClick={() => setConfigTab('general')}
                              className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${configTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                          >
                              <SlidersHorizontal size={18}/> Geral & Parâmetros
                          </button>
                          <button 
                              onClick={() => setConfigTab('financial')}
                              className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${configTab === 'financial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                          >
                              <TrendingUp size={18}/> Financeiro e Contábil
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {configTab === 'general' && (
                            <>
                         {/* Card de Configuração de Otimização */}
                         <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
                             <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-3">
                                 <SlidersHorizontal size={20} className="text-blue-600"/> Parâmetros Técnicos (Máquina e Custo)
                             </h3>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Dimensões Padrão */}
                                <div className="space-y-4">
                                     <label className="block text-xs font-bold text-slate-500 uppercase">Tamanho Padrão da Chapa (mm)</label>
                                     <div className="flex gap-4">
                                         <div className="flex-1">
                                             <span className="text-[10px] font-bold text-slate-400">Largura</span>
                                             <input type="number" value={globalConfig.sheetWidth} onChange={e => setGlobalConfig({...globalConfig, sheetWidth: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" />
                                         </div>
                                         <div className="flex-1">
                                             <span className="text-[10px] font-bold text-slate-400">Altura</span>
                                             <input type="number" value={globalConfig.sheetHeight} onChange={e => setGlobalConfig({...globalConfig, sheetHeight: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" />
                                         </div>
                                     </div>
                                </div>

                                {/* Parâmetros da Máquina */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Espessura da Serra (mm)</label>
                                            <input type="number" value={globalConfig.bladeThickness} onChange={e => setGlobalConfig({...globalConfig, bladeThickness: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Margem de Refilo (mm)</label>
                                            <input type="number" value={globalConfig.margin} onChange={e => setGlobalConfig({...globalConfig, margin: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500" />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Custos e Visualização */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Estimativa de Tempo</label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" step="0.5" value={globalConfig.minutesPerSqMeter || 5} onChange={e => setGlobalConfig({...globalConfig, minutesPerSqMeter: Number(e.target.value)})} className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-700 outline-none focus:border-blue-500 text-center" />
                                                <span className="text-[10px] font-bold text-slate-400">min/m²</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-600 uppercase mb-2">Custo por Deslocamento (R$)</label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 text-sm">R$</span>
                                                <input type="number" step="0.01" value={globalConfig.costPerCut || 0} onChange={e => setGlobalConfig({...globalConfig, costPerCut: Number(e.target.value)})} className="w-24 bg-emerald-50 border border-emerald-200 rounded-lg p-3 font-bold text-emerald-700 outline-none focus:border-emerald-500 text-center" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </div>
                         </div>

                         {/* Gerenciadores */}
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Settings size={20}/> Catálogo de Materiais</h3>
                             <p className="text-sm text-slate-500 mb-6">Cadastre as chapas e espessuras disponíveis em seu estoque.</p>
                             <button onClick={() => setShowMaterialManager(true)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 transition-colors">Abrir Gerenciador de Materiais</button>
                         </div>
                         
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Disc size={20} className="text-emerald-600"/> Catálogo de Fitas</h3>
                             <p className="text-sm text-slate-500 mb-6">Cadastre as fitas de borda (cores e espessuras) para uso no mapeamento.</p>
                             <button onClick={() => setShowEdgeBandManager(true)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 transition-colors">Abrir Gerenciador de Fitas</button>
                         </div>

                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Settings size={20}/> Catálogo de Ferragens</h3>
                             <p className="text-sm text-slate-500 mb-6">Gerencie dobradiças, corrediças e parafusos para os manuais.</p>
                             <button onClick={() => setShowHardwareManager(true)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 transition-colors">Abrir Catálogo de Ferragens</button>
                         </div>
                            </>
                        )}

                        {configTab === 'financial' && (
                            <div className="md:col-span-2">
                                <FinancialSettings globalConfig={globalConfig} setGlobalConfig={setGlobalConfig} />
                            </div>
                        )}

                        </div>
                    </div>
                )}
            </div>
        </main>

      {/* HIDDEN INPUTS & MODALS */}
      <input type="file" ref={fileInputRef} className="hidden" accept=".gltf,.glb,.obj,.fbx,.dae,.json" onChange={handleFileSelect} />
      
      {showNameModal && tempFile && <ProjectNameModal fileName={tempFile.name} onConfirm={name => { if(tempFile) processFileWithName(tempFile, name); setShowNameModal(false); setTempFile(null); }} onCancel={() => { setShowNameModal(false); setTempFile(null); }} />}
      {showNewProjectModal && <NewProjectModal materials={materials} onConfirm={handleCreateProject} onCancel={() => setShowNewProjectModal(false)} />}
      
      {showImportModal && (
        <FileImportModal 
            onConfirm={(file, name, swap) => {
                handleUnifiedFileLoad(file, name, swap);
                setShowImportModal(false);
            }} 
            onCancel={() => setShowImportModal(false)} 
        />
      )}

      {showMaterialManager && (
        <MaterialManager 
          materials={materials} 
          onClose={() => setShowMaterialManager(false)} 
          onAdd={m => setMaterials([...materials, m])} 
          onRemove={id => setMaterials(materials.filter(m => m.id !== id))}
          onUpdate={handleUpdateMaterial}
        />
      )}
      
      {showEdgeBandManager && (
        <EdgeBandManager
          edgeBands={edgeRegistry}
          onClose={() => setShowEdgeBandManager(false)}
          onAdd={b => setEdgeRegistry([...edgeRegistry, b])}
          onRemove={id => setEdgeRegistry(edgeRegistry.filter(b => b.id !== id))}
          onUpdate={u => setEdgeRegistry(edgeRegistry.map(b => b.id === u.id ? u : b))}
        />
      )}
      
      {showHardwareManager && <HardwareManager hardwareList={hardwareRegistry} onClose={() => setShowHardwareManager(false)} onAdd={h => setHardwareRegistry([...hardwareRegistry, h])} onRemove={id => setHardwareRegistry(hardwareRegistry.filter(h => h.id !== id))} onUpdate={u => setHardwareRegistry(hardwareRegistry.map(h => h.id === u.id ? u : h))} />}
    
    </div>
  );
};

export default App;
