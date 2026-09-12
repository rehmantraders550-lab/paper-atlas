import React, { useState, useMemo } from 'react';
import { materialsData } from './data';
import { MATERIAL_DATABASE } from './data/essaMaterials';
import { Material } from './types';
import { 
  ChevronDown, 
  X,
  Shield, 
  Layers, 
  Award, 
  Leaf, 
  ChevronRight, 
  Info, 
  Scale, 
  Printer, 
  Sparkles, 
  Check, 
  Search, 
  RotateCcw,
  Zap,
  Bot,
  Loader2
} from 'lucide-react';
import KnowledgeHub from './components/KnowledgeHub';
import OrigamiSimulator from './components/OrigamiSimulator';

// Simulated High-Material Realism Textures via purely CSS backgrounds
function getTextureStyle(type: string) {
  switch (type) {
    case "sbs":
      return {
        backgroundImage: "linear-gradient(135deg, #fbfbf9 0%, #edeae4 100%)",
        boxShadow: "inset 0 0 10px rgba(0,0,0,0.02)"
      };
    case "kraft":
      return {
        backgroundImage: "radial-gradient(circle, #dfc0a5 0%, #b8916c 100%)",
        boxShadow: "inset 0 0 15px rgba(0,0,0,0.15)"
      };
    case "duplex":
      return {
        backgroundImage: "linear-gradient(180deg, #fafafa 0%, #e2e2e2 60%, #b0b0b0 100%)",
        boxShadow: "inset 0 0 12px rgba(0,0,0,0.1)"
      };
    case "eflute":
      return {
        backgroundImage: "repeating-linear-gradient(90deg, #d3b38c, #d3b38c 4px, #c39d73 4px, #c39d73 8px)",
        opacity: "0.85"
      };
    case "bflute":
      return {
        backgroundImage: "repeating-linear-gradient(90deg, #c5a075, #c5a075 8px, #b0885e 8px, #b0885e 16px)",
        opacity: "0.9"
      };
    case "linen":
      return {
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px), repeating-linear-gradient(90deg, #f8f3eb, #f8f3eb 3px, #dfd4c5 3px, #dfd4c5 4px)"
      };
    case "cotton":
      return {
        backgroundColor: "#fcfaf6",
        backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)",
        backgroundSize: "4px 4px"
      };
    case "velvet":
      return {
        backgroundImage: "linear-gradient(135deg, #1f1f1f 0%, #111111 100%)",
        boxShadow: "inset 0 0 20px rgba(255,255,255,0.05)"
      };
    case "obsidian":
      return {
        backgroundImage: "radial-gradient(circle at 30% 30%, #3a3a3a 0%, #151515 100%)",
        boxShadow: "inset 0 0 15px rgba(0,0,0,0.9)"
      };
    case "bopp":
      return {
        backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 40%, rgba(14,165,233,0.15) 70%, rgba(255,255,255,0.05) 100%)",
        backdropFilter: "blur(2px)"
      };
    case "eva":
      return {
        backgroundImage: "linear-gradient(135deg, rgba(253,244,245,0.6) 0%, rgba(244,63,94,0.1) 50%, rgba(253,244,245,0.2) 100%)"
      };
    case "apexguard":
      return {
        backgroundImage: "linear-gradient(180deg, rgba(148,163,184,0.3) 0%, rgba(100,116,139,0.5) 100%)",
        boxShadow: "inset 0 0 10px rgba(0,0,0,0.2)"
      };
    default:
      return { backgroundColor: "#e2e8f0" };
  }
}

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCompareView, setIsCompareView] = useState(false);

  // ESSA DB States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeMaterial, setActiveMaterial] = useState(MATERIAL_DATABASE[0]);
  const [isZoomed, setIsZoomed] = useState(false);

  // AI Consultant States
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Calculator States
  const [calcLength, setCalcLength] = useState(12);
  const [calcWidth, setCalcWidth] = useState(8);
  const [calcGsm, setCalcGsm] = useState(300);
  const [calcQuantity, setCalcQuantity] = useState(1000);

  const tabs = ['All', 'Boards', 'Decorative', 'Fibre'];

  // Filter ESSA Database
  const filteredESSAMaterials = useMemo(() => {
    return MATERIAL_DATABASE.filter(m => {
      const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            m.subName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            m.bestFor.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  // Calculator Logic
  const calculatedWeight = useMemo(() => {
    const areaSqCm = (calcLength * 2.54) * (calcWidth * 2.54);
    const weightPerUnitGrams = (areaSqCm * calcGsm) / 10000;
    const totalWeightKg = (weightPerUnitGrams * calcQuantity) / 1000;
    return {
      perUnit: weightPerUnitGrams.toFixed(1),
      totalKg: totalWeightKg.toFixed(1)
    };
  }, [calcLength, calcWidth, calcGsm, calcQuantity]);

  const applyMaterialToCalculator = (gsmString: string) => {
    const parsedGsm = parseInt(gsmString.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsedGsm)) {
      setCalcGsm(parsedGsm);
    }
  };

  const handleAiConsultation = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    setAiResult(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const systemPrompt = "You are an elite packaging structural engineer at ESSA Packaging Solutions. Match the user's product to the optimal packaging material from our catalog.";
    const materialList = MATERIAL_DATABASE.map(m => `${m.id}: ${m.name} - ${m.description} - Best for: ${m.bestFor}`).join('\n');
    const userQuery = `Product/Brand Description: ${aiPrompt}\n\nAvailable Materials:\n${materialList}\n\nRecommend the best material ID from the available materials and explain why in 2-3 sentences. Focus on physical protection and premium presentation.`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            recommendedId: { type: "STRING" },
            justification: { type: "STRING" }
          },
          required: ["recommendedId", "justification"]
        }
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to consult AI');

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (textResponse) {
        const parsed = JSON.parse(textResponse);
        setAiResult(parsed);
        
        const recommendedMaterial = MATERIAL_DATABASE.find(m => m.id === parsed.recommendedId);
        if (recommendedMaterial) {
          setActiveMaterial(recommendedMaterial);
          setSelectedCategory("all");
        }
      } else {
          throw new Error('Invalid AI response');
      }
    } catch (err: any) {
      setAiError(err.message || 'An error occurred during consultation.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    let result = materialsData;
    if (activeTab !== 'All') {
      result = result.filter(m => m.material_family === activeTab);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.material_family.toLowerCase().includes(q) ||
          m.common_uses.some((u) => u.toLowerCase().includes(q))
      );
    }
    return result;
  }, [searchTerm, activeTab]);

  const selectedMaterials = selectedIds
    .map((id) => materialsData.find((m) => m.id === id))
    .filter(Boolean) as Material[];

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } else if (selectedIds.length < 3) {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const removeSelection = (id: string) => {
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    if (selectedIds.length === 1) setIsCompareView(false);
  };

  if (isCompareView && selectedMaterials.length > 0) {
    return (
      <div className="min-h-screen bg-deckle-bg font-sans flex flex-col">
        <header className="px-8 py-6 flex justify-between items-center border-b border-deckle-border sticky top-0 bg-deckle-bg/90 backdrop-blur-md z-50">
           <div className="flex items-baseline gap-2 cursor-pointer" onClick={() => setIsCompareView(false)}>
            <span className="font-serif text-2xl font-semibold tracking-tight text-deckle-text">Paper</span>
            <span className="text-xs tracking-[0.2em] text-deckle-muted uppercase font-medium">Atlas</span>
          </div>
          <button 
            onClick={() => setIsCompareView(false)}
            className="text-sm font-medium text-deckle-text hover:text-deckle-muted transition-colors"
          >
            Back to Catalogue
          </button>
        </header>

        <main className="flex-1 p-8 overflow-x-auto">
          <div className="max-w-[1400px] mx-auto">
            <h1 className="font-serif text-5xl text-deckle-text mb-12">Comparison Desk</h1>
            
            <div className="flex gap-8 min-w-max">
              {selectedMaterials.map(m => (
                 <div key={m.id} className="w-96 flex-shrink-0 flex flex-col">
                    <div className="relative h-72 rounded-2xl overflow-hidden mb-6">
                      <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeSelection(m.id)}
                        className="absolute top-4 right-4 bg-deckle-bg/80 hover:bg-deckle-bg p-2 rounded-full backdrop-blur-sm transition-colors"
                      >
                        <X className="w-4 h-4 text-deckle-text" />
                      </button>
                    </div>
                    <h2 className="font-serif text-3xl text-deckle-text mb-2">{m.name}</h2>
                    <p className="text-deckle-muted text-sm uppercase tracking-wider mb-8">{m.material_family}</p>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-widest text-deckle-muted mb-2">Surface & Feel</h4>
                        <p className="text-deckle-text text-sm leading-relaxed">{m.surface_or_feel}</p>
                      </div>
                      <hr className="border-deckle-border" />
                      <div>
                        <h4 className="text-xs font-medium uppercase tracking-widest text-deckle-muted mb-2">Origin</h4>
                        <p className="text-deckle-text text-sm leading-relaxed">{m.manufacturing_origin || 'Unknown'}</p>
                      </div>
                      <hr className="border-deckle-border" />
                       <div>
                        <h4 className="text-xs font-medium uppercase tracking-widest text-deckle-muted mb-2">Common Uses</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {m.common_uses.map((use, i) => (
                            <span key={i} className="px-3 py-1 bg-deckle-surface text-deckle-text rounded-lg text-xs font-medium">
                              {use}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deckle-bg font-sans relative pb-32">
      {/* Navigation */}
      <nav className="px-8 py-6 flex justify-between items-center border-b border-deckle-border">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-semibold tracking-tight text-deckle-text">Paper</span>
          <span className="text-xs tracking-[0.2em] text-deckle-muted uppercase font-medium">Atlas</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-deckle-text">
          <a href="#" className="hover:text-deckle-muted transition-colors">Catalogue</a>
          <a href="#" className="hover:text-deckle-muted transition-colors">Specify</a>
          <a href="#" className="hover:text-deckle-muted transition-colors">Journal</a>
          <a href="#" className="hover:text-deckle-muted transition-colors">Fibre</a>
          <a href="#" className="hover:text-deckle-muted transition-colors">House</a>
          <button className="bg-deckle-dark text-white px-5 py-2.5 rounded-lg hover:bg-deckle-dark/90 transition-colors">
            Request samples
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-8 max-w-[1400px] mx-auto pt-16">
        
        {/* Header Section */}
        <div className="max-w-3xl mb-12 flex flex-col gap-4">
           <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-deckle-dark uppercase">
              <Sparkles className="w-4 h-4" />
              ESSA Structural Laboratories
            </div>
          <h1 className="font-serif text-5xl md:text-6xl text-deckle-text mb-2 tracking-tight">The Material <span className="italic">Atlas</span></h1>
          <p className="text-deckle-muted text-lg leading-relaxed">
            A meticulously curated catalog of high-performance boards, tactile wrapped specialty stocks, and structural polymers. Engineered for international shipping durability and elite retail presence.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { id: "all", label: "All Substrates" },
            { id: "paperboards", label: "Paperboards" },
            { id: "corrugated", label: "Corrugated Mediums" },
            { id: "specialty", label: "Specialty Papers" },
            { id: "films", label: "High-Performance Films" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-6 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                selectedCategory === tab.id 
                  ? 'bg-deckle-dark text-white border-deckle-dark' 
                  : 'bg-white/50 text-deckle-text border-deckle-border hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & AI Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-7">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-deckle-muted" />
              <input
                type="text"
                placeholder="Search substrates, properties, or uses..."
                className="w-full bg-white/50 border border-deckle-border rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-deckle-dark transition-shadow placeholder:text-deckle-muted/70"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-deckle-muted hover:text-deckle-text"
                >
                  Clear
                </button>
              )}
            </div>

             {/* ✨ AI CONSULTANT SECTION */}
            <div className="bg-deckle-dark rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8">
                <Bot className="w-48 h-48" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wider text-[#F4EFE6] uppercase border border-white/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  ESSA Intelligence
                </div>
                <h3 className="text-2xl font-serif font-medium">AI Structural Consultant</h3>
                <p className="text-sm text-white/80 leading-relaxed max-w-lg">
                  Describe your product, brand aesthetic, and logistics requirements. Our AI engineering model will instantly analyze our database to recommend the optimal substrate for your specific usecase.
                </p>
                <div className="flex flex-col gap-3 mt-4">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. I am launching a luxury organic face serum in heavy glass dropper bottles. I need something that feels incredibly premium, protects glass during shipping, and has a dark, minimalist aesthetic."
                    className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-[#F4EFE6]/50 transition-all min-h-[100px] resize-y"
                  />
                  <div className="flex justify-between items-center">
                    {aiError && <span className="text-red-300 text-xs">{aiError}</span>}
                    {!aiError && <span></span>}
                    <button
                      onClick={handleAiConsultation}
                      disabled={isAiLoading || !aiPrompt.trim()}
                      className="bg-[#F4EFE6] hover:bg-white disabled:opacity-50 text-deckle-dark px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                      {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isAiLoading ? 'Analyzing Matrices...' : 'Generate Blueprint'}
                    </button>
                  </div>
                </div>

                {/* AI Result Card */}
                {aiResult && (
                  <div className="mt-6 p-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                    <h4 className="text-sm font-bold text-[#F4EFE6] uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Recommended: {MATERIAL_DATABASE.find(m => m.id === aiResult.recommendedId)?.name || 'Custom Specification'}
                    </h4>
                    <p className="text-sm leading-relaxed text-white/90">
                      {aiResult.justification}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Grid count */}
            <div className="flex items-center justify-between mt-8 mb-6">
              <p className="text-sm text-deckle-muted font-medium">{filteredESSAMaterials.length} materials matching criteria</p>
            </div>

            {/* Substrate Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredESSAMaterials.map((mat) => {
                const isActive = activeMaterial.id === mat.id;
                return (
                  <div
                    key={mat.id}
                    onClick={() => {
                      setActiveMaterial(mat);
                      setIsZoomed(false);
                    }}
                    className={`group relative p-6 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
                      isActive 
                        ? "bg-white ring-2 ring-deckle-dark shadow-xl" 
                        : "bg-white/50 hover:bg-white border border-deckle-border shadow-sm"
                    }`}
                  >
                    <div className="absolute right-4 top-4 w-12 h-12 rounded-xl border border-black/5 overflow-hidden shadow-inner flex items-center justify-center bg-deckle-surface">
                      <div 
                        className="w-full h-full scale-125 group-hover:scale-150 transition-transform duration-700" 
                        style={getTextureStyle(mat.simulatedTexture)} 
                      />
                    </div>

                    <div className="pr-14 space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-deckle-muted">
                        {mat.category}
                      </span>
                      <h3 className="text-lg font-serif font-semibold text-deckle-text leading-tight group-hover:text-deckle-dark">
                        {mat.name}
                      </h3>
                      <p className="text-xs text-deckle-muted line-clamp-2 leading-relaxed">
                        {mat.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-deckle-border/50 flex justify-between items-center text-xs">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-deckle-muted uppercase font-semibold">Caliper / Range</span>
                        <span className="font-semibold text-deckle-text">{mat.gsmRange}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-deckle-muted transition-transform group-hover:translate-x-1 ${isActive ? "text-deckle-dark translate-x-1" : ""}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Specification & Calculator */}
          <div className="lg:col-span-5 space-y-8">
            <div className="sticky top-24 space-y-8">
              
              <div key={activeMaterial.id} className="animate-slide-up-fade space-y-8">
                {/* Specification Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-deckle-border/50 space-y-8 relative overflow-hidden">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-deckle-surface text-deckle-dark text-[10px] font-bold rounded-full uppercase tracking-widest border border-deckle-border">
                      {activeMaterial.category} SPECIFICATION
                    </span>
                    <div className="text-[10px] font-bold uppercase text-deckle-muted flex items-center gap-1 tracking-widest">
                      <Award className="w-3 h-3" /> ESSA Certified
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-3xl font-serif font-medium tracking-tight text-deckle-text">
                      {activeMaterial.name}
                    </h2>
                    <p className="text-xs uppercase font-medium text-deckle-muted tracking-widest">
                      {activeMaterial.subName}
                    </p>
                  </div>
                </div>

                {/* Zoomable Texture */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-deckle-muted tracking-widest flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Micro-Lens Zoom Visualizer
                  </span>
                  
                  <div 
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                    className="h-48 rounded-2xl border border-deckle-border overflow-hidden relative cursor-zoom-in bg-deckle-surface"
                  >
                    <div 
                      className={`w-full h-full transition-transform duration-1000 origin-center ${
                        isZoomed ? "scale-250" : "scale-100"
                      }`}
                      style={getTextureStyle(activeMaterial.simulatedTexture)}
                    />
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-deckle-dark/90 text-white text-[10px] uppercase font-bold rounded-lg tracking-widest flex items-center gap-1 backdrop-blur-sm pointer-events-none">
                      <span>{isZoomed ? "2.5x Zoom" : "Default Aspect"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-deckle-muted">Substrate Architecture</span>
                  <p className="text-sm text-deckle-text leading-relaxed">
                    {activeMaterial.description}
                  </p>
                </div>

                {/* Score Matrix */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-deckle-muted">Structural Stress Matrix</span>
                  
                  <div className="space-y-3">
                    {[
                      { label: "Tensile & Tear Resistance", val: activeMaterial.strengthScore * 20 },
                      { label: "Chromatographic Print Fidelity", val: activeMaterial.printScore },
                      { label: "Water & Grease Hydrophobics", val: activeMaterial.moistureBarrier },
                      { label: "Circular Ecological Reclaim", val: activeMaterial.sustainabilityScore },
                    ].map((score, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-deckle-text">
                          <span>{score.label}</span>
                          <span className="text-deckle-muted">{score.val}%</span>
                        </div>
                        <div className="h-1.5 bg-deckle-surface rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-deckle-dark rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${score.val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-deckle-border/50 pt-2">
                  <div className="py-3 flex justify-between items-start gap-4">
                    <span className="text-xs font-semibold text-deckle-muted uppercase tracking-wider shrink-0 mt-0.5">Tactile Grade</span>
                    <span className="text-sm font-medium text-deckle-text text-right">{activeMaterial.tactileFeel}</span>
                  </div>
                  <div className="py-3 flex justify-between items-start gap-4">
                    <span className="text-xs font-semibold text-deckle-muted uppercase tracking-wider shrink-0">Caliper</span>
                    <span className="text-sm font-bold text-deckle-text text-right">{activeMaterial.gsmRange}</span>
                  </div>
                  <div className="py-3 flex justify-between items-start gap-4">
                    <span className="text-xs font-semibold text-deckle-muted uppercase tracking-wider shrink-0 mt-0.5">Core Use</span>
                    <span className="text-sm font-medium text-deckle-dark text-right leading-tight">{activeMaterial.bestFor}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-deckle-muted flex items-center gap-1">
                    <Printer className="w-3 h-3" /> Certified Embellishments
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeMaterial.finishes.map((finish, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1.5 bg-deckle-surface text-deckle-dark text-[10px] font-bold rounded-lg border border-deckle-border flex items-center gap-1.5 uppercase tracking-wider"
                      >
                        <Check className="w-3 h-3 text-deckle-muted" />
                        {finish}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#F2ECE0] border border-deckle-border rounded-2xl flex items-start gap-3">
                  <Leaf className="w-5 h-5 text-deckle-dark shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-deckle-muted tracking-widest">Ecological Rating</span>
                    <p className="text-xs font-semibold text-deckle-text leading-relaxed">
                      {activeMaterial.sustainabilityLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Calculator Panel */}
              <div className="bg-deckle-surface rounded-3xl p-8 border border-deckle-border space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-deckle-border rounded-full text-[10px] text-deckle-dark font-bold uppercase tracking-widest">
                    <Zap className="w-3 h-3" />
                    Logistic Tool
                  </div>
                  <h3 className="text-xl font-serif text-deckle-text font-medium">
                    Caliper Mass Calibrator
                  </h3>
                  <p className="text-xs text-deckle-muted">
                    Calculate physical payload mass for freight estimation.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-deckle-muted flex justify-between">
                      <span>Length</span>
                      <span>In</span>
                    </label>
                    <input
                      type="number"
                      value={calcLength}
                      onChange={(e) => setCalcLength(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-deckle-border rounded-xl px-4 py-2 text-sm font-semibold text-deckle-text outline-none focus:ring-1 focus:ring-deckle-dark"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-deckle-muted flex justify-between">
                      <span>Width</span>
                      <span>In</span>
                    </label>
                    <input
                      type="number"
                      value={calcWidth}
                      onChange={(e) => setCalcWidth(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-deckle-border rounded-xl px-4 py-2 text-sm font-semibold text-deckle-text outline-none focus:ring-1 focus:ring-deckle-dark"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-deckle-muted flex justify-between">
                      <span>Density</span>
                      <span>GSM</span>
                    </label>
                    <input
                      type="number"
                      value={calcGsm}
                      onChange={(e) => setCalcGsm(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white border border-deckle-border rounded-xl px-4 py-2 text-sm font-semibold text-deckle-text outline-none focus:ring-1 focus:ring-deckle-dark"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-deckle-muted flex justify-between">
                      <span>Volume</span>
                      <span>Qty</span>
                    </label>
                    <input
                      type="number"
                      value={calcQuantity}
                      onChange={(e) => setCalcQuantity(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white border border-deckle-border rounded-xl px-4 py-2 text-sm font-semibold text-deckle-text outline-none focus:ring-1 focus:ring-deckle-dark"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => applyMaterialToCalculator(activeMaterial.gsmRange)}
                    className="w-full px-4 py-3 bg-white border border-deckle-border hover:bg-deckle-border/30 transition-colors rounded-xl text-xs font-bold text-deckle-dark uppercase tracking-widest"
                  >
                    Sync Active GSM: {activeMaterial.gsmRange.split(' ')[0]}
                  </button>
                </div>

                <div className="p-5 bg-deckle-dark rounded-2xl grid grid-cols-2 gap-4 divide-x divide-white/20">
                  <div className="space-y-1 pl-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">Unit Weight</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-serif font-semibold text-white">{calculatedWeight.perUnit}</span>
                      <span className="text-xs text-white/60 font-medium">g</span>
                    </div>
                  </div>
                  <div className="space-y-1 pl-6">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">Total Mass</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-serif font-semibold text-white">{calculatedWeight.totalKg}</span>
                      <span className="text-xs text-white/60 font-medium">kg</span>
                    </div>
                  </div>
                </div>
              </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <section className="h-[90vh] w-full mt-24 border-t border-deckle-border relative z-30">
        <KnowledgeHub />
      </section>

      <section className="h-[80vh] w-full border-t border-deckle-border relative z-30">
        <OrigamiSimulator />
      </section>

      {/* Sticky Bottom Comparison Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#F2ECE0] border-t border-deckle-border shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 animate-in slide-in-from-bottom-full duration-300">
          <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
            
            <div className="flex items-center gap-6">
              <span className="text-xs font-medium tracking-[0.15em] text-deckle-muted uppercase">
                Compare {selectedIds.length}/3
              </span>
              
              <div className="flex gap-2">
                {selectedMaterials.map(m => (
                  <div key={m.id} className="flex items-center gap-2 bg-deckle-border/50 px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-medium text-deckle-text">{m.name}</span>
                    <button 
                      onClick={() => removeSelection(m.id)}
                      className="text-deckle-muted hover:text-deckle-text transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setSelectedIds([])}
                className="text-sm font-medium text-deckle-text hover:text-deckle-muted transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsCompareView(true)}
                className="bg-deckle-dark text-white px-6 py-2.5 rounded-lg hover:bg-deckle-dark/90 transition-colors font-medium text-sm shadow-sm"
              >
                View table
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
