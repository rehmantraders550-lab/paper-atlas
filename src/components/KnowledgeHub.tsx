import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Eye, Shield, Layers, Droplets, Box, LayoutTemplate, X, MousePointerClick, ArrowRight } from 'lucide-react';

const panelData = [
  {
    id: "1",
    title: "Apex-Vision™",
    subtitle: "BOPP / Ultra-Clear Film",
    icon: "eye",
    content: "High-gloss, ultra-clear film optimized for retail display and snack food packaging. Engineered to provide maximum visual fidelity while maintaining structural integrity on the shelf.",
    stats: [
      { label: "Clarity", value: "Ultra" },
      { label: "Application", value: "Retail" }
    ],
    cta_text: "View Specifications",
    cta_url: "#"
  },
  {
    id: "2",
    title: "Apex-Guard 80",
    subtitle: "HDPE/LLDPE Blend",
    icon: "shield",
    content: "A reinforced 80:20 industrial-grade blend delivering superior puncture and tear resistance. Designed for environments where failure is not an option.",
    stats: [
      { label: "Blend Ratio", value: "80:20" },
      { label: "Resistance", value: "Max" }
    ],
    cta_text: "Request Sample",
    cta_url: "#"
  },
  {
    id: "3",
    title: "Nova-Softseal™",
    subtitle: "CPP High-Integrity Film",
    icon: "layers",
    content: "Advanced heat-sealing film engineered specifically for high-speed automated packing lines. Ensures zero-defect sealing at maximum production velocities.",
    stats: [
      { label: "Seal Type", value: "Heat" },
      { label: "Speed", value: "High" }
    ],
    cta_text: "View Technical Data",
    cta_url: "#"
  },
  {
    id: "4",
    title: "Nova-Matte & Flex",
    subtitle: "EVA & LDPE Solutions",
    icon: "droplets",
    content: "Nova-Matte offers a premium velvet-touch finish for luxury retail. Nova-Flex delivers high-elasticity, impact-resistant protection for flexible general-purpose packaging.",
    stats: [
      { label: "Finish", value: "Velvet" },
      { label: "Elasticity", value: "High" }
    ],
    cta_text: "Explore Finishes",
    cta_url: "#"
  },
  {
    id: "5",
    title: "Apex Ultra",
    subtitle: "Heavy-Duty Architecture",
    icon: "box",
    content: "Maximum load-bearing structural solutions for industrial and bulk-weight applications. Parametrically designed to distribute weight efficiently.",
    stats: [
      { label: "Load", value: "Bulk" },
      { label: "Grade", value: "Industrial" }
    ],
    cta_text: "View Load Ratings",
    cta_url: "#"
  },
  {
    id: "6",
    title: "Corrugated Systems",
    subtitle: "Multi-Ply Engineering",
    icon: "layout-template",
    content: "Multi-ply Kraft and Art Card boxes engineered for a dual purpose: unforgiving shipping durability and pristine retail aesthetics upon unboxing.",
    stats: [
      { label: "Material", value: "Kraft" },
      { label: "Purpose", value: "Dual" }
    ],
    cta_text: "Discover Structures",
    cta_url: "#"
  }
];

const IconMap: Record<string, React.ElementType> = {
  eye: Eye,
  shield: Shield,
  layers: Layers,
  droplets: Droplets,
  box: Box,
  'layout-template': LayoutTemplate
};

export default function KnowledgeHub() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeData, setActiveData] = useState<typeof panelData[0] | null>(null);
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  // Refs for WebGL state to access inside event listeners
  const sceneState = useRef({
    state: 'idle', // idle, transitioning, open
    hoveredPanel: null as THREE.Mesh | null,
    activePanel: null as THREE.Mesh | null,
    targetRotX: 0,
    targetRotY: 0,
    mouse: new THREE.Vector2(),
    group: null as THREE.Group | null,
    panels: [] as THREE.Mesh[]
  });

  useEffect(() => {
    if (!containerRef.current) return;
    
    // --- THREE.JS SETUP ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const warmLight = new THREE.PointLight(0xF4EFE6, 4, 50);
    warmLight.position.set(5, 5, 5);
    scene.add(warmLight);

    const rimLight = new THREE.DirectionalLight(0xE3D9C6, 2);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);

    // --- GEOMETRY ---
    const group = new THREE.Group();
    sceneState.current.group = group;
    scene.add(group);

    const baseGeometry = new THREE.OctahedronGeometry(3.5, 0);
    const positions = baseGeometry.attributes.position.array;

    // Deckle Theme Material (Dark Green Matte)
    const panelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2A3B31, 
      metalness: 0.2,
      roughness: 0.7,
      clearcoat: 0.1,
      clearcoatRoughness: 0.4,
      side: THREE.DoubleSide,
      emissive: 0x000000,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const edgeMaterial = new THREE.LineBasicMaterial({ 
      color: 0xE3D9C6, 
      transparent: true, 
      opacity: 0.3,
      linewidth: 1
    });

    let dataIndex = 0;
    const panels: THREE.Mesh[] = [];

    for (let i = 0; i < positions.length; i += 9) {
      const geom = new THREE.BufferGeometry();
      
      const v1 = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
      const v2 = new THREE.Vector3(positions[i+3], positions[i+4], positions[i+5]);
      const v3 = new THREE.Vector3(positions[i+6], positions[i+7], positions[i+8]);
      
      const centroid = new THREE.Vector3().add(v1).add(v2).add(v3).divideScalar(3);

      const localV1 = v1.clone().sub(centroid);
      const localV2 = v2.clone().sub(centroid);
      const localV3 = v3.clone().sub(centroid);

      const vertices = new Float32Array([
        localV1.x, localV1.y, localV1.z,
        localV2.x, localV2.y, localV2.z,
        localV3.x, localV3.y, localV3.z,
      ]);

      geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geom.computeVertexNormals();

      const mesh = new THREE.Mesh(geom, panelMaterial.clone());
      mesh.position.copy(centroid);
      
      const edges = new THREE.EdgesGeometry(geom);
      const line = new THREE.LineSegments(edges, edgeMaterial);
      mesh.add(line);

      let hasData = false;
      let pData = null;
      if (dataIndex < panelData.length && centroid.z >= -1) { 
        pData = panelData[dataIndex];
        hasData = true;
        dataIndex++;
        
        const indicatorMat = new THREE.MeshBasicMaterial({color: 0xEDE5D3, transparent: true, opacity: 0.1});
        const indicatorMesh = new THREE.Mesh(geom, indicatorMat);
        indicatorMesh.scale.set(0.9, 0.9, 0.9);
        mesh.add(indicatorMesh);
      }

      mesh.userData = {
        originalPosition: centroid.clone(),
        normal: Array.from(geom.attributes.normal.array).slice(0,3),
        hasData,
        data: pData
      };

      panels.push(mesh);
      group.add(mesh);
    }
    
    sceneState.current.panels = panels;

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    let reqId: number;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const s = sceneState.current;

      if (s.state === 'idle') {
        group.rotation.y += 0.001;
        group.rotation.x += 0.0005;
        group.position.y = Math.sin(time) * 0.2;
        group.rotation.y += (s.targetRotY - group.rotation.y) * 0.05;
        group.rotation.x += (s.targetRotX - group.rotation.x) * 0.05;
      } else if (s.state === 'open' && s.activePanel) {
        s.activePanel.rotation.y = Math.sin(time * 2) * 0.05;
        s.activePanel.rotation.x = Math.cos(time * 1.5) * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    // --- EVENT LISTENERS ---
    const raycaster = new THREE.Raycaster();
    
    const handlePointerMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const s = sceneState.current;
      
      s.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      s.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (s.state === 'idle') {
        s.targetRotX = (e.clientY / window.innerHeight - 0.5) * 0.5;
        s.targetRotY = (e.clientX / window.innerWidth - 0.5) * 0.5;

        raycaster.setFromCamera(s.mouse, camera);
        const intersects = raycaster.intersectObjects(panels);

        if (s.hoveredPanel && (!intersects.length || intersects[0].object !== s.hoveredPanel)) {
          gsap.to((s.hoveredPanel.material as THREE.MeshPhysicalMaterial).emissive, {r: 0, g: 0, b: 0, duration: 0.3});
          gsap.to(s.hoveredPanel.scale, {x: 1, y: 1, z: 1, duration: 0.3});
          if (containerRef.current) containerRef.current.style.cursor = 'default';
          s.hoveredPanel = null;
        }

        if (intersects.length > 0) {
          const object = intersects[0].object as THREE.Mesh;
          if (object.userData.hasData && object !== s.hoveredPanel) {
            s.hoveredPanel = object;
            // Slight green emissive glow
            gsap.to((s.hoveredPanel.material as THREE.MeshPhysicalMaterial).emissive, {r: 0.1, g: 0.15, b: 0.12, duration: 0.3}); 
            gsap.to(s.hoveredPanel.scale, {x: 1.05, y: 1.05, z: 1.05, duration: 0.3, ease: "back.out(2)"});
            if (containerRef.current) containerRef.current.style.cursor = 'pointer';
          }
        }
      }
    };

    const handleClick = () => {
      const s = sceneState.current;
      if (s.state === 'idle' && s.hoveredPanel && s.hoveredPanel.userData.hasData) {
        openPanel(s.hoveredPanel);
      }
    };

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    containerRef.current.addEventListener('mousemove', handlePointerMove);
    containerRef.current.addEventListener('click', handleClick);

    // --- ANIMATION METHODS ---
    const openPanel = (panel: THREE.Mesh) => {
      const s = sceneState.current;
      s.state = 'transitioning';
      s.activePanel = panel;
      if (containerRef.current) containerRef.current.style.cursor = 'default';

      setIsIntroVisible(false);

      gsap.to(group.position, {
        x: -3, z: -2, duration: 1.5, ease: "power3.inOut"
      });
      gsap.to(group.rotation, {
        x: 0, y: 0, duration: 1.5, ease: "power3.inOut"
      });

      panels.forEach(p => {
        if (p !== panel) {
          gsap.to(p.material, {opacity: 0.2, transparent: true, duration: 1});
          ((p.children[0] as THREE.LineSegments).material as THREE.LineBasicMaterial).opacity = 0.1;
        }
      });

      const nx = panel.userData.normal[0];
      const ny = panel.userData.normal[1];
      const nz = panel.userData.normal[2];
      const popDistance = 2.5;

      gsap.to(panel.position, {
        x: panel.userData.originalPosition.x + (nx * popDistance),
        y: panel.userData.originalPosition.y + (ny * popDistance),
        z: panel.userData.originalPosition.z + (nz * popDistance) + 2,
        duration: 1.2,
        ease: "power3.out"
      });

      gsap.to(panel.rotation, {
        x: 0, y: 0, z: 0, duration: 1.2, ease: "power3.out"
      });
      
      gsap.to((panel.material as THREE.MeshPhysicalMaterial).emissive, {r: 0.05, g: 0.1, b: 0.08, duration: 0.5});

      // Prepare UI
      setActiveData(panel.userData.data);
      
      // Delay slightly so the UI slides in as the panel finishes moving
      setTimeout(() => {
        setIsBannerVisible(true);
        s.state = 'open';
      }, 800);
    };

    // Expose closePanel via a global custom event or simple ref pattern for the React button
    // Alternatively, just listen to a document event
    const handleCloseEvent = () => {
      const s = sceneState.current;
      if (s.state !== 'open' || !s.activePanel) return;
      s.state = 'transitioning';

      setIsBannerVisible(false);

      gsap.to(group.position, {
        x: 0, z: 0, duration: 1.2, ease: "power3.inOut"
      });

      panels.forEach(p => {
        gsap.to(p.material, {opacity: 1, duration: 1});
        ((p.children[0] as THREE.LineSegments).material as THREE.LineBasicMaterial).opacity = 0.4;
      });

      gsap.to(s.activePanel.position, {
        x: s.activePanel.userData.originalPosition.x,
        y: s.activePanel.userData.originalPosition.y,
        z: s.activePanel.userData.originalPosition.z,
        duration: 1.2,
        ease: "power3.inOut"
      });
      
      gsap.to((s.activePanel.material as THREE.MeshPhysicalMaterial).emissive, {r: 0, g: 0, b: 0, duration: 0.5});
      gsap.to(s.activePanel.scale, {x: 1, y: 1, z: 1, duration: 0.5});

      setTimeout(() => {
        setIsIntroVisible(true);
        s.activePanel = null;
        s.hoveredPanel = null;
        s.state = 'idle';
      }, 1000);
    };

    document.addEventListener('closeKnowledgePanel', handleCloseEvent);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handlePointerMove);
        containerRef.current.removeEventListener('click', handleClick);
        containerRef.current.removeChild(renderer.domElement);
      }
      document.removeEventListener('closeKnowledgePanel', handleCloseEvent);
      renderer.dispose();
      
      // Cleanup geometries and materials
      baseGeometry.dispose();
      panelMaterial.dispose();
      edgeMaterial.dispose();
      panels.forEach(p => {
        p.geometry.dispose();
      });
    };
  }, []);

  const triggerClose = () => {
    document.dispatchEvent(new CustomEvent('closeKnowledgePanel'));
  };

  return (
    <div className="relative w-full h-full bg-deckle-bg overflow-hidden">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0"></div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        
        {/* Intro UI */}
        <div 
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isIntroVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 text-center w-full">
          </div>

          <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 flex items-center gap-3 text-deckle-muted opacity-80">
            <MousePointerClick className="w-4 h-4" />
          </div>
        </div>

        {/* Info Banner */}
        <div 
          className={`absolute top-0 right-0 h-full w-full md:w-[600px] bg-deckle-surface/95 backdrop-blur-md border-l border-deckle-border pointer-events-auto transform transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col p-8 md:p-12 shadow-2xl ${isBannerVisible ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <button 
            onClick={triggerClose}
            className="absolute top-8 right-8 p-3 rounded-full border border-deckle-border text-deckle-text hover:bg-deckle-border hover:rotate-90 transition-all duration-300"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>

          {activeData && (
            <div className={`flex-grow overflow-y-auto mt-16 pr-4 transition-opacity duration-500 delay-200 ${isBannerVisible ? 'opacity-100' : 'opacity-0'}`}>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="w-14 h-14 rounded-full bg-deckle-dark/10 border border-deckle-dark/20 text-deckle-dark flex items-center justify-center flex-shrink-0">
                  {React.createElement(IconMap[activeData.icon] || Box, { className: "w-6 h-6" })}
                </div>
                <div>
                  <h3 className="font-serif text-3xl font-semibold text-deckle-dark tracking-tight">{activeData.title}</h3>
                  <p className="text-xs font-medium text-deckle-muted tracking-[0.15em] uppercase mt-2">{activeData.subtitle}</p>
                </div>
              </div>

              <p className="text-deckle-text leading-relaxed text-sm">
                {activeData.content}
              </p>

              <div className="grid grid-cols-2 gap-8 my-10 py-8 border-y border-deckle-border">
                {activeData.stats.map((stat, idx) => (
                  <div key={idx}>
                    <div className="font-serif text-3xl text-deckle-dark mb-1">{stat.value}</div>
                    <div className="text-[10px] font-medium text-deckle-muted uppercase tracking-[0.15em]">{stat.label}</div>
                  </div>
                ))}
              </div>

              <a 
                href={activeData.cta_url}
                className="inline-flex items-center justify-center gap-3 bg-deckle-dark text-white font-medium py-4 px-8 hover:bg-deckle-dark/90 transition-colors text-xs tracking-widest uppercase group w-full md:w-auto rounded-lg"
              >
                <span>{activeData.cta_text}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
