
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// @ts-ignore
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
// @ts-ignore
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
// @ts-ignore
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';
import { RawPart, EdgeBanding, EdgeType } from '../types';

const calculateDimensions = (box: THREE.Box3, scale: THREE.Vector3) => {
  const size = new THREE.Vector3();
  box.getSize(size);
  // Usar valor absoluto para escala, evitando problemas com componentes espelhados/negativos
  size.x = Math.abs(size.x * scale.x);
  size.y = Math.abs(size.y * scale.y);
  size.z = Math.abs(size.z * scale.z);

  const dims = [
    { axis: 'x', val: size.x },
    { axis: 'y', val: size.y },
    { axis: 'z', val: size.z }
  ].sort((a, b) => a.val - b.val);
  
  let unitMultiplier = 1;
  // Se a maior dimensão for muito pequena (ex: < 5mm em escala real), provavelmente está em metros
  if (dims[2].val < 5) unitMultiplier = 1000;

  return {
    thickness: Math.round(dims[0].val * unitMultiplier),
    width: Math.round(dims[1].val * unitMultiplier),
    height: Math.round(dims[2].val * unitMultiplier),
    volume: (dims[0].val * dims[1].val * dims[2].val) * Math.pow(unitMultiplier, 3),
    unitMultiplier,
    isStandardBox: true
  };
};

const cleanName = (name: string): string => {
    if (!name) return '';
    return name.replace(/^(Mesh|Object|Model|Group|Component|Geometry|Node|Instance)\d*[\s_]*/i, '')
               .replace(/[\s_]*(Model|Scene|Primitive|Shape|Part|Material)$/i, '')
               .replace(/[._]\d{3,}$/, '') 
               .replace(/\[.*?\]/g, '') 
               .replace(/_/g, ' ')
               .trim();
};

const findMeaningfulName = (mesh: THREE.Object3D): string => {
    let current: THREE.Object3D | null = mesh;
    while (current && current.type !== 'Scene') {
        const candidate = cleanName(current.name);
        if (candidate && candidate.length >= 2 && !/^\d+$/.test(candidate)) return candidate;
        current = current.parent;
    }
    return '';
};

/**
 * Gera um contorno SVG limpo (sem triangulação) usando EdgesGeometry.
 */
const generatePartContourSVG = (mesh: THREE.Mesh, unitMultiplier: number): string => {
    if (!mesh.geometry) return '';
    const geo = mesh.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();

    const localSize = new THREE.Vector3();
    geo.boundingBox!.getSize(localSize);

    const sizes = [
        { axis: 0, val: localSize.x },
        { axis: 1, val: localSize.y },
        { axis: 2, val: localSize.z }
    ].sort((a,b) => a.val - b.val);

    const widthAxisIdx = sizes[1].axis;
    const heightAxisIdx = sizes[2].axis;

    const edgesGeo = new THREE.EdgesGeometry(geo, 15);
    const posAttr = edgesGeo.attributes.position;
    const paths: string[] = [];

    const get2D = (v: THREE.Vector3) => {
        let x = 0, y = 0;
        if (widthAxisIdx === 0) x = v.x - geo.boundingBox!.min.x;
        else if (widthAxisIdx === 1) x = v.y - geo.boundingBox!.min.y;
        else x = v.z - geo.boundingBox!.min.z;

        if (heightAxisIdx === 0) y = v.x - geo.boundingBox!.min.x;
        else if (heightAxisIdx === 1) y = v.y - geo.boundingBox!.min.y;
        else y = v.z - geo.boundingBox!.min.z;

        return { x: x * unitMultiplier, y: y * unitMultiplier };
    };

    const vA = new THREE.Vector3(), vB = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i += 2) {
        vA.fromBufferAttribute(posAttr, i);
        vB.fromBufferAttribute(posAttr, i + 1);

        const p1 = get2D(vA), p2 = get2D(vB);
        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        if (dist > 0.5) {
            paths.push(`M${p1.x.toFixed(1)},${p1.y.toFixed(1)}L${p2.x.toFixed(1)},${p2.y.toFixed(1)}`);
        }
    }
    
    edgesGeo.dispose();
    return paths.join('');
};

/**
 * Detecta Fita de Borda com precisão profissional.
 * Suporta detecção por contato (Obstrução) E por material diferente na face (2ª Cor).
 * Retorna também o NOME da cor detectada na borda.
 */
const detectEdgeBanding = (meshes: THREE.Mesh[]): Map<string, { banding: EdgeBanding, detectedColor?: string, mainMaterialName?: string }> => {
    const results = new Map<string, { banding: EdgeBanding, detectedColor?: string, mainMaterialName?: string }>();
    
    // Preparar dados para otimização (BoundingBox World + Matrizes)
    const worldObstacles = meshes.map(m => {
        m.updateMatrixWorld(true);
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        const box = new THREE.Box3().copy(m.geometry.boundingBox!).applyMatrix4(m.matrixWorld);
        const invMatrix = m.matrixWorld.clone().invert();
        
        return { 
            uuid: m.uuid, 
            worldBox: box, 
            mesh: m,
            invMatrix,
            localBox: m.geometry.boundingBox! 
        };
    });

    // Determinar se o modelo está em metros ou milímetros baseado no tamanho das peças
    let maxPartSize = 0;
    worldObstacles.forEach(o => {
        const size = new THREE.Vector3();
        o.worldBox.getSize(size);
        maxPartSize = Math.max(maxPartSize, size.x, size.y, size.z);
    });
    
    // Se a maior peça tem menos de 15 unidades, provavelmente está em metros (ex: 2.7m)
    // Se tem mais, provavelmente está em mm (ex: 2700mm)
    const isMeters = maxPartSize < 15;
    const CONTACT_TOLERANCE = isMeters ? 0.0005 : 0.5; // 0.5mm de tolerância

    meshes.forEach(mesh => {
        if (!mesh.visible) {
            results.set(mesh.uuid, { banding: { long1: 'none', long2: 'none', short1: 'none', short2: 'none' } });
            return;
        }

        const localBox = mesh.geometry.boundingBox!;
        const center = new THREE.Vector3();
        localBox.getCenter(center); 

        const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scale = new THREE.Vector3();
        mesh.matrixWorld.decompose(pos, quat, scale);

        // Ordena dimensões (usando Math.abs para escala, evitando problemas com espelhamento)
        const dims = [
            { axis: new THREE.Vector3(1,0,0), val: (localBox.max.x - localBox.min.x) * Math.abs(scale.x), id: 'x' },
            { axis: new THREE.Vector3(0,1,0), val: (localBox.max.y - localBox.min.y) * Math.abs(scale.y), id: 'y' },
            { axis: new THREE.Vector3(0,0,1), val: (localBox.max.z - localBox.min.z) * Math.abs(scale.z), id: 'z' }
        ].sort((a,b) => a.val - b.val);

        const thicknessAxis = dims[0];
        const widthAxis = dims[1];   // Eixo Médio (Short Edges boundaries)
        const lengthAxis = dims[2];  // Eixo Maior (Long Edges boundaries)

        const thicknessMm = isMeters ? thicknessAxis.val * 1000 : thicknessAxis.val;
        
        // --- DETECÇÃO DE BOLEADO (MAIS AGRESSIVA) ---
        let meaningfulName = findMeaningfulName(mesh).toLowerCase();
        if (!meaningfulName) meaningfulName = mesh.name.toLowerCase();

        const keywords = ['bolead', 'abalu', 'arredond', 'curv'];
        const isBoleado = keywords.some(k => meaningfulName.includes(k));

        const defaultStyle = (thicknessMm > 15.5 || isBoleado) ? 'dashed' : 'solid';

        // --- LÓGICA DE MATERIAIS DE FACE ---
        const faceMaterials: Record<string, boolean> = { long1: false, long2: false, short1: false, short2: false };
        let detectedColorName: string | undefined = undefined;
        let mainMaterialName: string | undefined = undefined;

        if (Array.isArray(mesh.material)) {
            const materials = mesh.material as THREE.Material[];
            const mapAxisToIndices = (axisId: string) => {
                if (axisId === 'x') return [0, 1];
                if (axisId === 'y') return [2, 3];
                return [4, 5];
            };
            const lidIndices = mapAxisToIndices(thicknessAxis.id);
            const lidMatIndex = lidIndices[0] < materials.length ? lidIndices[0] : 0;
            const lidMat = materials[lidMatIndex];
            if (lidMat) mainMaterialName = lidMat.name;
        } else {
             mainMaterialName = (mesh.material as THREE.Material).name;
        }

        // --- DETECÇÃO DE CONTATO ---
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);

        const isFaceCovered = (localNormal: THREE.Vector3, axisFullSpan: number): boolean => {
            const worldFaceCenter = new THREE.Vector3().copy(center).applyMatrix4(mesh.matrixWorld);
            const worldNormal = localNormal.clone().applyMatrix3(normalMatrix).normalize();
            
            // Ponto de sensor ligeiramente fora da face (0.25mm - 0.5mm)
            const sensorPos = worldFaceCenter.clone().add(worldNormal.clone().multiplyScalar((axisFullSpan / 2) + (CONTACT_TOLERANCE * 0.75)));

            for (const obs of worldObstacles) {
                if (obs.uuid === mesh.uuid) continue;
                
                // Checagem rápida por Bounding Box expandida
                if (!obs.worldBox.containsPoint(sensorPos)) {
                    const expandedBox = obs.worldBox.clone().expandByScalar(CONTACT_TOLERANCE * 2);
                    if (!expandedBox.containsPoint(sensorPos)) continue;
                }
                
                const localSensorPoint = sensorPos.clone().applyMatrix4(obs.invMatrix);
                const obsScale = new THREE.Vector3();
                obs.mesh.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), obsScale);
                const maxS = Math.max(Math.abs(obsScale.x), Math.abs(obsScale.y), Math.abs(obsScale.z));
                const localTol = CONTACT_TOLERANCE / (maxS || 1);
                
                if (obs.localBox.clone().expandByScalar(localTol).containsPoint(localSensorPoint)) return true;
            }
            return false;
        };
        
        const getLocalAxis = (id: string) => {
            if (id === 'x') return new THREE.Vector3(1, 0, 0);
            if (id === 'y') return new THREE.Vector3(0, 1, 0);
            return new THREE.Vector3(0, 0, 1);
        };

        const widthNormal = getLocalAxis(widthAxis.id);
        const lengthNormal = getLocalAxis(lengthAxis.id);

        const long1_Covered = isFaceCovered(widthNormal.clone().negate(), widthAxis.val);
        const long2_Covered = isFaceCovered(widthNormal, widthAxis.val);
        const short1_Covered = isFaceCovered(lengthNormal, lengthAxis.val);
        const short2_Covered = isFaceCovered(lengthNormal.clone().negate(), lengthAxis.val);

        const resolveEdge = (isCovered: boolean, isDistinctColor: boolean): EdgeType => {
            if (isCovered) return 'none';
            if (isDistinctColor) return 'colored';
            return defaultStyle;
        };

        results.set(mesh.uuid, {
            banding: {
                long1: resolveEdge(long1_Covered, faceMaterials.long1),
                long2: resolveEdge(long2_Covered, faceMaterials.long2),
                short1: resolveEdge(short1_Covered, faceMaterials.short1),
                short2: resolveEdge(short2_Covered, faceMaterials.short2)
            },
            detectedColor: detectedColorName,
            mainMaterialName: mainMaterialName
        });
    });

    return results;
};

export const parse3DFile = async (file: File): Promise<RawPart[]> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const extension = file.name.split('.').pop()?.toLowerCase();

    const onLoad = (object: THREE.Object3D) => {
        try {
            const parts: RawPart[] = [];
            const meshes: THREE.Mesh[] = [];
            object.updateMatrixWorld(true);
            object.traverse((child) => {
                if ((child as THREE.Mesh).isMesh && child.visible) meshes.push(child as THREE.Mesh);
            });

            const bandingResult = detectEdgeBanding(meshes);
            meshes.forEach((mesh, i) => {
                const box = mesh.geometry.boundingBox!.clone();
                const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scale = new THREE.Vector3();
                mesh.matrixWorld.decompose(pos, quat, scale);
                
                if (scale.x === 0 || scale.y === 0 || scale.z === 0) return;

                const dims = calculateDimensions(box, scale);
                if (dims.width < 5 || dims.height < 5) return;

                const edgeInfo = bandingResult.get(mesh.uuid)!;

                // Fallback for material name if not detected by face analysis
                const fallbackMatName = !Array.isArray(mesh.material) ? (mesh.material as any).name : 'Padrão';

                parts.push({
                    id: mesh.uuid,
                    originalName: findMeaningfulName(mesh) || `Peça ${i+1}`,
                    materialName: edgeInfo.mainMaterialName || fallbackMatName,
                    dimensions: { width: dims.width, height: dims.height, thickness: dims.thickness },
                    position: { x: pos.x, y: pos.y, z: pos.z },
                    volume: dims.volume,
                    edges: edgeInfo.banding,
                    detectedEdgeColor: edgeInfo.detectedColor, // Pass detected color string
                    svgPath: generatePartContourSVG(mesh, dims.unitMultiplier)
                });
            });
            URL.revokeObjectURL(url);
            resolve(parts);
        } catch (e) { reject(e); }
    };

    const loader = extension === 'obj' ? new OBJLoader() : 
                   extension === 'fbx' ? new FBXLoader() : 
                   extension === 'dae' ? new ColladaLoader() : new GLTFLoader();

    if (extension === 'dae') loader.load(url, (c: any) => onLoad(c.scene), undefined, reject);
    else if (extension === 'glb' || extension === 'gltf') loader.load(url, (g: any) => onLoad(g.scene), undefined, reject);
    else loader.load(url, onLoad, undefined, reject);
  });
};
