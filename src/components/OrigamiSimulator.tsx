import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrigamiEngine } from '../engine/OrigamiEngine';
import patternData from '../data/crease-pattern.json';
import { MousePointer2, RotateCcw, Box, Palette } from 'lucide-react';

const createPaperTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#EDE5D3';
    context.fillRect(0, 0, 512, 512);
    // Add procedural fibers and noise
    for (let i = 0; i < 40000; i++) {
      context.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)';
      context.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 2 + 1, Math.random() * 2 + 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

export default function OrigamiSimulator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [foldAngle, setFoldAngle] = useState(0);
  const [showWireframe, setShowWireframe] = useState(true);
  const [useTexture, setUseTexture] = useState(false);

  // Refs to hold our engine and scene objects for the slider to interact with
  const engineRef = useRef<OrigamiEngine | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const lineRef = useRef<THREE.LineSegments | null>(null);
  const paperTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const sceneState = useRef({ targetRotX: 0, targetRotY: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Viewport Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF4EFE6); 

    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.set(0, -6, 5); 
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    containerRef.current.appendChild(renderer.domElement);

    // Lighting 
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, -10, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xE3D9C6, 0.5);
    fillLight.position.set(-5, 5, 5);
    scene.add(fillLight);

    // Origami Engine Initialization
    // We cast patternData to any because TypeScript might complain about the exact shape of kinematicTree from JSON
    const engine = new OrigamiEngine(patternData as any);
    engineRef.current = engine;
    
    // Generate texture once on mount
    paperTextureRef.current = createPaperTexture();

    const mesh = engine.getMesh();
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.material = new THREE.MeshStandardMaterial({
      color: 0xEDE5D3,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
      flatShading: true
    });
    meshRef.current = mesh;
    scene.add(mesh);

    // Wireframe overlay 
    const wireframe = new THREE.WireframeGeometry(mesh.geometry);
    const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0x2A3B31, opacity: 0.6, transparent: true }));
    lineRef.current = line;
    mesh.add(line);

    // Render Loop
    let reqId: number;
    function animate() {
      reqId = requestAnimationFrame(animate);
      
      if (meshRef.current) {
        meshRef.current.rotation.x += (sceneState.current.targetRotX - meshRef.current.rotation.x) * 0.05;
        meshRef.current.rotation.y += (sceneState.current.targetRotY - meshRef.current.rotation.y) * 0.05;
      }
      
      renderer.render(scene, camera);
    }
    animate();

    const handlePointerMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      sceneState.current.targetRotX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.5;
      sceneState.current.targetRotY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
    };

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    containerRef.current.addEventListener('mousemove', handlePointerMove);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handlePointerMove);
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      wireframe.dispose();
      (line.material as THREE.Material).dispose();
      paperTextureRef.current?.dispose();
    };
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const angle = parseFloat(e.target.value);
    setFoldAngle(angle);

    if (engineRef.current && meshRef.current && lineRef.current) {
      engineRef.current.updateGeometry(angle);
      
      lineRef.current.geometry.dispose();
      lineRef.current.geometry = new THREE.WireframeGeometry(meshRef.current.geometry);
    }
  };

  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.visible = showWireframe;
    }
  }, [showWireframe]);

  useEffect(() => {
    if (meshRef.current && paperTextureRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.map = useTexture ? paperTextureRef.current : null;
      mat.color.setHex(useTexture ? 0xffffff : 0xEDE5D3); // Reset base color if using texture
      mat.needsUpdate = true;
    }
  }, [useTexture]);

  const handleReset = () => {
    setFoldAngle(0);
    if (engineRef.current && meshRef.current && lineRef.current) {
      engineRef.current.updateGeometry(0);
      lineRef.current.geometry.dispose();
      lineRef.current.geometry = new THREE.WireframeGeometry(meshRef.current.geometry);
    }
  };

  return (
    <div className="relative w-full h-full bg-deckle-bg">
      <div ref={containerRef} className="absolute inset-0 z-0"></div>
      
      <div className="absolute inset-0 z-10 pointer-events-none p-8 md:p-16 flex flex-col justify-between">
        
        <div className="max-w-md pointer-events-auto">
          <h2 className="font-serif text-4xl text-deckle-dark tracking-tight mb-2">Origami Kinetics</h2>
          <p className="text-deckle-muted text-sm leading-relaxed mb-8">
            Experience the structural memory of our fibers. Scrub the timeline below to examine edge deformation and surface tension during a complex multi-point fold.
          </p>
          
          <div className="bg-white/50 backdrop-blur-md border border-deckle-border p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <label className="text-xs font-medium uppercase tracking-[0.15em] text-deckle-dark">
                Fold Angle
              </label>
              <span className="font-serif text-2xl text-deckle-dark">{Math.round(foldAngle)}°</span>
            </div>
            
            <input
              type="range"
              min="0"
              max="180"
              step="1"
              value={foldAngle}
              onChange={handleSliderChange}
              className="w-full h-1 bg-deckle-border rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-deckle-dark [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
            />

            <div className="flex gap-2 mt-8 pt-6 border-t border-deckle-border/50">
              <button
                onClick={handleReset}
                className="flex flex-col items-center justify-center gap-1.5 flex-1 py-3 px-2 rounded-lg bg-deckle-border/30 hover:bg-deckle-border/60 text-deckle-dark text-[10px] font-medium uppercase tracking-widest transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={() => setShowWireframe(!showWireframe)}
                className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-3 px-2 rounded-lg text-[10px] font-medium uppercase tracking-widest transition-colors border ${showWireframe ? 'bg-deckle-dark text-white border-deckle-dark' : 'bg-transparent text-deckle-dark border-deckle-border hover:bg-deckle-border/30'}`}
              >
                <Box className="w-4 h-4" />
                {showWireframe ? 'Lines On' : 'Lines Off'}
              </button>
              <button
                onClick={() => setUseTexture(!useTexture)}
                className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-3 px-2 rounded-lg text-[10px] font-medium uppercase tracking-widest transition-colors border ${useTexture ? 'bg-deckle-dark text-white border-deckle-dark' : 'bg-transparent text-deckle-dark border-deckle-border hover:bg-deckle-border/30'}`}
              >
                <Palette className="w-4 h-4" />
                {useTexture ? 'Texture On' : 'Texture Off'}
              </button>
            </div>
          </div>
        </div>

        <div className="self-end flex items-center gap-2 text-deckle-muted opacity-60">
          <MousePointer2 className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-[0.1em]">Interact with canvas</span>
        </div>

      </div>
    </div>
  );
}
