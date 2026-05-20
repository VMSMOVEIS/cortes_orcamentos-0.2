import React, { useState, useEffect } from 'react';
import { X, FileText, Printer, Calendar, CreditCard, Truck, ShieldCheck, Building2, User, Phone, MapPin, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SavedBudget, OptimizationConfig, ClientInfo, CompanyProfile } from '../types';

interface BudgetPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    budget: SavedBudget;
    globalConfig: OptimizationConfig;
}

export const BudgetPdfModal: React.FC<BudgetPdfModalProps> = ({ isOpen, onClose, budget, globalConfig }) => {
    const [companyInfo, setCompanyInfo] = useState<CompanyProfile>({
        name: globalConfig.companyProfile?.name || '',
        address: globalConfig.companyProfile?.address || '',
        phone: globalConfig.companyProfile?.phone || '',
        email: globalConfig.companyProfile?.email || '',
        website: globalConfig.companyProfile?.website || '',
        cnpj: globalConfig.companyProfile?.cnpj || '',
        logoUrl: globalConfig.companyProfile?.logoUrl || ''
    });

    const [clientData, setClientData] = useState<ClientInfo>({ ...budget.client });

    const [terms, setTerms] = useState({
        validityDays: globalConfig.budgetSettings?.defaultValidityDays || 15,
        paymentTerms: globalConfig.budgetSettings?.defaultPaymentTerms || '50% de entrada + 50% na entrega',
        deliveryTime: globalConfig.budgetSettings?.defaultDeliveryTime || '30 dias úteis',
        warrantyText: globalConfig.budgetSettings?.defaultWarrantyText || 'Garantia de 5 anos contra defeitos de fabricação e montagem.'
    });

    useEffect(() => {
        if (isOpen) {
            setClientData({ ...budget.client });
            // Re-sync with global config if needed, but usually we want to keep user edits if they re-open? 
            // For now, reset to defaults + budget data on open
        }
    }, [isOpen, budget]);

    if (!isOpen) return null;

    const generatePdf = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let yPos = margin;

        // --- HEADER ---
        // Logo (Placeholder if URL exists, otherwise Text)
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.text(companyInfo.name || 'Sua Empresa', margin, yPos + 10);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        let contactY = yPos + 18;
        if (companyInfo.address) { doc.text(companyInfo.address, margin, contactY); contactY += 5; }
        if (companyInfo.phone || companyInfo.email) { doc.text(`${companyInfo.phone} | ${companyInfo.email}`, margin, contactY); contactY += 5; }
        if (companyInfo.website) { doc.text(companyInfo.website, margin, contactY); contactY += 5; }
        if (companyInfo.cnpj) { doc.text(`CNPJ: ${companyInfo.cnpj}`, margin, contactY); }

        // Budget Title & Info (Right Side)
        doc.setFontSize(26);
        doc.setTextColor(37, 99, 235); // Blue
        doc.text("ORÇAMENTO", pageWidth - margin, yPos + 15, { align: 'right' });
        
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Nº: ${budget.id.slice(-6)}`, pageWidth - margin, yPos + 25, { align: 'right' });
        doc.text(`Data: ${new Date().toLocaleDateString()}`, pageWidth - margin, yPos + 30, { align: 'right' });
        doc.text(`Validade: ${new Date(Date.now() + terms.validityDays * 86400000).toLocaleDateString()}`, pageWidth - margin, yPos + 35, { align: 'right' });

        yPos = Math.max(contactY, yPos + 35) + 15;

        // --- CLIENT INFO ---
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 35, 3, 3, 'F');
        
        doc.setFontSize(11);
        doc.setTextColor(37, 99, 235); // Blue
        doc.setFont('helvetica', 'bold');
        doc.text("DADOS DO CLIENTE", margin + 5, yPos + 8);

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'bold');
        doc.text("Nome:", margin + 5, yPos + 18);
        doc.setFont('helvetica', 'normal');
        doc.text(clientData.name, margin + 20, yPos + 18);

        doc.setFont('helvetica', 'bold');
        doc.text("Tel:", margin + 5, yPos + 24);
        doc.setFont('helvetica', 'normal');
        doc.text(clientData.phone, margin + 20, yPos + 24);

        doc.setFont('helvetica', 'bold');
        doc.text("Email:", pageWidth / 2, yPos + 24);
        doc.setFont('helvetica', 'normal');
        doc.text(clientData.email, (pageWidth / 2) + 15, yPos + 24);

        doc.setFont('helvetica', 'bold');
        doc.text("Endereço:", margin + 5, yPos + 30);
        doc.setFont('helvetica', 'normal');
        doc.text(clientData.address, margin + 25, yPos + 30);

        yPos += 45;

        // --- PROJECT DESCRIPTION ---
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.text(`Projeto: ${budget.projectName}`, margin, yPos);
        yPos += 8;

        if (clientData.notes) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            const splitNotes = doc.splitTextToSize(clientData.notes, pageWidth - (margin * 2));
            doc.text(splitNotes, margin, yPos);
            yPos += (splitNotes.length * 5) + 10;
        } else {
            yPos += 5;
        }

        // --- PRICING TABLE ---
        // We only have totals in SavedBudget, not individual items details for the PDF unless we saved them.
        // Assuming we want to show a summary or if we have parts we could list them.
        // For now, let's show the breakdown as stored in `items`.
        
        const tableData = [
            ['Materiais (MDF/Chapas)', `R$ ${budget.items.materials.toFixed(2)}`],
            ['Ferragens e Acessórios', `R$ ${budget.items.hardware.toFixed(2)}`],
            ['Fitas de Borda', `R$ ${budget.items.edges.toFixed(2)}`],
            ['Mão de Obra e Montagem', `R$ ${budget.items.labor.toFixed(2)}`],
            ['Outros Custos', `R$ ${budget.items.other.toFixed(2)}`],
        ];

        // Add Total Row
        // tableData.push(['', '']);
        // tableData.push(['TOTAL', `R$ ${budget.total.toFixed(2)}`]);

        autoTable(doc, {
            startY: yPos,
            head: [['Descrição', 'Valor']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
            },
            foot: [['TOTAL GERAL', `R$ ${budget.finalPrice.toFixed(2)}`]],
            footStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 12, halign: 'right' }
        });

        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15;

        // --- TERMS & CONDITIONS ---
        doc.setFontSize(11);
        doc.setTextColor(37, 99, 235);
        doc.setFont('helvetica', 'bold');
        doc.text("CONDIÇÕES COMERCIAIS", margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        
        const termsList = [
            { label: "Forma de Pagamento:", value: terms.paymentTerms },
            { label: "Prazo de Entrega:", value: terms.deliveryTime },
            { label: "Validade da Proposta:", value: `${terms.validityDays} dias` },
            { label: "Garantia:", value: terms.warrantyText }
        ];

        termsList.forEach(term => {
            doc.setFont('helvetica', 'bold');
            doc.text(term.label, margin, yPos);
            doc.setFont('helvetica', 'normal');
            const splitVal = doc.splitTextToSize(term.value, pageWidth - margin - 50);
            doc.text(splitVal, margin + 40, yPos);
            yPos += (splitVal.length * 5) + 3;
        });

        // --- SIGNATURES ---
        yPos = pageHeight - 40;
        
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, margin + 80, yPos); // Client Line
        doc.line(pageWidth - margin - 80, yPos, pageWidth - margin, yPos); // Company Line

        doc.setFontSize(8);
        doc.text("Assinatura do Cliente", margin + 15, yPos + 5);
        doc.text("Assinatura do Responsável", pageWidth - margin - 65, yPos + 5);

        // Save
        doc.save(`Orcamento_${clientData.name.replace(/\s+/g, '_')}_${budget.projectName}.pdf`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
                <div className="bg-slate-800 p-6 flex justify-between items-center sticky top-0 z-10">
                    <h3 className="text-white font-bold text-xl flex items-center gap-2">
                        <Printer size={24} className="text-emerald-400"/> Gerar PDF do Orçamento
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={28}/>
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT: CONFIGURATION FORM */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2">
                            <Building2 size={18} className="text-blue-600"/> Dados da Empresa (Cabeçalho)
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            <input type="text" placeholder="Nome da Empresa" value={companyInfo.name} onChange={e => setCompanyInfo({...companyInfo, name: e.target.value})} className="input-field" />
                            <input type="text" placeholder="Endereço Completo" value={companyInfo.address} onChange={e => setCompanyInfo({...companyInfo, address: e.target.value})} className="input-field" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="Telefone" value={companyInfo.phone} onChange={e => setCompanyInfo({...companyInfo, phone: e.target.value})} className="input-field" />
                                <input type="text" placeholder="Email" value={companyInfo.email} onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})} className="input-field" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="Site" value={companyInfo.website} onChange={e => setCompanyInfo({...companyInfo, website: e.target.value})} className="input-field" />
                                <input type="text" placeholder="CNPJ" value={companyInfo.cnpj} onChange={e => setCompanyInfo({...companyInfo, cnpj: e.target.value})} className="input-field" />
                            </div>
                        </div>

                        <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2 mt-6">
                            <User size={18} className="text-blue-600"/> Dados do Cliente
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            <input type="text" placeholder="Nome do Cliente" value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} className="input-field" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="Telefone" value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})} className="input-field" />
                                <input type="text" placeholder="Email" value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} className="input-field" />
                            </div>
                            <input type="text" placeholder="Endereço" value={clientData.address} onChange={e => setClientData({...clientData, address: e.target.value})} className="input-field" />
                        </div>
                    </div>

                    {/* RIGHT: TERMS & CONDITIONS */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2">
                            <FileText size={18} className="text-blue-600"/> Condições Comerciais
                        </h4>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="label-text"><Calendar size={14}/> Validade da Proposta (Dias)</label>
                                <input type="number" value={terms.validityDays} onChange={e => setTerms({...terms, validityDays: Number(e.target.value)})} className="input-field" />
                            </div>
                            
                            <div>
                                <label className="label-text"><CreditCard size={14}/> Condições de Pagamento</label>
                                <input type="text" value={terms.paymentTerms} onChange={e => setTerms({...terms, paymentTerms: e.target.value})} className="input-field" />
                            </div>

                            <div>
                                <label className="label-text"><Truck size={14}/> Prazo de Entrega</label>
                                <input type="text" value={terms.deliveryTime} onChange={e => setTerms({...terms, deliveryTime: e.target.value})} className="input-field" />
                            </div>

                            <div>
                                <label className="label-text"><ShieldCheck size={14}/> Texto de Garantia</label>
                                <textarea value={terms.warrantyText} onChange={e => setTerms({...terms, warrantyText: e.target.value})} className="input-field h-24 resize-none" />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-8">
                            <p className="text-xs text-blue-600 mb-2 font-bold uppercase">Resumo do Orçamento</p>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 font-medium">Valor Final</span>
                                <span className="text-2xl font-black text-slate-800">R$ {budget.finalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        <button 
                            onClick={generatePdf}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 mt-4 text-lg"
                        >
                            <Printer size={24}/> Gerar PDF Agora
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                .input-field {
                    @apply w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all;
                }
                .label-text {
                    @apply block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1;
                }
            `}</style>
        </div>
    );
};
