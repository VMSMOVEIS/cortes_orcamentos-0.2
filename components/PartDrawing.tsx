
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ProcessedPart } from '../types';

interface PartDrawingProps {
  part: ProcessedPart;
}

export const PartDrawing: React.FC<PartDrawingProps> = ({ part }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = 120;
    const height = 80;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // 1. Setup Camera (Orthographic for Technical View)
    // Calculate aspect ratio to fit the part nicely
    const maxDim = Math.max(part.dimensions.width, part.dimensions.height);
    const zoom = 1.2; // Padding
    const camSize = maxDim * zoom;
    
    const camera = new THREE.OrthographicCamera(
      camSize / -2, camSize / 2,
      camSize / 2, camSize / -2,
      1, 1000
    );

    // Position camera based on the largest face (Top Down usually works for flat parts)
    // We assume the part is imported 'flat'. If not, we might view the edge.
    // For simplicity in this heuristic engine, we look from Z+ (Top).
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // 2. Create Geometry
    const geometry = new THREE.BoxGeometry(
        part.dimensions.width,
        part.dimensions.height,
        part.dimensions.thickness
    );

    // 3. Technical Material (Hidden Line removal style)
    // White fill
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    }));
    
    // Black edges (Shows outline AND internal holes if geometry allows)
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 }));

    // Center geometry
    mesh.geometry.center();
    line.geometry.center();

    scene.add(mesh);
    scene.add(line);

    // If the original raw part has complex geometry (holes), we would theoretically need to parse 
    // the original mesh geometry here instead of a BoxGeometry.
    // Since we are using 'ProcessedPart' which currently simplified to Box, we add a visual "cross" 
    // if it notes "holes" or just render the box.
    // *Improvement*: To show holes from the file, we would need to pass the original BufferGeometry.
    // For now, this renders the bounding box wireframe which helps identify proportions.

    renderer.render(scene, camera);

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [part]);

  return (
    <div ref={mountRef} className="border border-slate-200 inline-block bg-white" title="Vista Técnica Automática" />
  );
};
