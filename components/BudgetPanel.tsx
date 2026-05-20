import React, { useState, useMemo, useEffect } from 'react';
import { 
    Calculator, DollarSign, Package, Wrench, Percent, FileText, AlertCircle, Clock, Disc, User, Phone, MapPin, Mail, 
    Save, Trash2, Eye, Plus, X, Calendar, Search, Copy, Printer, TrendingUp, Settings2, Scissors, Ruler,
    Home, Users, CheckCircle2, ChevronDown, ListFilter, Gauge, Monitor, HardHat, FileSpreadsheet, Settings, Building2
} from 'lucide-react';
import { 
    ProcessedPart, ExtractedComponent, RegisteredMaterial, RegisteredHardware, 
    RegisteredEdgeBand, OptimizationConfig, OptimizationResult, SavedBudget, 
    ClientInfo, RegisteredCollaborator 
} from '../types';
import { BudgetPdfModal } from './BudgetPdfModal';
import { FinancialSettings } from './FinancialSettings';
import { CuttingSectorSettings } from './CuttingSectorSettings';
import { EdgeBandingSectorSettings } from './EdgeBandingSectorSettings';
import { AssemblySectorSettings } from './AssemblySectorSettings';
import { EngineeringView } from './EngineeringView';
import { LaborView } from './LaborView';
import { MaterialsView } from './MaterialsView';
import { HardwareView } from './HardwareView';
import { CostsView } from './CostsView';
import { PartsListView } from './PartsListView';

interface BudgetPanelProps {
    parts: ProcessedPart[];
    hardware: ExtractedComponent[];
    materials: RegisteredMaterial[];
    hardwareRegistry: RegisteredHardware[];
    edgeRegistry: RegisteredEdgeBand[];
    globalConfig: OptimizationConfig;
    setGlobalConfig: (config: OptimizationConfig) => void;
    optimizationResult: OptimizationResult | null;
    projectName: string;
    onUpdateParts: (parts: ProcessedPart[]) => void;
    onUpdateHardware: (hardware: ExtractedComponent[]) => void;
    onUpdateMaterials?: (materials: RegisteredMaterial[]) => void;
    onUpdateEdges?: (edges: RegisteredEdgeBand[]) => void;
    onUpdateHardwareRegistry?: (hardware: RegisteredHardware[]) => void;
    collaborators: RegisteredCollaborator[];
}

export const BudgetPanel: React.FC<BudgetPanelProps> = ({ 
    parts, 
    hardware, 
    materials, 
    hardwareRegistry, 
    edgeRegistry,
    collaborators,
    globalConfig,
    setGlobalConfig,
    optimizationResult,
    projectName,
    onUpdateParts,
    onUpdateHardware,
    onUpdateMaterials,
    onUpdateEdges,
    onUpdateHardwareRegistry
}) => {
    const [activeTab, setActiveTab] = useState<'resumo' | 'cliente' | 'items' | 'materials' | 'labor' | 'engineering' | 'costs' | 'saved' | 'config'>('cliente');
    const [configSubTab, setConfigSubTab] = useState<'finance' | 'cutting' | 'edges' | 'assembly'>('finance');
    const [complexityFactor, setComplexityFactor] = useState(1.20);
    const [savedBudgets, setSavedBudgets] = useState<SavedBudget[]>(() => {
        const saved = localStorage.getItem('cutlist_saved_budgets_pro_v4');
        return saved ? JSON.parse(saved) : [];
    });
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [selectedBudgetForPdf, setSelectedBudgetForPdf] = useState<SavedBudget | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [clientInfo, setClientInfo] = useState<ClientInfo>({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
    });

    useEffect(() => {
        localStorage.setItem('cutlist_saved_budgets_pro_v4', JSON.stringify(savedBudgets));
    }, [savedBudgets]);

    const [manualMargin, setManualMargin] = useState<number | null>(null);
    const [otherCosts, setOtherCosts] = useState<number>(0);
    
    // Manual Hardware State
    const [manualHardware, setManualHardware] = useState<{id: string, name: string, quantity: number}[]>([]);
    const [showHardwareModal, setShowHardwareModal] = useState(false);
    const [newHardwareItem, setNewHardwareItem] = useState({ name: '', quantity: 1 });
    const [editingHardwareId, setEditingHardwareId] = useState<string | null>(null);

    // ... (Calculations remain the same) ...

    // 1. Calculate Material Costs & Production Time
    const materialCosts = useMemo(() => {
        // ... (existing code)
        const costs: { 
            materialName: string; 
            thickness: number; 
            area: number; 
            sheets: number; 
            unitCost: number; 
            totalCost: number;
            productionTime: number;
            isEstimated: boolean;
        }[] = [];

        // Group parts by material
        const groupedParts: Record<string, ProcessedPart[]> = {};
        parts.forEach(p => {
            const key = `${p.materialName}|${p.dimensions.thickness}`;
            if (!groupedParts[key]) groupedParts[key] = [];
            groupedParts[key].push(p);
        });

        Object.entries(groupedParts).forEach(([key, groupParts]) => {
            const [matName, thicknessStr] = key.split('|');
            const thickness = Number(thicknessStr);
            const material = materials.find(m => m.name === matName && m.thickness === thickness);
            
            // Calculate total area in m²
            const totalAreaM2 = groupParts.reduce((acc, p) => {
                return acc + (p.dimensions.width * p.dimensions.height * p.quantity) / 1000000;
            }, 0);

            // Determine number of sheets
            let sheetsCount = 0;
            let isEstimated = true;

            if (optimizationResult && optimizationResult.sheets) {
                if (optimizationResult.meta?.materialName === matName && optimizationResult.meta?.thickness === thickness) {
                    sheetsCount = optimizationResult.totalSheets;
                    isEstimated = false;
                }
            }

            const sheetArea = material?.sheetArea || (globalConfig.sheetWidth * globalConfig.sheetHeight) / 1000000;

            if (sheetsCount === 0) {
                sheetsCount = Math.ceil((totalAreaM2 * 1.2) / sheetArea);
            }

            const m2Price = (material?.cost || 0) / sheetArea;
            const totalCost = totalAreaM2 * m2Price;
            
            // Production time for material (per m²)
            // Use material specific time if available, otherwise use global default
            const prodTimePerM2 = material?.productionTime || globalConfig.minutesPerSqMeter || 0;
            const totalProdTime = totalAreaM2 * prodTimePerM2;

            costs.push({
                materialName: matName,
                thickness,
                area: totalAreaM2,
                sheets: sheetsCount,
                unitCost: m2Price,
                totalCost,
                productionTime: totalProdTime,
                isEstimated
            });
        });

        return costs;
    }, [parts, materials, optimizationResult, globalConfig]);

    // 2. Calculate Hardware Costs & Production Time
    const hardwareCosts = useMemo(() => {
        const extracted = hardware.map(hw => ({...hw, isManual: false, id: `extracted_${hw.name}`}));
        const manual = manualHardware.map(hw => ({...hw, isManual: true}));
        
        return [...extracted, ...manual].map(hw => {
            const registryItem = hardwareRegistry.find(r => r.name.toLowerCase() === hw.name.toLowerCase());
            const unitPrice = registryItem?.price || 0;
            const prodTimePerUnit = registryItem?.productionTime || 0;
            
            return {
                id: hw.id,
                name: registryItem?.name || hw.name,
                quantity: hw.quantity,
                unitPrice,
                total: hw.quantity * unitPrice,
                productionTime: hw.quantity * prodTimePerUnit,
                found: !!registryItem,
                isManual: hw.isManual
            };
        });
    }, [hardware, hardwareRegistry, manualHardware]);

    // 3. Calculate Edge Band Costs & Production Time
    const edgeBandCosts = useMemo(() => {
        const costs: Record<string, { length: number, price: number, prodTime: number, name: string }> = {};

        // Helper to find best matching edge band
        const findBestEdgeBand = (p: ProcessedPart) => {
            const edgeColor = (p.detectedEdgeColor || '').trim().toLowerCase();
            const matName = p.materialName.toLowerCase();
            
            // 1. Try exact or partial match with detected color
            if (edgeColor) {
                const match = edgeRegistry.find(r => 
                    r.name.toLowerCase() === edgeColor || 
                    r.name.toLowerCase().includes(edgeColor) ||
                    edgeColor.includes(r.name.toLowerCase())
                );
                if (match) return match;
            }

            // 2. Try to find common keywords between material name and edge bands
            const commonKeywords = ['branco', 'preto', 'cinza', 'freijó', 'louro', 'carvalho', 'nogueira', 'grafite', 'fendi', 'gianduia', 'titânio', 'metálico', 'cristal', 'gelo', 'pérola', 'areia', 'argila', 'cappuccino', 'lino', 'trama', 'couro', 'concreto', 'aço', 'cobre', 'ouro', 'prata'];
            
            const foundKeyword = commonKeywords.find(k => matName.includes(k));
            if (foundKeyword) {
                const match = edgeRegistry.find(r => r.name.toLowerCase().includes(foundKeyword));
                if (match) return match;
            }

            // 3. Try any word from material name that might match an edge band
            const matWords = matName.split(/\s+/).filter(w => w.length > 3);
            for (const word of matWords) {
                const match = edgeRegistry.find(r => r.name.toLowerCase().includes(word));
                if (match) return match;
            }

            // 4. Fallback: If no match found, use the first registered edge band (as "random" fallback)
            if (edgeRegistry.length > 0) return edgeRegistry[0];

            return null;
        };

        parts.forEach(p => {
            const { width, height } = p.dimensions;
            const qty = p.quantity;
            const edges = p.edges;
            const edgeColor = p.detectedEdgeColor || p.materialName;

            // Find matching edge band in registry using robust logic
            const registryItem = findBestEdgeBand(p);

            const key = registryItem ? registryItem.id : `unregistered_${edgeColor}`;
            if (!costs[key]) {
                costs[key] = { 
                    length: 0, 
                    price: registryItem?.pricePerMeter || 0, 
                    prodTime: registryItem?.productionTime || 0, 
                    name: registryItem?.name || `Fita: ${edgeColor}` 
                };
            }

            // Calculate length in meters
            let lengthMm = 0;
            if (edges.long1 !== 'none') lengthMm += width;
            if (edges.long2 !== 'none') lengthMm += width;
            if (edges.short1 !== 'none') lengthMm += height;
            if (edges.short2 !== 'none') lengthMm += height;

            costs[key].length += (lengthMm * qty) / 1000;
        });

        return Object.values(costs).map(c => ({
            name: c.name,
            length: c.length,
            unitPrice: c.price,
            total: c.length * c.price,
            productionTime: c.length * c.prodTime
        }));
    }, [parts, edgeRegistry]);

    // 4. Totals
    const totalMaterialCost = materialCosts.reduce((acc, c) => acc + c.totalCost, 0);
    const totalHardwareCost = hardwareCosts.reduce((acc, c) => acc + c.total, 0);
    const totalEdgeCost = edgeBandCosts.reduce((acc, c) => acc + c.total, 0);
    
    const totalProdTimeMinutes = 
        materialCosts.reduce((acc, c) => acc + c.productionTime, 0) +
        hardwareCosts.reduce((acc, c) => acc + c.productionTime, 0) +
        edgeBandCosts.reduce((acc, c) => acc + c.productionTime, 0);

    const totalPartsCount = parts.reduce((acc, p) => acc + p.quantity, 0);

    const workingDays = globalConfig.laborCostSettings?.workingDays || 22;
    const workingHoursPerDay = globalConfig.laborCostSettings?.hoursPerDay || 8;
    const numberOfEmployees = globalConfig.laborCostSettings?.numberOfEmployees || 1;
    const totalMonthlyHours = workingDays * workingHoursPerDay * numberOfEmployees;
    
    const directMonthly = globalConfig.laborCostSettings?.directCosts || 0;
    const indirectMonthly = globalConfig.laborCostSettings?.indirectCosts || 0;
    
    // Direct Hourly Rate (Salary only, as per requirement 3)
    const directHourlyRate = totalMonthlyHours > 0 ? directMonthly / totalMonthlyHours : 0;
    
    const assemblyTimePerPart = globalConfig.laborCostSettings?.assemblyTimePerPart || 0;

    // Detailed Labor Breakdown
    const materialProdTimeMinutes = materialCosts.reduce((acc, c) => acc + c.productionTime, 0);
    const materialHours = materialProdTimeMinutes / 60;
    const materialLaborCost = materialHours * directHourlyRate;

    const edgeBandingTimeMinutes = edgeBandCosts.reduce((acc, c) => acc + c.productionTime, 0);
    const edgeHours = edgeBandingTimeMinutes / 60;
    const edgeBandingLaborCost = edgeHours * directHourlyRate;

    const hardwareAssemblyTimeMinutes = hardwareCosts.reduce((acc, c) => acc + c.productionTime, 0);
    const hardwareHours = hardwareAssemblyTimeMinutes / 60;
    const partsAssemblyTimeMinutes = parts.reduce((acc, p) => acc + (p.quantity * assemblyTimePerPart), 0);
    const currentAssemblyHours = partsAssemblyTimeMinutes / 60;
    
    // Requirement 3c: Use directHourlyRate
    const assemblyLaborCost = (hardwareHours * directHourlyRate) + (currentAssemblyHours * directHourlyRate);

    const calculatedLaborCost = materialLaborCost + edgeBandingLaborCost + assemblyLaborCost;

    // Requirement 1: Total hours = Materials + Edges + Hardware
    const totalHours = materialHours + edgeHours + hardwareHours;
    const totalProjectHours = totalHours;

    // Requirement: Indirect Costs = Settings Value / Number of Pieces
    // Following user instruction: "Os custos indiretos, vai ser custo direto cadastrado nas configurações, dividido pela quantidade de peças"
    const indirectCostsTotal = totalPartsCount > 0 ? directMonthly / totalPartsCount : 0;

    const subtotal = totalMaterialCost + totalHardwareCost + totalEdgeCost + calculatedLaborCost + indirectCostsTotal + otherCosts;
    
    // Extração de Portas e Gavetas (Rule-based)
    const projectStats = useMemo(() => {
        let doors = 0;
        let drawers = 0;
        
        parts.forEach(p => {
            const name = (p.finalName || '').toLowerCase();
            const orig = (p.originalName || '').toLowerCase();
            const cat = (p.groupCategory || '').toLowerCase();
            const qty = p.quantity || 0;
            const combined = `${name} ${orig} ${cat}`;
            
            // Lógica para Portas
            if (combined.includes('porta') || combined.includes('basculante')) {
                doors += qty;
            } 
            // Lógica para Gavetas
            else if (combined.includes('gaveta') || combined.includes('gav.') || combined.includes('gav')) {
                drawers += qty;
            }
        });
        
        return { doors, drawers };
    }, [parts]);

    // Monthly Projection Calculations
    const monthlyQty = totalProjectHours > 0 ? Math.floor(totalMonthlyHours / totalProjectHours) : 0;

    // Profit Calculation (Time Based with Manual Margin Override)
    // const totalHours = ... (already calculated above)
    const days = globalConfig.laborCostSettings?.workingDays || 22;
    const hours = globalConfig.laborCostSettings?.hoursPerDay || 8;
    const employees = globalConfig.laborCostSettings?.numberOfEmployees || 1;
    const theoreticalHours = days * hours * employees;
    const estimatedHourlyValue = theoreticalHours > 0 ? (globalConfig.financialSettings?.desiredMonthlyProfit || 0) / theoreticalHours : 0;
    
    const timeBasedProfit = totalHours * estimatedHourlyValue;
    const initialFinalPrice = subtotal + timeBasedProfit;
    
    // Calculate automatic margin based on time-based profit
    const automaticMargin = initialFinalPrice > 0 ? (timeBasedProfit / initialFinalPrice) * 100 : 0;
    
    // Use manual margin if set, otherwise use automatic margin
    const effectiveMargin = manualMargin !== null ? manualMargin : automaticMargin;
    
    // Calculate final values based on effective margin
    // Formula: Price = Cost / (1 - Margin%)
    // But if we use the logic Margin = Profit / Price, then Price = Cost + Profit => Price = Cost + Price*Margin => Price(1-Margin) = Cost => Price = Cost / (1-Margin)
    // However, if margin is 100%, price is infinite. Let's cap it or handle it.
    
    let finalPrice = 0;
    let profit = 0;

    if (manualMargin !== null) {
        // Recalculate based on manual margin
        if (effectiveMargin >= 100) {
            finalPrice = subtotal * 2; // Fallback to avoid division by zero or negative
        } else {
            finalPrice = subtotal / (1 - (effectiveMargin / 100));
        }
        profit = finalPrice - subtotal;
    } else {
        // Use time-based defaults
        profit = timeBasedProfit;
        finalPrice = initialFinalPrice;
    }

    const monthlyRevenue = monthlyQty * finalPrice;
    const variableCostsPerUnit = totalMaterialCost + totalEdgeCost + totalHardwareCost + otherCosts;
    const monthlyVariableCosts = monthlyQty * variableCostsPerUnit;
    const monthlyProfit = monthlyQty * profit;

    const handleAddManualHardware = () => {
        if (!newHardwareItem.name) return;
        
        if (editingHardwareId) {
            // Update existing item
            setManualHardware(prev => prev.map(item => 
                item.id === editingHardwareId 
                    ? { ...item, name: newHardwareItem.name, quantity: newHardwareItem.quantity }
                    : item
            ));
            setEditingHardwareId(null);
        } else {
            // Add new item
            setManualHardware(prev => [
                ...prev,
                {
                    id: `manual_${Date.now()}`,
                    name: newHardwareItem.name,
                    quantity: newHardwareItem.quantity
                }
            ]);
        }
        
        setNewHardwareItem({ name: '', quantity: 1 });
        setShowHardwareModal(false);
    };

    const handleEditManualHardware = (id: string, name: string, quantity: number) => {
        setNewHardwareItem({ name, quantity });
        setEditingHardwareId(id);
        setShowHardwareModal(true);
    };

    const handleRemoveManualHardware = (id: string) => {
        setManualHardware(prev => prev.filter(h => h.id !== id));
    };

    const handleSaveBudget = () => {
        if (!clientInfo.name.trim()) {
            alert('Por favor, informe o nome do cliente.');
            return;
        }

        if (editingId) {
            // Update existing budget (Metadata only)
            setSavedBudgets(prev => prev.map(b => {
                if (b.id === editingId) {
                    return {
                        ...b,
                        client: { ...clientInfo }
                    };
                }
                return b;
            }));
            alert('Dados do cliente atualizados com sucesso!');
        } else {
            // Create new budget
            const newBudget: SavedBudget = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                client: { ...clientInfo },
                items: {
                    materials: totalMaterialCost,
                    hardware: totalHardwareCost,
                    edges: totalEdgeCost,
                    labor: calculatedLaborCost,
                    other: otherCosts
                },
                total: subtotal,
                margin: effectiveMargin,
                finalPrice: finalPrice,
                projectName: projectName,
                parts: parts, // Saving current state
                hardware: hardware // Saving current state
            };
            setSavedBudgets(prev => [newBudget, ...prev]);
            alert('Orçamento salvo com sucesso!');
        }

        setShowSaveModal(false);
        setEditingId(null);
        setClientInfo({ name: '', phone: '', email: '', address: '', notes: '' });
        setActiveTab('saved');
    };

    const handleDeleteBudget = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este orçamento salvo?')) {
            setSavedBudgets(prev => prev.filter(b => b.id !== id));
        }
    };

    const handleDuplicateBudget = (budget: SavedBudget) => {
        const duplicated: SavedBudget = {
            ...budget,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            projectName: `${budget.projectName} (Cópia)`
        };
        setSavedBudgets(prev => [duplicated, ...prev]);
    };

    const handleEditBudget = (budget: SavedBudget) => {
        setClientInfo({ ...budget.client });
        setEditingId(budget.id);
        setShowSaveModal(true);
    };

    const handleGeneratePdf = (budget: SavedBudget) => {
        setSelectedBudgetForPdf(budget);
        setShowPdfModal(true);
    };

    // Helper to generate PDF for CURRENT calculator state
    const handleCurrentPdf = () => {
        const tempBudget: SavedBudget = {
            id: 'PREVIEW',
            date: new Date().toISOString(),
            client: { ...clientInfo }, // Use current form info if any, or empty
            items: {
                materials: totalMaterialCost,
                hardware: totalHardwareCost,
                edges: totalEdgeCost,
                labor: calculatedLaborCost,
                other: otherCosts
            },
            total: subtotal,
            margin: effectiveMargin,
            finalPrice: finalPrice,
            projectName: projectName
        };
        setSelectedBudgetForPdf(tempBudget);
        setShowPdfModal(true);
    };

    const BUDGET_TABS = [
        { id: 'resumo', label: 'Resumo', icon: Home },
        { id: 'cliente', label: 'Cliente / Projeto', icon: User },
        { id: 'items', label: 'Peças', icon: FileSpreadsheet },
        { id: 'materials', label: 'Materiais', icon: Package },
        { id: 'labor', label: 'Mão de Obra', icon: Users },
        { id: 'engineering', label: 'Engenharia de Produção', icon: Monitor },
        { id: 'costs', label: 'Custos', icon: DollarSign },
        { id: 'saved', label: 'Orçamentos Salvos', icon: Save },
        { id: 'config', label: 'Configurações', icon: Settings }
    ] as const;

    return (
        <div className="max-w-[1600px] mx-auto mt-2 bg-[#f1f5f9] min-h-[calc(100vh-80px)] animate-fade-in flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
            {/* NEW HEADER BAR */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-8">
                   <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Orçamento</span>
                        <span className="text-sm font-bold text-blue-600">0458/2024</span>
                   </div>
                   <div className="w-px h-8 bg-slate-200"></div>
                   <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Projeto</span>
                        <span className="text-sm font-bold text-slate-700">{projectName || 'Cozinha Planejada'}</span>
                   </div>
                   <div className="w-px h-8 bg-slate-200"></div>
                   <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Cliente</span>
                        <span className="text-sm font-bold text-slate-700">{clientInfo.name || 'João da Silva'}</span>
                   </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowSaveModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95">
                        <Save size={18}/> Salvar
                    </button>
                    <button onClick={handleCurrentPdf} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95">
                        <Printer size={18}/> Gerar Orçamento
                    </button>
                </div>
            </div>

            {/* TAB LIST */}
            <div className="bg-white px-6 border-b border-slate-200 flex gap-1 overflow-x-auto no-scrollbar pt-1 sticky top-0 z-10 shadow-sm">
                {BUDGET_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-tight border-b-2 transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                    {/* CONTENT AREA */}
                    {activeTab === 'cliente' ? (
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in max-w-4xl mx-auto">
                            <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <Building2 size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-black tracking-tight uppercase">Registro do Projeto</h1>
                                        <p className="text-blue-400 font-bold text-[9px] uppercase tracking-widest mt-0.5 italic">Detalhes do cliente e responsabilidades</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-8 space-y-8">
                                {/* PROJETO */}
                                <div>
                                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 flex items-center gap-2 italic">
                                        <Monitor size={12} className="text-blue-500" /> Dados do Projeto
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-0.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Título do Projeto</label>
                                            <input 
                                                type="text" 
                                                value={clientInfo.projectTitle || ''}
                                                onChange={e => setClientInfo(prev => ({ ...prev, projectTitle: e.target.value }))}
                                                placeholder="Ex: Cozinha Planejada Residencial"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Responsável pelo Orçamento</label>
                                            <input 
                                                type="text" 
                                                value={clientInfo.responsible || ''}
                                                onChange={e => setClientInfo(prev => ({ ...prev, responsible: e.target.value }))}
                                                placeholder="Nome do consultor/vendedor"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* CLIENTE */}
                                <div>
                                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 flex items-center gap-2 italic">
                                        <Users size={12} className="text-emerald-500" /> Dados do Cliente
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-0.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Nome Completo / Razão Social</label>
                                            <input 
                                                type="text" 
                                                value={clientInfo.name}
                                                onChange={e => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="João da Silva"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">CPF / CNPJ</label>
                                            <input 
                                                type="text" 
                                                value={clientInfo.cpfCnpj || ''}
                                                onChange={e => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    if (val.length <= 11) {
                                                        val = val.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                                                    } else {
                                                        val = val.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
                                                    }
                                                    setClientInfo(prev => ({ ...prev, cpfCnpj: val.substring(0, 18) }));
                                                }}
                                                placeholder="000.000.000-00"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">WhatsApp / Telefone</label>
                                            <input 
                                                type="text" 
                                                value={clientInfo.phone}
                                                onChange={e => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    val = val.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
                                                    setClientInfo(prev => ({ ...prev, phone: val.substring(0, 15) }));
                                                }}
                                                placeholder="(00) 00000-0000"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">E-mail</label>
                                            <input 
                                                type="email" 
                                                value={clientInfo.email}
                                                onChange={e => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                                                placeholder="cliente@email.com"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-0.5 md:col-span-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Endereço</label>
                                            <input 
                                                type="text" 
                                                value={clientInfo.address}
                                                onChange={e => setClientInfo(prev => ({ ...prev, address: e.target.value }))}
                                                placeholder="Rua, Número, Bloco..."
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 md:col-span-2">
                                            <div className="space-y-0.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Bairro</label>
                                                <input 
                                                    type="text" 
                                                    value={clientInfo.neighborhood || ''}
                                                    onChange={e => setClientInfo(prev => ({ ...prev, neighborhood: e.target.value }))}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Cidade</label>
                                                <input 
                                                    type="text" 
                                                    value={clientInfo.city || ''}
                                                    onChange={e => setClientInfo(prev => ({ ...prev, city: e.target.value }))}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                                />
                                            </div>
                                            <div className="space-y-0.5">
                                                <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Estado (UF)</label>
                                                <input 
                                                    type="text" 
                                                    value={clientInfo.state || ''}
                                                    onChange={e => setClientInfo(prev => ({ ...prev, state: e.target.value }))}
                                                    maxLength={2}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner text-center uppercase"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* OBSERVAÇÕES */}
                                <div>
                                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4 flex items-center gap-2 italic">
                                        <FileText size={12} className="text-amber-500" /> Observações do Orçamento
                                    </h3>
                                    <textarea 
                                        rows={3}
                                        value={clientInfo.notes}
                                        onChange={e => setClientInfo(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Informações adicionais, prazos especiais, condições de pagamento..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner resize-none"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 flex justify-end gap-3 border-t border-slate-200">
                                <button 
                                    onClick={() => setActiveTab('resumo')}
                                    className="px-6 py-2 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all shadow-sm active:scale-95"
                                >
                                    Voltar
                                </button>
                                <button 
                                    onClick={() => setActiveTab('items')}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    Avançar
                                </button>
                            </div>
                        </div>
                    ) : activeTab === 'items' ? (
                       <PartsListView 
                           parts={parts}
                           globalConfig={globalConfig}
                           materialCosts={materialCosts}
                           hardwareCosts={hardwareCosts}
                           totalHardwareCost={totalHardwareCost}
                           totalPartsCount={totalPartsCount}
                           subtotal={subtotal}
                           onUpdateParts={onUpdateParts}
                           onUpdateHardware={onUpdateHardware}
                           extractedHardware={hardware}
                       />
                    ) : activeTab === 'engineering' ? (
                       <EngineeringView 
                           parts={parts}
                           hardware={hardwareCosts}
                           edgeCosts={edgeBandCosts}
                           globalConfig={globalConfig}
                           stats={projectStats}
                           complexityFactor={complexityFactor}
                           setComplexityFactor={setComplexityFactor}
                       />
                    ) : activeTab === 'labor' ? (
                        <LaborView 
                            parts={parts}
                            totalPartsCount={totalPartsCount}
                            totalArea={parts.reduce((acc, p) => acc + (p.dimensions.width * p.dimensions.height * p.quantity) / 1000000, 0)}
                            globalConfig={globalConfig}
                            collaborators={collaborators}
                            productionTimes={{
                                corte: materialProdTimeMinutes,
                                bordeamento: edgeBandingTimeMinutes,
                                montagem: hardwareAssemblyTimeMinutes + partsAssemblyTimeMinutes,
                                acabamento: 60 
                            }}
                            subtotal={subtotal}
                        />
                    ) : activeTab === 'materials' ? (
                        <MaterialsView 
                            materialCosts={materialCosts}
                            edgeBandCosts={edgeBandCosts}
                            hardwareCosts={hardwareCosts}
                            totalMaterialCost={totalMaterialCost}
                            totalEdgeCost={totalEdgeCost}
                            totalHardwareCost={totalHardwareCost}
                            subtotal={subtotal}
                            optimizationResult={optimizationResult}
                            globalConfig={globalConfig}
                            materials={materials}
                            edgeRegistry={edgeRegistry}
                            hardwareRegistry={hardwareRegistry}
                            onUpdateMaterials={onUpdateMaterials}
                            onUpdateEdges={onUpdateEdges}
                            onUpdateHardwareRegistry={onUpdateHardwareRegistry}
                        />
                    ) : activeTab === 'costs' ? (
                        <CostsView 
                            totalMaterialCost={totalMaterialCost}
                            totalHardwareCost={totalHardwareCost}
                            totalEdgeCost={totalEdgeCost}
                            calculatedLaborCost={calculatedLaborCost}
                            indirectCostsTotal={indirectCostsTotal}
                            subtotal={subtotal}
                            totalAreaM2={parts.reduce((acc, p) => acc + (p.dimensions.width * p.dimensions.height * p.quantity) / 1000000, 0)}
                            totalPartsCount={totalPartsCount}
                            globalConfig={globalConfig}
                            productionTimes={{
                                corte: materialProdTimeMinutes,
                                bordeamento: edgeBandingTimeMinutes,
                                montagem: hardwareAssemblyTimeMinutes + partsAssemblyTimeMinutes,
                                acabamento: 60
                            }}
                        />
                    ) : activeTab === 'saved' ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                            {savedBudgets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                                    <Save size={64} className="mb-4 opacity-20"/>
                                    <p className="font-medium">Nenhum orçamento salvo ainda.</p>
                                    <button onClick={() => setActiveTab('resumo')} className="mt-4 text-blue-600 font-bold hover:underline">
                                        Criar novo orçamento
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4">Data</th>
                                                <th className="px-6 py-4">Cliente</th>
                                                <th className="px-6 py-4">Projeto</th>
                                                <th className="px-6 py-4 text-right">Valor Final</th>
                                                <th className="px-6 py-4 text-center">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {savedBudgets.map(budget => (
                                                <tr key={budget.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-500">
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <Calendar size={12}/>
                                                            {new Date(budget.date).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-700">{budget.client.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-slate-600">
                                                        {budget.projectName}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-800 text-lg">
                                                        R$ {budget.finalPrice.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => handleGeneratePdf(budget)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Printer size={18}/></button>
                                                            <button onClick={() => handleDeleteBudget(budget.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'config' ? (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex gap-2 bg-white/50 backdrop-blur-sm p-1 rounded-xl w-fit self-start mb-4 border border-slate-200">
                                {[
                                    { id: 'finance', label: 'Finanças', icon: TrendingUp },
                                    { id: 'cutting', label: 'Setor de Cortes', icon: Scissors },
                                    { id: 'edges', label: 'Setor de Bordeamento', icon: Disc },
                                    { id: 'assembly', label: 'Setor de Montagem', icon: Wrench }
                                ].map(sub => (
                                    <button 
                                        key={sub.id}
                                        onClick={() => setConfigSubTab(sub.id as any)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${configSubTab === sub.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
                                    >
                                        <sub.icon size={14}/> {sub.label}
                                    </button>
                                ))}
                            </div>
                            {configSubTab === 'finance' && <FinancialSettings globalConfig={globalConfig} setGlobalConfig={setGlobalConfig} />}
                            {configSubTab === 'cutting' && <CuttingSectorSettings globalConfig={globalConfig} setGlobalConfig={setGlobalConfig} />}
                            {configSubTab === 'edges' && <EdgeBandingSectorSettings globalConfig={globalConfig} setGlobalConfig={setGlobalConfig} edgeRegistry={edgeRegistry} />}
                            {configSubTab === 'assembly' && <AssemblySectorSettings globalConfig={globalConfig} setGlobalConfig={setGlobalConfig} />}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-20 text-center flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                               <FileText size={40} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Em desenvolvimento</h2>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">Estamos trabalhando para trazer o detalhamento completo desta aba em breve.</p>
                            <button onClick={() => setActiveTab('engineering')} className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-100">Ver Engenharia de Produção</button>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDEBAR - FIXED INFO */}
                <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto no-scrollbar p-6 space-y-6 shadow-sm hidden xl:block">
                     <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Informações do Projeto</h4>
                        <div className="space-y-4">
                            <div>
                                <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Cliente</span>
                                <span className="text-sm font-bold text-slate-700">{clientInfo.name || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Projeto</span>
                                <span className="text-sm font-bold text-slate-700 font-mono italic">{clientInfo.projectTitle || projectName || '-'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Data</span>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                        <Calendar size={14} className="text-blue-500" />
                                        {new Date().toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Responsável</span>
                                    <span className="text-xs font-bold text-slate-700">{clientInfo.responsible || '-'}</span>
                                </div>
                            </div>
                        </div>
                     </div>

                     <div className="h-px bg-slate-100 italic"></div>

                     <div>
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Ruler size={14} /> Área Total (Peças)
                        </h4>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                            <span className="text-3xl font-black text-slate-800 tracking-tighter">
                                {parts.reduce((acc, p) => acc + (p.dimensions.width * p.dimensions.height * p.quantity) / 1000000, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-sm font-black text-slate-400 ml-1">m²</span>
                        </div>
                     </div>

                     <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Prazo Estimado</h4>
                        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl font-black italic"><Calendar size={20} /></div>
                            <div>
                                <span className="text-lg font-black text-slate-800">7 dias</span>
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Úteis após aprovação</span>
                            </div>
                        </div>
                     </div>

                     <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Margem Estimada</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="text-emerald-500" size={24} />
                                <span className="text-2xl font-black text-slate-800">{(effectiveMargin).toFixed(1)} %</span>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-2 px-3 border border-emerald-100 w-fit">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Valor: R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                     </div>

                     <div className="pt-4 mt-4 border-t border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Observações</h4>
                         <div className="bg-blue-50/50 border border-dotted border-blue-200 rounded-xl p-4 h-32 mb-6">
                            <p className="text-[10px] text-blue-600 font-medium leading-relaxed italic">
                                Projeto com nichos, portas com pistão e gavetas com corrediças metálicas pesadas...
                            </p>
                         </div>

                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Top 5 Peças (Área)</h4>
                         <div className="space-y-2">
                             {parts
                                .map(p => ({
                                    ...p,
                                    area: (p.dimensions.width * p.dimensions.height) / 1000000
                                }))
                                .sort((a, b) => b.area - a.area)
                                .slice(0, 5)
                                .map((piece, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                                        <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <span className="block text-[9px] font-black text-slate-700 truncate">{piece.finalName}</span>
                                            <span className="block text-[7px] text-slate-400 font-bold uppercase">{piece.materialName}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[9px] font-black text-slate-800">{piece.area.toFixed(2)} m²</span>
                                        </div>
                                    </div>
                                ))}
                         </div>
                     </div>
                </div>
            </div>

            {/* BOTTOM SUMMARY FOOTER */}
            <div className="bg-white border-t border-slate-200 p-6 flex flex-wrap items-center justify-between shadow-[0_-4px_6px_-1px,0_2px_4px_-1px] z-20 sticky bottom-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-6 min-w-max">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl border border-slate-100">
                            <Package size={20} />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5 tracking-widest italic">Custo dos Materiais</span>
                            <span className="text-sm font-black text-slate-700">R$ {(totalMaterialCost + totalEdgeCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="block text-[8px] font-bold text-slate-300 mt-0.5">{((totalMaterialCost + totalEdgeCost) / subtotal * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="text-slate-300 text-lg font-light">+</div>

                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl border border-blue-100 italic">
                            <Wrench size={20} />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black text-blue-400 uppercase leading-none mb-0.5 tracking-widest italic">Custo das Ferragens</span>
                            <span className="text-sm font-black text-slate-700">R$ {totalHardwareCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="block text-[8px] font-bold text-blue-300 mt-0.5">{(totalHardwareCost / subtotal * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="text-slate-300 text-lg font-light">+</div>

                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-50 text-purple-500 rounded-xl border border-purple-100 italic font-black">
                            <Users size={20} />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black text-purple-400 uppercase leading-none mb-0.5 tracking-widest italic">Custo da Mão de Obra</span>
                            <span className="text-sm font-black text-slate-700">R$ {calculatedLaborCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="block text-[8px] font-bold text-purple-300 mt-0.5">{(calculatedLaborCost / subtotal * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="text-slate-300 text-lg font-light">+</div>

                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl border border-slate-100">
                             <Building2 size={20} />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5 tracking-widest italic">Custo Produção (Indir.)</span>
                            <span className="text-sm font-black text-slate-700">R$ {indirectCostsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="block text-[8px] font-bold text-slate-300 mt-0.5">{(indirectCostsTotal / subtotal * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="text-slate-300 text-xl font-light ml-2">=</div>

                    <div className="bg-blue-600/5 px-4 py-2 rounded-xl border border-blue-100">
                        <span className="block text-[8px] font-black text-blue-500 uppercase leading-none mb-1 tracking-widest italic text-center">Custo Total do Orçamento</span>
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                             <span className="text-xl font-black text-blue-700 text-center">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-8 border-l border-slate-100 pl-8 flex-1 justify-end min-w-max">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 italic leading-none">Margem de Lucro</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-slate-800">{(effectiveMargin).toFixed(1)}%</span>
                            <span className="text-sm font-black text-emerald-600">R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(effectiveMargin * 2, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-1 bg-emerald-100 text-emerald-600 rounded-bl-xl opacity-20 group-hover:opacity-40 transition-opacity">
                            <CheckCircle2 size={12} />
                        </div>
                        <span className="block text-[9px] font-black text-emerald-600 uppercase leading-none mb-1 tracking-widest italic">Preço Sugerido</span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-emerald-700 tracking-tight">R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                             <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-600 uppercase">
                                <CheckCircle2 size={10} /> <span>Aprovado</span>
                             </div>
                             <span className="text-[7px] text-emerald-400 font-bold italic">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            {/* SAVE MODAL */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 p-6 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <Save size={20} className="text-emerald-400"/> {editingId ? 'Editar Orçamento' : 'Salvar Orçamento'}
                            </h3>
                            <button onClick={() => { setShowSaveModal(false); setEditingId(null); }} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24}/>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {!editingId && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-blue-600 uppercase">Valor Total</span>
                                        <span className="text-2xl font-black text-slate-800">R$ {finalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Projeto: <span className="font-bold">{projectName}</span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Cliente *</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                        <input 
                                            type="text" 
                                            value={clientInfo.name}
                                            onChange={e => setClientInfo({...clientInfo, name: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-medium"
                                            placeholder="Nome completo"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                            <input 
                                                type="text" 
                                                value={clientInfo.phone}
                                                onChange={e => setClientInfo({...clientInfo, phone: e.target.value})}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-medium"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                            <input 
                                                type="email" 
                                                value={clientInfo.email}
                                                onChange={e => setClientInfo({...clientInfo, email: e.target.value})}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-medium"
                                                placeholder="email@exemplo.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                        <input 
                                            type="text" 
                                            value={clientInfo.address}
                                            onChange={e => setClientInfo({...clientInfo, address: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-medium"
                                            placeholder="Endereço de entrega/instalação"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações</label>
                                    <textarea 
                                        value={clientInfo.notes}
                                        onChange={e => setClientInfo({...clientInfo, notes: e.target.value})}
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500 outline-none font-medium h-24 resize-none"
                                        placeholder="Detalhes adicionais..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={() => { setShowSaveModal(false); setEditingId(null); }}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveBudget}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save size={20}/> {editingId ? 'Salvar Alterações' : 'Confirmar Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD HARDWARE MODAL */}
            {showHardwareModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 p-6 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <Plus size={20} className="text-blue-400"/> {editingHardwareId ? 'Editar Ferragem' : 'Adicionar Ferragem'}
                            </h3>
                            <button onClick={() => { setShowHardwareModal(false); setEditingHardwareId(null); setNewHardwareItem({ name: '', quantity: 1 }); }} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24}/>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Ferragem</label>
                                <div className="space-y-2">
                                    <select 
                                        onChange={e => {
                                            if(e.target.value) setNewHardwareItem({...newHardwareItem, name: e.target.value})
                                        }}
                                        className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 bg-slate-50 text-slate-600"
                                        value=""
                                    >
                                        <option value="">Selecione da lista...</option>
                                        {hardwareRegistry.map(hw => (
                                            <option key={hw.id} value={hw.name}>{hw.name}</option>
                                        ))}
                                    </select>
                                    
                                    <input 
                                        type="text" 
                                        placeholder="Ou digite o nome..."
                                        value={newHardwareItem.name}
                                        onChange={e => setNewHardwareItem({...newHardwareItem, name: e.target.value})}
                                        className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 font-medium"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade</label>
                                <input 
                                    type="number" 
                                    min="1"
                                    value={newHardwareItem.quantity}
                                    onChange={e => setNewHardwareItem({...newHardwareItem, quantity: parseInt(e.target.value) || 1})}
                                    className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500 font-bold text-slate-700"
                                />
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => { setShowHardwareModal(false); setEditingHardwareId(null); setNewHardwareItem({ name: '', quantity: 1 }); }}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleAddManualHardware}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-colors"
                                >
                                    {editingHardwareId ? 'Salvar Alterações' : 'Adicionar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF MODAL */}
            {selectedBudgetForPdf && (
                <BudgetPdfModal 
                    isOpen={showPdfModal}
                    onClose={() => { setShowPdfModal(false); setSelectedBudgetForPdf(null); }}
                    budget={selectedBudgetForPdf}
                    globalConfig={globalConfig}
                />
            )}
        </div>
    );
};
