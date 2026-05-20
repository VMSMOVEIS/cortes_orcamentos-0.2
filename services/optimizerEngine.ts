
import { OptimizationConfig, ProcessedPart, OptimizationResult, OptimizedSheet, PlacedPart, Offcut } from '../types';

interface Node {
    x: number;
    y: number;
    w: number;
    h: number;
    used: boolean;
    down: Node | null;
    right: Node | null;
}

/**
 * ENGINE GUILLOTINE PACKER V4 (HIGH DENSITY)
 * Algoritmo avançado que utiliza estratégia "Best Fit" (Melhor Encaixe)
 * ao invés de "First Fit", garantindo maior densidade.
 */
class GuillotinePacker {
  root: Node;
  binWidth: number;
  binHeight: number;
  bladeThickness: number;
  cutDirection: 'auto' | 'vertical' | 'horizontal';
  freeRectangles: Node[];
  
  constructor(width: number, height: number, bladeThickness: number, cutDirection: 'auto' | 'vertical' | 'horizontal' = 'auto') {
    this.binWidth = width;
    this.binHeight = height;
    this.bladeThickness = bladeThickness;
    this.cutDirection = cutDirection;
    this.root = { x: 0, y: 0, w: width, h: height, used: false, down: null, right: null };
    this.freeRectangles = [this.root]; // Lista plana para busca rápida
  }

  /**
   * Tenta encaixar a peça procurando em TODOS os espaços livres o "Melhor Encaixe"
   */
  fit(w: number, h: number, allowRotation: boolean, heuristic: 'BestArea' | 'BestShortSide' | 'BestLongSide'): { x: number, y: number, w: number, h: number, rotated: boolean } | null {
    
    let bestNode: Node | null = null;
    let bestScore = Number.MAX_VALUE;
    let bestRotated = false;

    // Percorre todos os nós livres para encontrar o campeão (Best Fit)
    // Isso evita o problema de "First Fit" onde a peça pega o primeiro buraco grande e fragmenta a chapa
    for (const node of this.freeRectangles) {
        // Tenta Normal
        if (w <= node.w && h <= node.h) {
            const score = this.calculateScore(node, w, h, heuristic);
            if (this.isBetter(score, node, bestScore, bestNode)) {
                bestNode = node;
                bestScore = score;
                bestRotated = false;
            }
        }

        // Tenta Rotacionado
        if (allowRotation && h <= node.w && w <= node.h) {
            const score = this.calculateScore(node, h, w, heuristic);
            if (this.isBetter(score, node, bestScore, bestNode)) {
                bestNode = node;
                bestScore = score;
                bestRotated = true;
            }
        }
    }

    if (bestNode) {
        const finalW = bestRotated ? h : w;
        const finalH = bestRotated ? w : h;
        this.splitNode(bestNode, finalW, finalH);
        return { x: bestNode.x, y: bestNode.y, w: finalW, h: finalH, rotated: bestRotated };
    }

    return null;
  }

  // Compara scores com critério de desempate: Esquerda > Baixo
  private isBetter(score: number, node: Node, bestScore: number, bestNode: Node | null): boolean {
      if (bestNode === null) return true;
      
      // Se o score for significativamente melhor, ganha
      if (score < bestScore - 0.001) return true;
      
      // Se for empate técnico (scores muito próximos)
      if (Math.abs(score - bestScore) <= 0.001) {
          // Prioriza o nó mais à ESQUERDA (menor X)
          if (node.x < bestNode.x - 0.001) return true;
          
          // Se o X for igual, prioriza o nó mais em BAIXO (menor Y)
          if (Math.abs(node.x - bestNode.x) <= 0.001 && node.y < bestNode.y) return true;
      }
      
      return false;
  }

  private calculateScore(node: Node, w: number, h: number, heuristic: string): number {
      const areaFit = (node.w * node.h) - (w * h); // Quanto sobra de área
      const shortSideFit = Math.min(node.w - w, node.h - h); // Menor sobra lateral
      const longSideFit = Math.max(node.w - w, node.h - h); // Maior sobra lateral

      if (heuristic === 'BestArea') return areaFit;
      if (heuristic === 'BestShortSide') return shortSideFit;
      return longSideFit;
  }

  private splitNode(node: Node, w: number, h: number) {
    node.used = true;
    
    // Remove este nó da lista de livres, pois será dividido
    const index = this.freeRectangles.indexOf(node);
    if (index > -1) {
        this.freeRectangles.splice(index, 1);
    }

    const remW = node.w - w;
    const remH = node.h - h;
    const kerf = this.bladeThickness;

    let splitHorizontally = false;

    // DECISÃO DE CORTE (SPLIT HEURISTIC)
    // Vertical = Corta ao longo da altura -> Gera sobra vertical grande à direita.
    // Horizontal = Corta ao longo da largura -> Gera sobra horizontal grande abaixo.
    
    if (this.cutDirection === 'vertical') {
        // Força sobra vertical (preserva altura total à direita)
        splitHorizontally = false; 
    } else if (this.cutDirection === 'horizontal') {
        // Força sobra horizontal (preserva largura total abaixo)
        splitHorizontally = true;
    } else {
        // AUTO: Maximizar a área do maior retângulo restante
        const freeAreaVert = (remW - kerf) * node.h; // Área se cortar verticalmente (Sobra direita full height)
        const freeAreaHoriz = node.w * (remH - kerf); // Área se cortar horizontalmente (Sobra baixo full width)
        
        // Se a sobra horizontal for maior, cortamos horizontalmente
        splitHorizontally = freeAreaHoriz > freeAreaVert;
    }

    if (splitHorizontally) {
        // Corte Horizontal (Prioriza manter a largura total embaixo)
        // Down recebe a largura total (node.w)
        node.down = { x: node.x, y: node.y + h + kerf, w: node.w, h: remH - kerf, used: false, down: null, right: null };
        // Right recebe apenas a altura da peça (h)
        node.right = { x: node.x + w + kerf, y: node.y, w: remW - kerf, h: h, used: false, down: null, right: null };
    } else {
        // Corte Vertical (Prioriza manter a altura total na direita)
        // Down recebe apenas a largura da peça (w)
        node.down = { x: node.x, y: node.y + h + kerf, w: w, h: remH - kerf, used: false, down: null, right: null };
        // Right recebe a altura total (node.h)
        node.right = { x: node.x + w + kerf, y: node.y, w: remW - kerf, h: node.h, used: false, down: null, right: null };
    }
    
    // Adiciona os novos retângulos à lista de livres se forem válidos
    if (node.down.w > 0 && node.down.h > 0) this.freeRectangles.push(node.down);
    if (node.right.w > 0 && node.right.h > 0) this.freeRectangles.push(node.right);
  }

  getOffcuts(minSize: number = 50): Offcut[] {
      // Retorna todos os retângulos livres que sobraram e são maiores que o tamanho mínimo
      return this.freeRectangles
        .filter(n => n.w >= minSize && n.h >= minSize)
        .map(n => ({ x: n.x, y: n.y, width: n.w, height: n.h }));
  }
}

/**
 * CÁLCULO REAL DE DESLOCAMENTOS DE SERRA (Geometric Line Counting)
 * Analisa as peças posicionadas para contar quantas linhas de corte contínuas existem.
 * Considera refilos, espessura da serra e cortes colineares.
 */
const calculateRealCuts = (parts: PlacedPart[], sheetW: number, sheetH: number, bladeThickness: number): number => {
    // 1. Extrair todas as linhas verticais e horizontais baseadas nas bordas das peças
    interface Segment { pos: number; min: number; max: number; }
    
    const verticals: Segment[] = [];
    const horizontals: Segment[] = [];

    parts.forEach(p => {
        // Bordas Verticais (X)
        verticals.push({ pos: p.x, min: p.y, max: p.y + p.height }); // Esquerda
        verticals.push({ pos: p.x + p.width, min: p.y, max: p.y + p.height }); // Direita
        
        // Bordas Horizontais (Y)
        horizontals.push({ pos: p.y, min: p.x, max: p.x + p.width }); // Topo
        horizontals.push({ pos: p.y + p.height, min: p.x, max: p.x + p.width }); // Fundo
    });

    // Função genérica para processar contagem de linhas em um eixo
    const countAxisCuts = (segments: Segment[], boardSize: number) => {
        // Ordena por Posição
        segments.sort((a, b) => a.pos - b.pos);

        // Agrupa linhas que estão dentro da tolerância da serra (Kerf Clustering)
        // Se a diferença for <= bladeThickness + epsilon, é o mesmo corte.
        const clusters: Segment[][] = [];
        let currentCluster: Segment[] = [];
        let lastPos = -9999;

        segments.forEach(seg => {
            if (seg.pos - lastPos <= (bladeThickness + 0.1)) {
                currentCluster.push(seg);
            } else {
                if (currentCluster.length > 0) clusters.push(currentCluster);
                currentCluster = [seg];
                lastPos = seg.pos;
            }
        });
        if (currentCluster.length > 0) clusters.push(currentCluster);

        let cutCount = 0;

        // Processa cada cluster (uma linha de corte potencial)
        for (const cluster of clusters) {
            // Pega a posição média do cluster para verificar bordas
            const avgPos = cluster.reduce((sum, s) => sum + s.pos, 0) / cluster.length;

            // IGNORA bordas brutas da chapa (0 e Total)
            // Se houver refilo (ex: pos = 10mm), ele passará aqui pois 10 > 1.
            if (avgPos <= 1 || avgPos >= boardSize - 1) continue;

            // Merge de Segmentos Colineares (Union of Intervals)
            // Ordena segmentos pelo início
            cluster.sort((a, b) => a.min - b.min);

            let mergedCount = 0;
            if (cluster.length > 0) {
                mergedCount = 1; // Pelo menos um corte se o cluster existe
                let currentMax = cluster[0].max;

                for (let i = 1; i < cluster.length; i++) {
                    const seg = cluster[i];
                    // Se o segmento atual começa depois que o anterior terminou (com tolerância), é um novo corte na mesma linha (gap)
                    // Ex: Corte interrompido? Na guilhotina geralmente corta tudo fora a fora se for possível.
                    // Porém, para fins de "quantas vezes a serra passa", se houver um buraco enorme, tecnicamente a serra pode não cortar o ar.
                    // Mas assumiremos que cortes colineares contam como 1 passada se estiverem "conectados" pelo layout otimizado.
                    
                    if (seg.min > currentMax + 0.5) {
                        // Gap detectado -> Novo corte (tecnicamente)
                        // Mas em otimizadores, um "Corte" geralmente atravessa tudo até encontrar outro corte perpendicular.
                        // Para simplificar e seguir a lógica "onde tem linha, é deslocamento":
                        // Se estão na mesma coordenada, contamos como 1 passada PRINCIPAL, a menos que sejam peças muito distantes.
                        // Vamos contar como +1 apenas se houver gap real.
                        // mergedCount++; 
                    }
                    currentMax = Math.max(currentMax, seg.max);
                }
            }
            cutCount += mergedCount;
        }
        return cutCount;
    };

    const vCuts = countAxisCuts(verticals, sheetW);
    const hCuts = countAxisCuts(horizontals, sheetH);

    return vCuts + hCuts;
};

// --- HELPER DE FITA DE BORDA ---
const getEdgeCode = (p: ProcessedPart): string => {
    const e = p.edges || { long1: 'none', long2: 'none', short1: 'none', short2: 'none' };
    const longCount = (e.long1 !== 'none' ? 1 : 0) + (e.long2 !== 'none' ? 1 : 0);
    const shortCount = (e.short1 !== 'none' ? 1 : 0) + (e.short2 !== 'none' ? 1 : 0);
    
    if (longCount === 2 && shortCount === 2) return "O";
    if (longCount === 2 && shortCount === 1) return "U";
    if (longCount === 1 && shortCount === 2) return "C";
    if (longCount === 1 && shortCount === 1) return "L";
    if (longCount === 2 && shortCount === 0) return "H";
    if (longCount === 1 && shortCount === 0) return "I";
    if (longCount === 0 && shortCount > 0) return shortCount === 1 ? "L" : "H";
    return "";
};

// --- SIMULAÇÃO DE UM CENÁRIO ---
const runSimulation = (
    allPiecesInput: any[], 
    config: OptimizationConfig, 
    sortStrategy: string,
    heuristic: 'BestArea' | 'BestShortSide' | 'BestLongSide',
    sheetWidth: number,
    sheetHeight: number,
    workW: number,
    workH: number
): OptimizationResult => {
    
    let pieces = JSON.parse(JSON.stringify(allPiecesInput));
    
    // ESTRATÉGIAS DE ORDENAÇÃO ROBUSTAS (Priorizando Grandes e Compridas)
    pieces.sort((a: any, b: any) => {
        if (sortStrategy === 'AREA_DESC') {
            const areaDiff = (b.w * b.h) - (a.w * a.h);
            // Desempate: Se área igual, a mais comprida (maior lado) ganha prioridade
            if (Math.abs(areaDiff) < 1) {
                return Math.max(b.w, b.h) - Math.max(a.w, a.h);
            }
            return areaDiff;
        }
        if (sortStrategy === 'LONG_SIDE_DESC') {
            const longDiff = Math.max(b.w, b.h) - Math.max(a.w, a.h);
            // Desempate: Se comprimento igual, a de maior área (mais larga) ganha
            if (Math.abs(longDiff) < 1) {
                return (b.w * b.h) - (a.w * a.h);
            }
            return longDiff;
        }
        // Fallback strategies (menos usadas agora)
        if (sortStrategy === 'SHORT_SIDE_DESC') return Math.min(b.w, b.h) - Math.min(a.w, a.h);
        if (sortStrategy === 'PERIMETER_DESC') return (b.w + b.h) - (a.w + a.h);
        
        return (b.w * b.h) - (a.w * a.h); // Default Area
    });

    const sheets: OptimizedSheet[] = [];
    let remainingPieces = [...pieces];
    let loopGuard = 0;
    const MAX_SHEETS_LIMIT = 300; 

    while (remainingPieces.length > 0 && loopGuard < MAX_SHEETS_LIMIT) {
        loopGuard++;
        // Passa a direção de corte para o Packer
        const packer = new GuillotinePacker(workW, workH, config.bladeThickness, config.cutDirection);
        const placedOnSheet: PlacedPart[] = [];
        const nextRound: any[] = [];

        for (const piece of remainingPieces) {
            let allowRotation = config.allowRotation;
            
            // NOVO: Se a peça tiver controle de veio, ela NÃO pode rotacionar 
            // e seu comprimento deve ficar na horizontal (packer w)
            if (piece.hasGrain) {
                allowRotation = false;
            } else if (!config.ignoreGrain) {
                if (piece.grain === '0') allowRotation = false; 
                if (piece.grain === '90') { 
                     const temp = piece.w; piece.w = piece.h; piece.h = temp;
                     allowRotation = false;
                }
            }

            const fit = packer.fit(piece.w, piece.h, allowRotation, heuristic);

            if (fit) {
                placedOnSheet.push({
                    uuid: Math.random().toString(36).substr(2, 9),
                    partId: piece.id,
                    displayId: piece.displayId,
                    // CORREÇÃO: As peças são posicionadas relativas à margem
                    x: fit.x + config.margin,
                    y: fit.y + config.margin,
                    width: fit.w,
                    height: fit.h,
                    rotated: fit.rotated,
                    name: piece.name,
                    group: piece.group,
                    edgeCode: piece.edgeCode,
                    edges: piece.original.edges,
                    sourceFile: piece.sourceFile,
                    notes: piece.original.notes,
                    originalDimensions: {
                        width: piece.original.dimensions.width,
                        height: piece.original.dimensions.height
                    }
                });
            } else {
                nextRound.push(piece);
            }
        }

        if (placedOnSheet.length > 0) {
            const usedArea = placedOnSheet.reduce((acc, p) => acc + (p.width * p.height), 0);
            
            // Cálculo do comprimento de corte estimado (Perímetro das peças como proxy de corte)
            const sheetCutLength = placedOnSheet.reduce((acc, p) => acc + (2 * (p.width + p.height)), 0);

            // CÁLCULO PRECISO DE CORTES (Real Saw Passes)
            const realCutsCount = calculateRealCuts(placedOnSheet, sheetWidth, sheetHeight, config.bladeThickness);

            const usefulOffcuts: Offcut[] = packer.getOffcuts(100).map(o => ({
                x: o.x + config.margin,
                y: o.y + config.margin,
                width: o.width,
                height: o.height
            })).sort((a,b) => (b.width * b.height) - (a.width * a.height));

            sheets.push({
                id: sheets.length + 1,
                width: sheetWidth,
                height: sheetHeight,
                parts: placedOnSheet,
                offcuts: usefulOffcuts,
                waste: [],
                wastePercentage: 1 - (usedArea / (sheetWidth * sheetHeight)),
                usedArea,
                cutLength: sheetCutLength,
                cutsCount: realCutsCount // Usa o valor calculado geometricamente
            });
            
            remainingPieces = nextRound;
        } else {
            break; 
        }
    }

    const totalUsedArea = sheets.reduce((acc, s) => acc + s.usedArea, 0);
    const totalCutLength = sheets.reduce((acc, s) => acc + s.cutLength, 0);
    const totalCutsCount = sheets.reduce((acc, s) => acc + (s.cutsCount || 0), 0);
    
    // Cálculo do Tempo: Área Total (m²) * Configuração de Minutos por m²
    // Area em mm² / 1.000.000 = Area em m²
    const timeFactor = config.minutesPerSqMeter || 5; // Default 5 min/m2 if missing
    const totalSqMeters = totalUsedArea / 1000000;
    const estimatedTime = totalSqMeters * timeFactor;

    return {
        sheets,
        unplacedParts: remainingPieces.map((p: any) => p.original),
        totalSheets: sheets.length,
        totalUsedArea,
        globalWastePercentage: (sheets.length * sheetWidth * sheetHeight) > 0 ? 1 - (totalUsedArea / (sheets.length * sheetWidth * sheetHeight)) : 0,
        totalCutLength,
        totalCutsCount,
        estimatedTime
    };
};

export const generateCuttingPlan = (
  parts: ProcessedPart[],
  config: OptimizationConfig
): OptimizationResult => {
  const { sheetWidth, sheetHeight, margin } = config;
  const workW = sheetWidth - (2 * margin);
  const workH = sheetHeight - (2 * margin);

  if (parts.length === 0) {
      return {
          sheets: [], unplacedParts: [], totalSheets: 0, totalUsedArea: 0,
          globalWastePercentage: 1, totalCutLength: 0, totalCutsCount: 0, estimatedTime: 0
      };
  }
  
  if (workW <= 0 || workH <= 0) throw new Error("Margens muito grandes para o tamanho da chapa.");

  let allPieces: any[] = [];
  const initialUnplaced: ProcessedPart[] = [];

  parts.forEach(p => {
    // APLICAR INVERSÃO DE DIMENSÕES SE SOLICITADO PELO USUÁRIO
    const pW = p.invertDimensions ? p.dimensions.height : p.dimensions.width;
    const pH = p.invertDimensions ? p.dimensions.width : p.dimensions.height;
    
    const fitsNormal = pW <= workW && pH <= workH;
    const fitsRotated = pH <= workW && pW <= workH;
    const canFit = config.allowRotation ? (fitsNormal || fitsRotated) : fitsNormal;

    if (!canFit) {
      initialUnplaced.push({ ...p, notes: [...p.notes, "Maior que a chapa (Considere margens)"] });
      return;
    }

    const code = getEdgeCode(p);
    for (let i = 0; i < (p.quantity || 1); i++) {
      allPieces.push({
        w: pW, h: pH, id: p.id, displayId: p.displayId, name: p.finalName,
        grain: p.grainDirection, hasGrain: p.hasGrain, group: p.groupCategory, 
        original: p, edgeCode: code, sourceFile: p.sourceFile
      });
    }
  });

  if (allPieces.length === 0) {
      return {
          sheets: [], unplacedParts: initialUnplaced, totalSheets: 0, totalUsedArea: 0,
          globalWastePercentage: 1, totalCutLength: 0, totalCutsCount: 0, estimatedTime: 0
      };
  }

  // ATUALIZADO: Cenários focados em priorizar peças grandes/compridas
  const scenarios = [
      { sort: 'AREA_DESC', heuristic: 'BestArea' },            // Prioridade 1: Área (Grandes primeiro)
      { sort: 'LONG_SIDE_DESC', heuristic: 'BestLongSide' },   // Prioridade 2: Compridas primeiro (Fit Long)
      { sort: 'AREA_DESC', heuristic: 'BestShortSide' },       // Variação: Grandes primeiro (Fit Short)
      { sort: 'LONG_SIDE_DESC', heuristic: 'BestShortSide' }   // Variação: Compridas primeiro (Fit Short)
  ] as const;

  let bestResult: OptimizationResult | null = null;

  for (const scen of scenarios) {
      // @ts-ignore
      const result = runSimulation(allPieces, config, scen.sort, scen.heuristic, sheetWidth, sheetHeight, workW, workH);
      
      if (!bestResult) {
          bestResult = result;
          continue;
      }
      
      const currentUnplaced = result.unplacedParts.length;
      const bestUnplaced = bestResult.unplacedParts.length;

      if (currentUnplaced < bestUnplaced) {
          bestResult = result;
      } else if (currentUnplaced === bestUnplaced) {
          // Se empatar em peças colocadas, preferimos menos chapas
          if (result.sheets.length < bestResult.sheets.length) {
              bestResult = result;
          } 
          // Se empatar em chapas, mantemos o primeiro (que é AREA_DESC/LONG_SIDE_DESC por definição)
          // para garantir que a preferência visual de "peças grandes primeiro" seja respeitada.
      }
  }

  if (bestResult) {
      bestResult.unplacedParts = [...initialUnplaced, ...bestResult.unplacedParts];
      return bestResult;
  }

  throw new Error("Falha desconhecida no motor de otimização.");
};
