
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type EdgeType = 'none' | 'solid' | 'dashed' | 'colored';

export interface EdgeBanding {
  long1: EdgeType;  // Comprimento 1
  long2: EdgeType;  // Comprimento 2
  short1: EdgeType; // Largura 1
  short2: EdgeType; // Largura 2
}

export interface RawPart {
  id: string;
  originalName: string;
  materialName: string;
  dimensions: {
    width: number;
    height: number;
    thickness: number;
  };
  position: Vector3;
  volume: number;
  edges: EdgeBanding;
  svgPath?: string;
  detectedEdgeColor?: string; // Captures the specific material name of the edge
}

export interface ProcessedPart extends RawPart {
  finalName: string;
  displayId: string;
  sourceFile: string;
  quantity: number;
  grainDirection: '0' | '90' | 'N/A';
  hasGrain: boolean;
  invertDimensions: boolean;
  groupCategory: string;
  notes: string[];
  originalData?: { id: string, position: Vector3 }[];
  // Added manualId to support assembly manual indexing
  manualId?: number;
}

// New Interface for Extracted Hardware
export interface ExtractedComponent {
  id: string;
  name: string;
  originalName: string;
  category: string; // e.g., "Dobradiça", "Corrediça"
  quantity: number;
  sourceFile: string;
  dimensions?: string; // String format "WxHxD" if relevant
  materialName?: string; // Added to link back to material if converted
}

// Added assembly related types
export interface AssemblyStep {
  passo: number;
  titulo: string;
  descricao_tecnica: string;
  pecas_utilizadas: { id: number; nome: string; qtd: number }[];
  ferragens_utilizadas: { nome: string; qtd: number }[];
  ferramentas: string[];
  observacoes: string;
  imagem_referencia?: string | null;
}

export interface AssemblyModule {
  nome_modulo: string;
  ordem_montagem: number;
  passos: AssemblyStep[];
}

export interface AssemblyManual {
  projeto: {
    nome: string;
    categoria: string;
    nivel_complexidade: 'Baixa' | 'Média' | 'Alta';
    observacoes_gerais: string;
  };
  materiais: { descricao: string; espessura_mm: number }[];
  ferragens: { nome: string; quantidade: number; uso: string }[];
  modulos: AssemblyModule[];
  seguranca: { epis: string[]; alertas: string[] };
  checklist_final: string[];
}

export interface SavedManualRecord {
  id: string;
  project_name: string;
  category: 'Loja' | 'Encomenda';
  content: {
    data: AssemblyManual;
    images: Record<string, string>;
  };
  created_at: string;
}

export interface RegisteredMaterial {
  id: string;
  name: string;
  category?: 'sheet' | 'hardware' | 'component'; // New field for classification
  thickness: number;
  hasEdgeBand?: boolean; // Controls if edge banding is allowed for this material
  edgeStyle?: 'solid' | 'dashed'; // Defines the line style for edge banding based on thickness logic
  edgeColor?: string; // New: Specific color for the edge band if different from panel
  cost?: number; // Sheet Cost (Valor da Chapa)
  sheetArea?: number; // Sheet Area in m2 (Metragem da Chapa)
  productionTime?: number; // Production time in minutes
  unit?: 'un' | 'm' | 'm2' | 'kg'; // New field for quantification
}

export interface RegisteredEdgeBand {
  id: string;
  name: string;
  thickness: number; // e.g. 0.45, 1.0, 2.0
  colorCategory?: string; // e.g., "Madeirado", "Unicolor"
  pricePerMeter?: number; // Cost per linear meter
  productionTime?: number; // Production time in minutes per meter
}

export interface RegisteredHardware {
  id: string;
  name: string;
  category?: string; // e.g., "Dobradiça", "Corrediça", "Puxador"
  imageUrl?: string;
  price?: number; // Unit price
  productionTime?: number; // Production time in minutes per unit
}

export interface ProcessingStatus {
  step: 'idle' | 'parsing' | 'analyzing' | 'complete' | 'error';
  message: string;
}

export interface ClientInfo {
    name: string;
    phone: string;
    email: string;
    address: string;
    city?: string;
    state?: string;
    neighborhood?: string;
    cpfCnpj?: string;
    notes: string;
    responsible?: string;
    projectTitle?: string;
}

export interface SavedBudget {
    id: string;
    date: string;
    client: ClientInfo;
    items: {
        materials: number;
        hardware: number;
        edges: number;
        labor: number;
        other: number;
    };
    total: number;
    margin: number;
    finalPrice: number;
    projectName: string;
    // Optional: Store full project state for restoration/duplication
    parts?: ProcessedPart[];
    hardware?: ExtractedComponent[];
}

export interface CompanyProfile {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    logoUrl?: string;
    cnpj?: string;
}

export interface BudgetSettings {
    defaultWarrantyText: string;
    defaultPaymentTerms: string;
    defaultValidityDays: number;
    defaultDeliveryTime?: string;
}

export interface OptimizationConfig {
  sheetWidth: number;
  sheetHeight: number;
  bladeThickness: number;
  margin: number;
  trimming: number;
  allowRotation: boolean;
  ignoreGrain: boolean;
  colorMode: 'white' | 'colored';
  cutDirection: 'auto' | 'vertical' | 'horizontal';
  forceOrientation?: 'auto' | 'vertical' | 'horizontal'; // NOVA PROPRIEDADE
  sawSpeed: number;
  minutesPerSqMeter: number; // Changed from minutesPerMeter to per SqMeter
  edgeBandStyle?: 'solid' | 'dashed'; // Legacy global, now per-edge overrides this
  costPerCut?: number; // Valor monetário por deslocamento de serra
  monthlyRevenueGoal?: number; // Meta de Faturamento Mensal
  financialSettings?: {
    desiredMonthlyProfit: number;
    opportunityCost: number;
    theoreticalVariableCost?: number; // New field
  };
  laborCostSettings?: {
    hourlyRate: number;
    workedHours: number;
    numberOfEmployees?: number; // New field
    workingDays?: number; // New field
    hoursPerDay?: number; // New field
    directCosts: number;
    indirectCosts: number;
    assemblyTimePerPart?: number; // New: Assembly time per part in minutes
  };
  companyProfile?: CompanyProfile;
  budgetSettings?: BudgetSettings;
}

export interface PlacedPart {
  uuid: string;
  partId: string;
  displayId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  name: string;
  group: string;
  edgeCode: string;
  edges: EdgeBanding;
  svgPath?: string;
  sourceFile: string;
  notes?: string[];
  originalDimensions?: { width: number, height: number }; // Added for reliable edge mapping
}

export interface Offcut {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OptimizedSheet {
  id: number;
  width: number;
  height: number;
  parts: PlacedPart[];
  offcuts: Offcut[];
  waste: Offcut[];
  wastePercentage: number;
  usedArea: number;
  cutLength: number;
  cutsCount: number; // Número de deslocamentos/cortes nesta chapa
}

export interface OptimizationResult {
  sheets: OptimizedSheet[];
  unplacedParts: ProcessedPart[];
  totalSheets: number;
  totalUsedArea: number;
  globalWastePercentage: number;
  totalCutLength: number;
  totalCutsCount: number; // Soma total de deslocamentos
  estimatedTime: number;
  meta?: {
    materialName: string;
    thickness: number;
    orderId?: string;
  };
}

export interface RegisteredCollaborator {
    id: string;
    code: string;
    name: string;
    role: string;
    sector: string;
    type: string;
    monthRate: number;
    hourRate: number;
    productionHours: number;
    status: 'Ativo' | 'Inativo';
}

export interface RegisteredSupplier {
    id: string;
    code: string;
    name: string;
    category: string;
    contact: string;
    phone: string;
}

export interface RegisteredUnit {
    id: string;
    name: string;
    category: string;
}

export interface RegisteredTax {
    id: string;
    code: string;
    name: string;
    value: number;
    type: string;
    status: 'Ativo' | 'Inativo';
}

export interface RegisteredIndirectCost {
    id: string;
    code: string;
    name: string;
    value: number;
    category: 'Fixo' | 'Variável';
}

export interface RegisteredEquipment {
    id: string;
    code: string;
    name: string;
    brand: string;
    power: string;
    status: 'Operacional' | 'Manutenção' | 'Inativo';
}
