
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ProcessedPart } from '../types';

interface Exploded3DViewProps {
  parts: ProcessedPart[];
  explodeFactor: number;
}

export interface Exploded3DRef {
    captureSnapshot: () => string;
    autoCaptureStep: (activeManualIds: number[]) => string;
}

export const Exploded3DView = forwardRef<Exploded3DRef, Exploded3DViewProps>(({ parts, explodeFactor }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  // Store mapping of Manual ID -> Mesh Data
  const partsMeshesRef = useRef<{ manualId: number; mesh: THREE.Mesh; lines: THREE.LineSegments; originalPos: THREE.Vector3; centerOffset: THREE.Vector3 }[]>([]);

  // Calculate center of the whole assembly
  const getAssemblyCenter = (parts: ProcessedPart[]) => {
      const min = new THREE.Vector3(Infinity, Infinity, Infinity);
      const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

      if (parts.length === 0) return new THREE.Vector3(0,0,0);

      parts.forEach(p => {
          // Check all instances if grouped
          const instances = p.originalData && p.originalData.length > 0 
            ? p.originalData 
            : [{ position: p.position }];

          instances.forEach(inst => {
              min.x = Math.min(min.x, inst.position.x);
              min.y = Math.min(min.y, inst.position.y);
              min.z = Math.min(min.z, inst.position.z);
              max.x = Math.max(max.x, inst.position.x);
              max.y = Math.max(max.y, inst.position.y);
              max.z = Math.max(max.z, inst.position.z);
          });
      });

      return new THREE.Vector3(
          (min.x + max.x) / 2,
          (min.y + max.y) / 2,
          (min.z + max.z) / 2
      );
  };

  useImperativeHandle(ref, () => ({
    captureSnapshot: () => {
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
            return rendererRef.current.domElement.toDataURL('image/png');
        }
        return '';
    },
    autoCaptureStep: (activeManualIds: number[]) => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !controlsRef.current) return '';

        const originalCameraPos = cameraRef.current.position.clone();
        const originalTarget = controlsRef.current.target.clone();

        // 1. ISOLATE VIEW
        // Active parts = Solid Color (Blueish)
        // Inactive parts = Ghost (Transparent Gray)
        const activeBox = new THREE.Box3();
        let hasActive = false;

        partsMeshesRef.current.forEach(item => {
            const isActive = activeManualIds.includes(item.manualId);
            
            if (isActive) {
                // Highlight Material
                (item.mesh.material as THREE.MeshBasicMaterial).color.setHex(0x3b82f6); // Blue-500
                (item.mesh.material as THREE.MeshBasicMaterial).transparent = false;
                (item.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
                (item.lines.material as THREE.LineBasicMaterial).color.setHex(0x000000);
                (item.lines.material as THREE.LineBasicMaterial).opacity = 1;
                (item.lines.material as THREE.LineBasicMaterial).transparent = false;
                
                // Expand bounding box for camera focus
                const tempBox = new THREE.Box3().setFromObject(item.mesh);
                activeBox.union(tempBox);
                hasActive = true;
            } else {
                // Ghost Material
                (item.mesh.material as THREE.MeshBasicMaterial).color.setHex(0xe2e8f0); // Slate-200
                (item.mesh.material as THREE.MeshBasicMaterial).transparent = true;
                (item.mesh.material as THREE.MeshBasicMaterial).opacity = 0.1; // Faint ghost
                (item.lines.material as THREE.LineBasicMaterial).color.setHex(0x94a3b8);
                (item.lines.material as THREE.LineBasicMaterial).transparent = true;
                (item.lines.material as THREE.LineBasicMaterial).opacity = 0.2;
            }
        });

        // 2. FOCUS CAMERA
        if (hasActive) {
            const center = new THREE.Vector3();
            activeBox.getCenter(center);
            const size = new THREE.Vector3();
            activeBox.getSize(size);
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const dist = maxDim * 2.5; // Zoom factor

            // Isometric angle relative to selection center
            const newPos = center.clone().add(new THREE.Vector3(dist, dist * 0.8, dist));
            
            cameraRef.current.position.copy(newPos);
            cameraRef.current.lookAt(center);
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
        }

        // 3. RENDER
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        const dataUrl = rendererRef.current.domElement.toDataURL('image/png');

        // 4. RESTORE STATE (Reset materials and camera)
        partsMeshesRef.current.forEach(item => {
            (item.mesh.material as THREE.MeshBasicMaterial).color.setHex(0xffffff);
            (item.mesh.material as THREE.MeshBasicMaterial).transparent = false;
            (item.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
            (item.lines.material as THREE.LineBasicMaterial).color.setHex(0x000000);
            (item.lines.material as THREE.LineBasicMaterial).transparent = false;
            (item.lines.material as THREE.LineBasicMaterial).opacity = 1;
        });
        
        // Restore camera
        cameraRef.current.position.copy(originalCameraPos);
        controlsRef.current.target.copy(originalTarget);
        controlsRef.current.update();
        rendererRef.current.render(sceneRef.current, cameraRef.current);

        return dataUrl;
    }
  }));

  useEffect(() => {
    if (!mountRef.current) return;

    // Setup
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // White background like the PDF
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(1000, 1000, 2000); // Iso view
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        preserveDrawingBuffer: true // Required for screenshots
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Lighting (Simple flat lighting for technical look)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Create Geometry
    const assemblyCenter = getAssemblyCenter(parts);
    partsMeshesRef.current = [];

    parts.forEach((part) => {
        // Handle Grouped Parts: Render all original instances
        const instances = part.originalData && part.originalData.length > 0 
            ? part.originalData 
            : [{ id: part.id, position: part.position }];

        // Re-use geometry and material for performance
        const geometry = new THREE.BoxGeometry(
            part.dimensions.width,
            part.dimensions.height,
            part.dimensions.thickness
        );
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            polygonOffset: true,
            polygonOffsetFactor: 1, 
            polygonOffsetUnits: 1
        });
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });

        instances.forEach(inst => {
            const mesh = new THREE.Mesh(geometry, material.clone()); // Clone to allow individual highlighting if needed
            mesh.position.set(inst.position.x, inst.position.y, inst.position.z);
            
            const line = new THREE.LineSegments(edges, lineMaterial.clone());
            line.position.copy(mesh.position);
            
            scene.add(mesh);
            scene.add(line);

            // Store for animation
            const centerOffset = new THREE.Vector3().subVectors(mesh.position, assemblyCenter).normalize();

            partsMeshesRef.current.push({
                manualId: part.manualId || -1, // Associated with the GROUP ID
                mesh,
                lines: line,
                originalPos: mesh.position.clone(),
                centerOffset
            });
        });
    });

    // Center Camera
    controls.target.copy(assemblyCenter);
    camera.position.set(assemblyCenter.x + 1500, assemblyCenter.y + 1000, assemblyCenter.z + 1500);
    controls.update();

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [parts]); 

  // Handle Explosion Effect
  useEffect(() => {
    partsMeshesRef.current.forEach(item => {
        // Move along the vector away from center
        const displacement = item.centerOffset.clone().multiplyScalar(explodeFactor * 5); // 5 is scale multiplier
        const newPos = item.originalPos.clone().add(displacement);
        
        item.mesh.position.copy(newPos);
        item.lines.position.copy(newPos);
    });
  }, [explodeFactor]);

  return (
    <div ref={mountRef} className="w-full h-full cursor-move" />
  );
});

Exploded3DView.displayName = 'Exploded3DView';
