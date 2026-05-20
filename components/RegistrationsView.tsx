
import React, { useState } from 'react';
import { 
    Users, Wrench, Activity, HardDrive, Truck, 
    Search, Plus, Filter, Edit2, Trash2, ChevronLeft, 
    ChevronRight, Download, Upload, Info, Settings,
    Percent, Ruler, Building2, Briefcase, DollarSign,
    Clock, CheckCircle2, XCircle, MoreVertical, X, Save,
    Mail, MapPin, Phone, Hash, FileText, LayoutGrid, Disc
} from 'lucide-react';
import { 
    ProcessedPart, ExtractedComponent, RegisteredMaterial, RegisteredHardware, 
    RegisteredEdgeBand, RegisteredCollaborator, RegisteredSupplier, 
    RegisteredUnit, RegisteredTax, RegisteredIndirectCost, RegisteredEquipment 
} from '../types';
import { MaterialManager } from './MaterialManager';
import { EdgeBandManager } from './EdgeBandManager';
import { HardwareManager } from './HardwareManager';

const CollaboratorForm = ({ 
    item, 
    isEditing, 
    onSave, 
    collaboratorsCount 
}: { 
    item: any, 
    isEditing: boolean, 
    onSave: (newItem: RegisteredCollaborator) => void,
    collaboratorsCount: number
}) => {
    const [monthRate, setMonthRate] = useState(item?.monthRate || 0);
    const [productionHours, setProductionHours] = useState(item?.productionHours || 220);
    
    const hourRateValue = productionHours > 0 ? monthRate / productionHours : 0;

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newItem: RegisteredCollaborator = {
                id: item?.id || Date.now().toString(),
                code: formData.get('code') as string,
                name: formData.get('name') as string,
                role: formData.get('role') as string,
                sector: formData.get('sector') as string,
                type: formData.get('type') as string,
                monthRate: Number(monthRate),
                productionHours: Number(productionHours),
                hourRate: hourRateValue,
                status: formData.get('status') as 'Ativo' | 'Inativo'
            };
            onSave(newItem);
        }} className="space-y-4 font-sans">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Código</label>
                    <input name="code" defaultValue={item?.code || `COL-00${collaboratorsCount + 1}`} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Nome</label>
                    <input name="name" defaultValue={item?.name} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Função</label>
                    <input name="role" defaultValue={item?.role} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Setor</label>
                    <select name="sector" defaultValue={item?.sector || 'Montagem'} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold">
                        <option value="Corte">Corte</option>
                        <option value="Bordeamento">Bordeamento</option>
                        <option value="Montagem">Montagem</option>
                        <option value="Acabamento">Acabamento</option>
                        <option value="Administrativo">Administrativo</option>
                        <option value="Outro">Outro</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 font-black flex justify-between">
                        Valor Mês (R$)
                    </label>
                    <input 
                        name="monthRate" 
                        type="number" 
                        step="0.01" 
                        value={monthRate} 
                        onChange={(e) => setMonthRate(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" 
                        required 
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Horas Produção / Mês</label>
                    <input 
                        name="productionHours" 
                        type="number" 
                        value={productionHours} 
                        onChange={(e) => setProductionHours(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 border border-blue-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                        required 
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-blue-600">Valor Hora (Calculado)</label>
                    <div className="w-full p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs font-black text-blue-700">
                        R$ {hourRateValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <input type="hidden" name="hourRate" value={hourRateValue} />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Tipo</label>
                    <input name="type" defaultValue={item?.type || 'Hora Produtiva'} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" />
                </div>
                <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Status</label>
                    <select name="status" defaultValue={item?.status || 'Ativo'} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold">
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                    </select>
                </div>
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-100 mt-4 hover:bg-blue-700 transition-all active:scale-[0.98]">
                {isEditing ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}
            </button>
        </form>
    );
};

interface RegistrationsViewProps {
    materials: RegisteredMaterial[];
    edgeRegistry: RegisteredEdgeBand[];
    hardwareRegistry: RegisteredHardware[];
    collaborators: RegisteredCollaborator[];
    suppliers: RegisteredSupplier[];
    units: RegisteredUnit[];
    taxes: RegisteredTax[];
    indirectCosts: RegisteredIndirectCost[];
    equipment: RegisteredEquipment[];
    onUpdateMaterials: (mats: RegisteredMaterial[]) => void;
    onUpdateEdges: (edges: RegisteredEdgeBand[]) => void;
    onUpdateHardware: (hw: RegisteredHardware[]) => void;
    onUpdateCollaborators: (colabs: RegisteredCollaborator[]) => void;
    onUpdateSuppliers: (sups: RegisteredSupplier[]) => void;
    onUpdateUnits: (units: RegisteredUnit[]) => void;
    onUpdateTaxes: (taxes: RegisteredTax[]) => void;
    onUpdateIndirectCosts: (costs: RegisteredIndirectCost[]) => void;
    onUpdateEquipment: (equip: RegisteredEquipment[]) => void;
    onClose?: () => void;
}

export const RegistrationsView: React.FC<RegistrationsViewProps> = ({
    materials,
    edgeRegistry,
    hardwareRegistry,
    collaborators,
    suppliers,
    units,
    taxes,
    indirectCosts,
    equipment,
    onUpdateMaterials,
    onUpdateEdges,
    onUpdateHardware,
    onUpdateCollaborators,
    onUpdateSuppliers,
    onUpdateUnits,
    onUpdateTaxes,
    onUpdateIndirectCosts,
    onUpdateEquipment,
    onClose
}) => {
    const [subTab, setSubTab] = useState('chapas');
    const [isEditing, setIsEditing] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    
    // Generic handlers for all tables
    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setIsEditing(false);
        setShowModal(true);
    };

    // Sub-renderers for modals based on subTab
    const renderModalContent = () => {
        if (!showModal) return null;

        switch(subTab) {
            case 'colaboradores': {
                return (
                    <CollaboratorForm 
                        item={editingItem}
                        isEditing={isEditing}
                        collaboratorsCount={collaborators.length}
                        onSave={(newItem) => {
                            if (isEditing) {
                                onUpdateCollaborators(collaborators.map(c => c.id === newItem.id ? newItem : c));
                            } else {
                                onUpdateCollaborators([...collaborators, newItem]);
                            }
                            setShowModal(false);
                        }}
                    />
                );
            }
            case 'custos': {
                const item = editingItem as RegisteredIndirectCost || { id: '', code: `CI-00${indirectCosts.length + 1}`, name: '', value: 0, category: 'Fixo' };
                return (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const newItem: RegisteredIndirectCost = {
                            id: item.id || Date.now().toString(),
                            code: formData.get('code') as string,
                            name: formData.get('name') as string,
                            value: Number(formData.get('value')),
                            category: formData.get('category') as 'Fixo' | 'Variável'
                        };
                        if (isEditing) {
                            onUpdateIndirectCosts(indirectCosts.map(c => c.id === newItem.id ? newItem : c));
                        } else {
                            onUpdateIndirectCosts([...indirectCosts, newItem]);
                        }
                        setShowModal(false);
                    }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Código</label>
                                <input name="code" defaultValue={item.code} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Descrição</label>
                                <input name="name" defaultValue={item.name} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Valor (R$)</label>
                                <input name="value" type="number" step="0.01" defaultValue={item.value} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Categoria</label>
                                <select name="category" defaultValue={item.category} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold">
                                    <option value="Fixo">Fixo</option>
                                    <option value="Variável">Variável</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs">
                            {isEditing ? 'Atualizar' : 'Cadastrar'}
                        </button>
                    </form>
                );
            }
            case 'fornecedores': {
                const item = editingItem as RegisteredSupplier || { id: '', code: `FOR-00${suppliers.length + 1}`, name: '', category: '', contact: '', phone: '' };
                return (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const newItem: RegisteredSupplier = {
                            id: item.id || Date.now().toString(),
                            code: formData.get('code') as string,
                            name: formData.get('name') as string,
                            category: formData.get('category') as string,
                            contact: formData.get('contact') as string,
                            phone: formData.get('phone') as string
                        };
                        if (isEditing) {
                            onUpdateSuppliers(suppliers.map(f => f.id === newItem.id ? newItem : f));
                        } else {
                            onUpdateSuppliers([...suppliers, newItem]);
                        }
                        setShowModal(false);
                    }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Código</label>
                                <input name="code" defaultValue={item.code} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Nome Fantasia</label>
                                <input name="name" defaultValue={item.name} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Categoria</label>
                                <input name="category" defaultValue={item.category} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Contato</label>
                                <input name="contact" defaultValue={item.contact} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Telefone</label>
                                <input name="phone" defaultValue={item.phone} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" />
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs">
                            {isEditing ? 'Atualizar' : 'Cadastrar'}
                        </button>
                    </form>
                );
            }
            case 'unidades': {
                const item = editingItem as RegisteredUnit || { id: '', name: '', category: '' };
                return (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const newItem: RegisteredUnit = {
                            id: formData.get('id') as string,
                            name: formData.get('name') as string,
                            category: formData.get('category') as string
                        };
                        if (isEditing) {
                            onUpdateUnits(units.map(u => u.id === item.id ? newItem : u));
                        } else {
                            onUpdateUnits([...units, newItem]);
                        }
                        setShowModal(false);
                    }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">ID / Símbolo</label>
                                <input name="id" defaultValue={item.id} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" placeholder="EX: M2" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Descrição</label>
                                <input name="name" defaultValue={item.name} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Categoria</label>
                                <input name="category" defaultValue={item.category} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" />
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs">
                            {isEditing ? 'Atualizar' : 'Cadastrar'}
                        </button>
                    </form>
                );
            }
            case 'impostos': {
                const item = editingItem as RegisteredTax || { id: '', code: `IMP-00${taxes.length + 1}`, name: '', value: 0, type: 'Faturamento', status: 'Ativo' };
                return (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const newItem: RegisteredTax = {
                            id: item.id || Date.now().toString(),
                            code: formData.get('code') as string,
                            name: formData.get('name') as string,
                            value: Number(formData.get('value')),
                            type: formData.get('type') as string,
                            status: formData.get('status') as 'Ativo' | 'Inativo'
                        };
                        if (isEditing) {
                            onUpdateTaxes(taxes.map(t => t.id === newItem.id ? newItem : t));
                        } else {
                            onUpdateTaxes([...taxes, newItem]);
                        }
                        setShowModal(false);
                    }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Código</label>
                                <input name="code" defaultValue={item.code} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Nome do Imposto</label>
                                <input name="name" defaultValue={item.name} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Alíquota (%)</label>
                                <input name="value" type="number" step="0.01" defaultValue={item.value} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Base</label>
                                <input name="type" defaultValue={item.type} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" />
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs">
                            {isEditing ? 'Atualizar' : 'Cadastrar'}
                        </button>
                    </form>
                );
            }
            case 'equipamentos': {
                const item = editingItem as RegisteredEquipment || { id: '', code: `EQP-00${equipment.length + 1}`, name: '', brand: '', power: '', status: 'Operacional' };
                return (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const newItem: RegisteredEquipment = {
                            id: item.id || Date.now().toString(),
                            code: formData.get('code') as string,
                            name: formData.get('name') as string,
                            brand: formData.get('brand') as string,
                            power: formData.get('power') as string,
                            status: formData.get('status') as 'Operacional' | 'Manutenção' | 'Inativo'
                        };
                        if (isEditing) {
                            onUpdateEquipment(equipment.map(eq => eq.id === newItem.id ? newItem : eq));
                        } else {
                            onUpdateEquipment([...equipment, newItem]);
                        }
                        setShowModal(false);
                    }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Código</label>
                                <input name="code" defaultValue={item.code} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Nome</label>
                                <input name="name" defaultValue={item.name} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" required />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Marca/Modelo</label>
                                <input name="brand" defaultValue={item.brand} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400">Potência/Consumo</label>
                                <input name="power" defaultValue={item.power} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black uppercase text-slate-400">Status</label>
                                <select name="status" defaultValue={item.status} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold">
                                    <option value="Operacional">Operacional</option>
                                    <option value="Manutenção">Manutenção</option>
                                    <option value="Inativo">Inativo</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs">
                            {isEditing ? 'Atualizar' : 'Cadastrar'}
                        </button>
                    </form>
                );
            }
            default: return null;
        }
    };

    const subTabs = [
        { id: 'chapas', label: 'Chapas (MDF/MDP)', icon: LayoutGrid },
        { id: 'fitas', label: 'Fitas de Borda', icon: Disc },
        { id: 'ferragens', label: 'Ferragens (Catálogo)', icon: Wrench },
        { id: 'colaboradores', label: 'Colaboradores', icon: Users },
        { id: 'custos', label: 'Custos Indiretos', icon: Activity },
        { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
        { id: 'unidades', label: 'Unidades', icon: Ruler },
        { id: 'impostos', label: 'Impostos', icon: DollarSign },
        { id: 'equipamentos', label: 'Equipamentos', icon: HardDrive },
    ];

    const renderManager = () => {
        switch(subTab) {
            case 'chapas':
                return (
                    <div className="p-4 bg-slate-50 min-h-[600px]">
                        <div className="max-w-4xl mx-auto">
                            <MaterialManager 
                                materials={materials}
                                onAdd={m => onUpdateMaterials([...materials, m])}
                                onRemove={id => onUpdateMaterials(materials.filter(m => m.id !== id))}
                                onUpdate={u => onUpdateMaterials(materials.map(m => m.id === u.id ? u : m))}
                                onClose={() => {}} // No close needed here as it is embedded
                                isEmbedded={true} 
                            />
                        </div>
                    </div>
                );
            case 'fitas':
                return (
                    <div className="p-4 bg-slate-50 min-h-[600px]">
                        <div className="max-w-4xl mx-auto">
                            <EdgeBandManager 
                                edgeBands={edgeRegistry}
                                onAdd={e => onUpdateEdges([...edgeRegistry, e])}
                                onRemove={id => onUpdateEdges(edgeRegistry.filter(r => r.id !== id))}
                                onUpdate={u => onUpdateEdges(edgeRegistry.map(r => r.id === u.id ? u : r))}
                                onClose={() => {}}
                                isEmbedded={true}
                            />
                        </div>
                    </div>
                );
            case 'ferragens':
                return (
                    <div className="p-4 bg-slate-50 min-h-[600px]">
                        <div className="max-w-4xl mx-auto">
                            <HardwareManager 
                                hardwareList={hardwareRegistry}
                                onAdd={h => onUpdateHardware([...hardwareRegistry, h])}
                                onRemove={id => onUpdateHardware(hardwareRegistry.filter(r => r.id !== id))}
                                onUpdate={u => onUpdateHardware(hardwareRegistry.map(r => r.id === u.id ? u : r))}
                                onClose={() => {}}
                                isEmbedded={true}
                            />
                        </div>
                    </div>
                );
            case 'colaboradores':
                return (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" placeholder="Buscar colaborador..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                                <Plus size={14}/> Novo Colaborador
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-black italic border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Código</th>
                                        <th className="px-6 py-4">Nome</th>
                                        <th className="px-6 py-4">Função</th>
                                        <th className="px-6 py-4">Setor</th>
                                        <th className="px-6 py-4 text-right">Custo Mês</th>
                                        <th className="px-6 py-4 text-right">Custo Hora</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[11px]">
                                    {collaborators.map((col, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-400">{col.code}</td>
                                            <td className="px-6 py-4 font-black text-slate-700">{col.name}</td>
                                            <td className="px-6 py-4 italic font-bold text-slate-500 uppercase">{col.role}</td>
                                            <td className="px-6 py-4 font-bold text-blue-600">{col.sector}</td>
                                            <td className="px-6 py-4 text-right font-mono font-black">R$ {col.monthRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-blue-600 font-bold font-mono">R$ {col.hourRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase font-black">{col.productionHours}h</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${col.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {col.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(col)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                                                    <button onClick={() => onUpdateCollaborators(collaborators.filter(c => c.id !== col.id))} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'custos':
                return (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" placeholder="Buscar custo..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                                <Plus size={14}/> Novo Custo Indireto
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-black italic border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Código</th>
                                        <th className="px-6 py-4">Descrição</th>
                                        <th className="px-6 py-4">Categoria</th>
                                        <th className="px-6 py-4 text-right">Valor Mensal</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[11px]">
                                    {indirectCosts.map((c, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-400">{c.code}</td>
                                            <td className="px-6 py-4 font-black text-slate-700">{c.name}</td>
                                            <td className="px-6 py-4 uppercase font-bold text-slate-500 italic">{c.category}</td>
                                            <td className="px-6 py-4 text-right font-mono font-black text-blue-600">R$ {c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                                                    <button onClick={() => onUpdateIndirectCosts(indirectCosts.filter(item => item.id !== c.id))} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'fornecedores':
                return (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" placeholder="Buscar fornecedor..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                                <Plus size={14}/> Novo Fornecedor
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-black italic border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Código</th>
                                        <th className="px-6 py-4">Nome Fantasia</th>
                                        <th className="px-6 py-4">Categoria</th>
                                        <th className="px-6 py-4">Contato</th>
                                        <th className="px-6 py-4 text-center">Telefone</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[11px]">
                                    {suppliers.map((f, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-400">{f.code}</td>
                                            <td className="px-6 py-4 font-black text-slate-700">{f.name}</td>
                                            <td className="px-6 py-4 uppercase font-bold text-slate-500 italic">{f.category}</td>
                                            <td className="px-6 py-4 font-medium text-slate-500">{f.contact}</td>
                                            <td className="px-6 py-4 text-center font-mono text-slate-600">{f.phone}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(f)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                                                    <button onClick={() => onUpdateSuppliers(suppliers.filter(item => item.id !== f.id))} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'unidades':
                return (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" placeholder="Buscar unidade..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                                <Plus size={14}/> Nova Unidade
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-black italic border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Descrição</th>
                                        <th className="px-6 py-4">Categoria</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[11px]">
                                    {units.map((u, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-black text-blue-600">{u.id}</td>
                                            <td className="px-6 py-4 font-black text-slate-700">{u.name}</td>
                                            <td className="px-6 py-4 uppercase font-bold text-slate-500 italic">{u.category}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                                                    <button onClick={() => onUpdateUnits(units.filter(item => item.id !== u.id))} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'impostos':
                return (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" placeholder="Buscar imposto..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                                <Plus size={14}/> Novo Imposto
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-black italic border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Código</th>
                                        <th className="px-6 py-4">Inscrição</th>
                                        <th className="px-6 py-4 text-right">Alíquota (%)</th>
                                        <th className="px-6 py-4">Base</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[11px]">
                                    {taxes.map((i, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-400">{i.code}</td>
                                            <td className="px-6 py-4 font-black text-slate-700">{i.name}</td>
                                            <td className="px-6 py-4 text-right font-black text-blue-600">{i.value.toFixed(2)} %</td>
                                            <td className="px-6 py-4 uppercase font-bold text-slate-500 italic">{i.type}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                                                    <button onClick={() => onUpdateTaxes(taxes.filter(item => item.id !== i.id))} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'equipamentos':
                return (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" placeholder="Buscar equipamento..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                                <Plus size={14}/> Novo Equipamento
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-black italic border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Código</th>
                                        <th className="px-6 py-4">Equipamento</th>
                                        <th className="px-6 py-4">Marca/Modelo</th>
                                        <th className="px-6 py-4 text-center">Potência</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[11px]">
                                    {equipment.map((e, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-400">{e.code}</td>
                                            <td className="px-6 py-4 font-black text-slate-700">{e.name}</td>
                                            <td className="px-6 py-4 uppercase font-bold text-slate-500 italic">{e.brand}</td>
                                            <td className="px-6 py-4 text-center font-mono font-bold text-blue-600">{e.power}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${e.status === 'Operacional' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {e.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                                                    <button onClick={() => onUpdateEquipment(equipment.filter(item => item.id !== e.id))} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return <div className="p-12 text-center text-slate-300 italic font-medium">Coming Soon - Módulo em Desenvolvimento</div>;
        }
    };

    return (
        <div className="animate-fade-in space-y-6 pb-20 relative px-6 py-6 h-full overflow-y-auto no-scrollbar">
            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                            <h3 className="font-black uppercase tracking-tight">{isEditing ? 'Editar Registro' : 'Novo Registro'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            {renderModalContent()}
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shadow-inner font-black italic">
                         <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Painel de <span className="text-blue-600 italic">Cadastros</span></h2>
                        <p className="text-slate-400 text-xs">Banco de dados centralizado de materiais e parâmetros</p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                     <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-bold text-[10px] uppercase hover:bg-slate-200 transition-all font-black italic"><Download size={14}/> Exportar CSV</button>
                     <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-blue-700 transition-all font-black italic shadow-lg shadow-blue-100"><Plus size={14}/> Backup Nuvem</button>
                     {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-3 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all active:scale-90"
                            title="Fechar"
                        >
                            <X size={20}/>
                        </button>
                     )}
                </div>
            </div>

            {/* MAIN NAVIGATION TAB BAR */}
            <div className="flex flex-wrap gap-2 p-2 bg-slate-100/50 rounded-2xl border border-slate-200/50 shadow-inner">
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSubTab(tab.id)}
                        className={`px-4 py-3 text-[10px] font-black uppercase tracking-tight rounded-xl transition-all flex items-center gap-2 ${
                            subTab === tab.id
                            ? 'bg-white text-blue-600 shadow-md transform scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {renderManager()}
            </div>
        </div>
    );
};
