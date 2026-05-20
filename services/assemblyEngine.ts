
import { ProcessedPart, AssemblyManual, AssemblyModule, AssemblyStep } from "../types";

/**
 * MOTOR DE ENGENHARIA (Heurístico)
 * Transforma a lista de peças em um JSON estruturado de montagem.
 */

// Helper para categorizar complexidade
const calculateComplexity = (parts: ProcessedPart[]): 'Baixa' | 'Média' | 'Alta' => {
    if (parts.length < 10) return 'Baixa';
    if (parts.length < 30) return 'Média';
    return 'Alta';
};

// Helper para identificar peças por categoria
const getPartsByCategory = (parts: ProcessedPart[], categorySnippet: string) => {
    return parts.filter(p => 
        p.groupCategory.toLowerCase().includes(categorySnippet.toLowerCase()) || 
        p.finalName.toLowerCase().includes(categorySnippet.toLowerCase())
    );
};

// --- REGRAS DE ENGENHARIA (Hardware Rules) ---

// Regra de Dobradiças por Altura da Porta
const calculateHingesPerDoor = (heightMm: number): number => {
    // até 90cm (900mm) -> 2
    if (heightMm <= 900) return 2;
    // até 160cm (1600mm) -> 3
    if (heightMm <= 1600) return 3;
    // até 230cm (2300mm) -> 4
    if (heightMm <= 2300) return 4;
    // até 275cm (2750mm) -> 5
    if (heightMm <= 2750) return 5;
    // Acima disso
    return 6;
};

// Regra de Parafusos por Largura de Conexão (Profundidade)
const calculateScrewsPerConnection = (widthMm: number): number => {
    // até 45cm (450mm) -> 2
    if (widthMm <= 450) return 2;
    // até 60cm (600mm) -> 3
    if (widthMm <= 600) return 3;
    // até 80cm (800mm) -> 4
    if (widthMm <= 800) return 4;
    // até 120cm (1200mm) -> 5
    if (widthMm <= 1200) return 5;
    // Acima disso
    return 6;
};


export const generateAssemblyJSON = (parts: ProcessedPart[], projectName: string): AssemblyManual => {
    
    // 1. Organizar Materiais
    const materialSet = new Set<string>();
    parts.forEach(p => materialSet.add(`${p.materialName}||${p.dimensions.thickness}`));
    const materiaisDoc = Array.from(materialSet).map(m => {
        const [desc, thick] = m.split('||');
        return { descricao: desc, espessura_mm: Number(thick) };
    });

    // 2. Classificação de Peças
    const laterais = getPartsByCategory(parts, 'Lateral');
    const prateleiras = getPartsByCategory(parts, 'Prateleira');
    const bases = getPartsByCategory(parts, 'Base');
    const tampos = getPartsByCategory(parts, 'Tampo');
    const travessas = getPartsByCategory(parts, 'Travessa');
    const portas = getPartsByCategory(parts, 'Porta');
    const gavetas = getPartsByCategory(parts, 'Gaveta');
    const fundos = getPartsByCategory(parts, 'Fundo');

    // 3. Cálculo Preciso de Ferragens
    
    // Cálculo de Dobradiças
    let totalDobradicas = 0;
    portas.forEach(p => {
        const qtdPorPorta = calculateHingesPerDoor(p.dimensions.height);
        totalDobradicas += qtdPorPorta * p.quantity;
    });

    // Cálculo de Parafusos Estruturais (Base + Tampo + Prateleiras + Travessas)
    // Assumimos conexão em 2 lados (Esquerda/Direita)
    let totalParafusosEst = 0;
    const pecasEstruturais = [...bases, ...tampos, ...prateleiras, ...travessas];
    
    pecasEstruturais.forEach(p => {
        // Usa a largura (profundidade) para definir quantos parafusos vão em cada borda
        const parafusosPorLado = calculateScrewsPerConnection(p.dimensions.width);
        totalParafusosEst += (parafusosPorLado * 2) * p.quantity; 
    });

    // Adiciona parafusos extras para laterais se houver fixação específica (ex: rodapé)
    // Mas geralmente a lateral recebe o parafuso, não "leva"
    
    // Outros cálculos
    const qtdCorredicas = gavetas.length; 
    const qtdPregos = fundos.length * 20; // Estimativa por perímetro

    // Parafusos menores (14mm) para ferragens
    // 4 parafusos por dobradiça + 6 por par de corrediça
    const qtdParafusos14mm = (totalDobradicas * 4) + (qtdCorredicas * 6);

    const ferragensDoc = [
        { 
            nome: "Parafuso Estrutural 4.0x50mm", 
            quantidade: totalParafusosEst, 
            uso: "Montagem da caixa estrutural (Furação calculada por largura)" 
        },
        { 
            nome: "Parafuso 3.5x14mm", 
            quantidade: qtdParafusos14mm, 
            uso: "Fixação de dobradiças e corrediças" 
        },
        { 
            nome: "Cavilha 8x30mm", 
            quantidade: totalParafusosEst, 
            uso: "Alinhamento (mesma qtd parafusos)" 
        },
    ];

    if (totalDobradicas > 0) {
        ferragensDoc.push({ 
            nome: "Dobradiça Caneco 35mm", 
            quantidade: totalDobradicas, 
            uso: "Portas (Qtd baseada na altura)" 
        });
    }
    
    if (qtdCorredicas > 0) {
        ferragensDoc.push({ nome: "Corrediça Telescópica", quantidade: qtdCorredicas, uso: "Gavetas" });
    }
    if (fundos.length > 0) {
        ferragensDoc.push({ nome: "Prego 10x10 ou Parafuso Fundo", quantidade: qtdPregos, uso: "Fixação do fundo" });
    }

    // 4. Lógica de Passos de Montagem
    const passos: AssemblyStep[] = [];
    let stepCount = 1;

    // Passo 1: Preparação das Laterais
    if (laterais.length > 0) {
        passos.push({
            passo: stepCount++,
            titulo: "Preparação das Laterais",
            descricao_tecnica: `Coloque as laterais sobre uma superfície plana. Fixe os calços das ${totalDobradicas} dobradiças e as ${qtdCorredicas} corrediças (se houver) respeitando as marcações.`,
            pecas_utilizadas: laterais.map(p => ({ id: p.manualId || 0, nome: p.finalName, qtd: p.quantity })),
            ferragens_utilizadas: [
                { nome: "Parafuso 3.5x14mm", qtd: qtdParafusos14mm }
            ],
            ferramentas: ["Parafusadeira", "Martelo Borracha", "Esquadro"],
            observacoes: "Atenção: A quantidade de dobradiças varia conforme a altura da porta."
        });
    }

    // Passo 2: Estrutura Principal (Base + Teto + Laterais)
    if ((bases.length > 0 || tampos.length > 0) && laterais.length > 0) {
        // Calcular parafusos específicos para este passo
        let parafusosPasso2 = 0;
        [...bases, ...tampos].forEach(p => {
             parafusosPasso2 += calculateScrewsPerConnection(p.dimensions.width) * 2 * p.quantity;
        });

        passos.push({
            passo: stepCount++,
            titulo: "Montagem da Caixa Estrutural",
            descricao_tecnica: "Una a Base Inferior e o Tampo/Travessas às Laterais. Use a regra de parafusos baseada na largura da peça (2 parafusos até 45cm, 3 até 60cm...).",
            pecas_utilizadas: [...bases, ...tampos, ...travessas].map(p => ({ id: p.manualId || 0, nome: p.finalName, qtd: p.quantity })),
            ferragens_utilizadas: [
                { nome: "Cavilha 8x30mm", qtd: parafusosPasso2 },
                { nome: "Parafuso Estrutural 4.0x50mm", qtd: parafusosPasso2 }
            ],
            ferramentas: ["Parafusadeira", "Chave Philips", "Marreta de Borracha"],
            observacoes: "Garanta que as bordas frontais estejam perfeitamente alinhadas."
        });
    }

    // Passo 3: Esquadro e Fundo (Crucial)
    if (fundos.length > 0) {
        passos.push({
            passo: stepCount++,
            titulo: "Travamento e Fixação do Fundo",
            descricao_tecnica: "Confira o esquadro do móvel medindo as diagonais (X). Elas devem ter a mesma medida. Após alinhar, fixe o fundo.",
            pecas_utilizadas: fundos.map(p => ({ id: p.manualId || 0, nome: p.finalName, qtd: p.quantity })),
            ferragens_utilizadas: [
                { nome: "Prego 10x10", qtd: qtdPregos }
            ],
            ferramentas: ["Trena", "Martelo"],
            observacoes: "O fundo é o principal responsável pela estabilidade do móvel. Não pule a conferência do esquadro."
        });
    }

    // Passo 4: Internos (Prateleiras)
    if (prateleiras.length > 0) {
        let parafusosPasso4 = 0;
        prateleiras.forEach(p => {
             parafusosPasso4 += calculateScrewsPerConnection(p.dimensions.width) * 2 * p.quantity;
        });

        passos.push({
            passo: stepCount++,
            titulo: "Instalação de Internos",
            descricao_tecnica: "Insira as prateleiras e divisórias internas. Fixe utilizando a quantidade correta de parafusos por profundidade.",
            pecas_utilizadas: prateleiras.map(p => ({ id: p.manualId || 0, nome: p.finalName, qtd: p.quantity })),
            ferragens_utilizadas: [
                { nome: "Parafuso Estrutural 4.0x50mm", qtd: parafusosPasso4 }
            ],
            ferramentas: ["Parafusadeira", "Nível"],
            observacoes: ""
        });
    }

    // Passo 5: Frentes (Portas e Gavetas)
    if (portas.length > 0 || gavetas.length > 0) {
        passos.push({
            passo: stepCount++,
            titulo: "Instalação de Frentes e Regulagem",
            descricao_tecnica: `Encaixe as frentes. Regra de Dobradiças aplicada: Portas até 90cm (2un), até 160cm (3un), até 230cm (4un), até 275cm (5un).`,
            pecas_utilizadas: [...portas, ...gavetas].map(p => ({ id: p.manualId || 0, nome: p.finalName, qtd: p.quantity })),
            ferragens_utilizadas: [
                { nome: "Dobradiça Caneco 35mm", qtd: totalDobradicas }
            ],
            ferramentas: ["Chave Philips Manual"],
            observacoes: "Deixe espaçamento padrão de 3mm entre as frentes."
        });
    }

    // Construção do JSON Final
    const manual: AssemblyManual = {
        projeto: {
            nome: projectName,
            categoria: "Móvel Planejado / Modulado",
            nivel_complexidade: calculateComplexity(parts),
            observacoes_gerais: "Sempre utilize EPIs. A montagem deve ser realizada em piso nivelado e protegido."
        },
        materiais: materiaisDoc,
        ferragens: ferragensDoc,
        modulos: [
            {
                nome_modulo: "Módulo Principal", // Em um sistema avançado, separariamos por clusters espaciais
                ordem_montagem: 1,
                passos: passos
            }
        ],
        seguranca: {
            epis: ["Óculos de Proteção", "Luvas de Montagem", "Calçado Fechado"],
            alertas: [
                "Cuidado ao manusear ferramentas elétricas.",
                "Peças grandes devem ser movidas por duas pessoas.",
                "Não aperte excessivamente os parafusos para não espanar o MDF."
            ]
        },
        checklist_final: [
            "Móvel está no esquadro?",
            "Fundo está bem fixado?",
            "Portas estão alinhadas?",
            "Gavetas correm suavemente?",
            "Limpeza final realizada?"
        ]
    };

    return manual;
};
