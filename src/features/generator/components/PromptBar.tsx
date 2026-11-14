import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Dice5, SlidersHorizontal, ArrowRight, Square, Sparkles, ChevronLeft, ChevronRight, Eraser, Palette, Maximize2, X, ExternalLink, User, MapPin, PenTool, RefreshCw, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { agnesFetch, parseAgnesError } from "../store/useGeneratorStore";
import { useGeneratorStore, AspectRatio } from "../store/useGeneratorStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: "1:1", value: "1:1" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "4:3", value: "4:3" },
  { label: "3:4", value: "3:4" },
  { label: "16:10", value: "16:10" },
  { label: "2:3", value: "2:3" },
  { label: "3:2", value: "3:2" },
  { label: "4:5", value: "4:5" },
];

const STYLES = [
  { label: "Photorealistic", value: "photorealistic, highly detailed, 8k resolution, cinematic lighting, sharp focus" },
  { label: "Anime", value: "anime style, vibrant colors, detailed line art, cel shaded" },
  { label: "3D Render", value: "3D render, octane render, unreal engine 5, path tracing" },
  { label: "Oil Painting", value: "oil painting, thick impasto strokes, museum quality, masterpiece" },
  { label: "Digital Art", value: "digital illustration, trending on artstation, concept art, polished" },
  { label: "Cyberpunk", value: "cyberpunk, neon lights, dystopian, futuristic city, sci-fi aesthetic" },
  { label: "Character Sheet", value: "character reference sheet, turnaround, multiple angles, facial expressions, concept art, clean white background" },
  { label: "Isometric", value: "isometric view, 3d, miniature, diorama, octane render, tilt-shift, highly detailed" },
  { label: "Arcane", value: "painterly 3d animated style, stylized textures, dramatic lighting, fantasy steampunk, deep shadows" },
  { label: "Comic Book", value: "comic book film style, halftone patterns, chromatic aberration, vibrant pop art, dynamic action, stylized 3d" },
  { label: "Claymation", value: "claymation style, stop motion, plasticine clay, fingerprints, tactile textures, studio lighting, miniature photography" },
  { label: "3D Cartoon", value: "3D cartoon animation style, soft lighting, expressive features, stylized realism, family friendly, colorful, masterpiece" },
  { label: "Children's Book", value: "children's book illustration, watercolor and ink, whimsical, soft pastel colors, storybook style, enchanting" },
  { label: "Exploded View", value: "exploded engineering view, schematic diagram, technical illustration, blueprint, detailed components, dis-assembled" },
  { label: "Watercolor", value: "watercolor painting, loose brush strokes, wet on wet, translucent colors, artistic bleed, paper texture" },
  { label: "Ink Sketch", value: "ink sketch, crosshatching, fineliner pen, black and white, detailed line work, architectural drawing" },
  { label: "Low Poly", value: "low poly 3d art, faceted surfaces, flat shading, geometric, minimalist, vibrant gradient colors, blender" },
];

const STYLE_GRADIENTS: Record<string, string> = {
  "Photorealistic": "from-zinc-500 to-zinc-700",
  "Anime": "from-pink-400 to-cyan-300",
  "3D Render": "from-indigo-500 to-purple-600",
  "Oil Painting": "from-amber-600 to-yellow-800",
  "Digital Art": "from-violet-500 to-pink-500",
  "Cyberpunk": "from-fuchsia-500 to-cyan-400",
  "Character Sheet": "from-gray-300 via-slate-200 to-gray-400",
  "Isometric": "from-amber-400 to-emerald-400",
  "Arcane": "from-fuchsia-800 to-amber-600",
  "Comic Book": "from-red-500 to-yellow-500",
  "Claymation": "from-orange-500 to-stone-500",
  "3D Cartoon": "from-purple-400 to-rose-400",
  "Children's Book": "from-sky-300 to-lime-200",
  "Exploded View": "from-slate-700 to-blue-900",
  "Watercolor": "from-cyan-300 via-sky-200 to-purple-300",
  "Ink Sketch": "from-stone-900 to-stone-500",
  "Low Poly": "from-emerald-400 to-amber-400",
};

const AGNES_MODELS = [
  { label: "Agnes Image 2.5 Flash", value: "agnes-image-2.5-flash" },
  { label: "Agnes Image 2.5", value: "agnes-image-2.5" },
];

const AGNES_TEXT_MODELS = [
  { label: "Agnes 3.0 Flash", value: "agnes-3.0-flash" },
  { label: "Agnes 2.5 Flash", value: "agnes-2.5-flash" },
];

const StyleChips = ({ prompt, setPrompt, isGenerating }: { prompt: string; setPrompt: (p: string) => void; isGenerating: boolean }) => (
  <div role="list" aria-label="Quick style presets" className="flex items-center gap-2 overflow-x-auto pb-1.5 min-w-0 scrollbar-hide">
    {STYLES.map((style) => {
      const isSelected = prompt.toLowerCase().includes(style.label.toLowerCase()) || 
                         prompt.toLowerCase().includes(style.value.split(',')[0].toLowerCase());
      
      const grad = STYLE_GRADIENTS[style.label] || "from-pictora-yellow to-yellow-600";
      
      return (
        <button
          type="button"
          key={style.label}
          role="listitem"
          onClick={() => {
            if (isSelected) {
              let updated = prompt;
              const valSig = style.value;
              const labelSig = style.label;
              
              updated = updated.replace(new RegExp(`,?\\s*${valSig}`, 'gi'), '');
              updated = updated.replace(new RegExp(`^${valSig}\\s*,?\\s*`, 'gi'), '');
              updated = updated.replace(new RegExp(`,?\\s*${labelSig}`, 'gi'), '');
              updated = updated.replace(new RegExp(`^${labelSig}\\s*,?\\s*`, 'gi'), '');
              
              updated = updated.trim().replace(/^,\s*|,\s*$/g, '');
              setPrompt(updated);
              toast.success(`Removed ${style.label} style`);
            } else {
              const newPrompt = prompt.trim() 
                ? `${prompt.trim()}, ${style.value}`
                : style.value;
              setPrompt(newPrompt);
              toast.success(`Applied ${style.label} style`);
            }
          }}
          disabled={isGenerating}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-tight whitespace-nowrap transition-all duration-300 shadow active:scale-95 shrink-0 cursor-pointer select-none",
            isGenerating && "opacity-50 cursor-not-allowed",
            isSelected 
              ? "bg-pictora-yellow border-transparent text-black ring-1 ring-pictora-yellow/50 scale-[1.02]" 
              : "bg-[#151515] border-white/5 text-white/60 hover:text-white hover:bg-white/10"
          )}
          aria-pressed={isSelected}
        >
          <span className={cn("w-2 h-2 rounded-full bg-gradient-to-tr shadow-inner", grad)} aria-hidden="true" />
          <span>{style.label}</span>
          {isSelected && (
            <span className="w-1.5 h-1.5 rounded-full bg-black ml-1 scale-90" aria-hidden="true" />
          )}
        </button>
      );
    })}
  </div>
);

const AspectRatioPicker = ({ 
  aspectRatio, 
  setAspectRatio, 
  isGenerating 
}: { 
  aspectRatio: AspectRatio; 
  setAspectRatio: (r: AspectRatio) => void; 
  isGenerating: boolean;
}) => {
  const [showRatios, setShowRatios] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setShowRatios(false);
      }
    };
    if (showRatios) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRatios]);

  return (
    <div className="relative" ref={buttonRef}>
      <button 
        type="button"
        onClick={() => setShowRatios(!showRatios)}
        disabled={isGenerating}
        className={cn(
          "px-3 py-1.5 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2",
          showRatios ? "text-white bg-white/10" : "text-white/60",
          isGenerating && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Aspect ratio"
        aria-expanded={showRatios}
        aria-haspopup="listbox"
      >
        <Square className="w-[14px] h-[14px]" aria-hidden="true" />
        <span className="text-[10px] font-bold tracking-tight">{aspectRatio}</span>
      </button>
      
      <AnimatePresence>
        {showRatios && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            role="listbox"
            aria-label="Select aspect ratio"
            className="absolute bottom-full mb-4 left-0 bg-[#1A1A1A] text-white rounded-2xl shadow-2xl border border-white/10 p-2 grid grid-cols-3 gap-1 min-w-[240px] z-50"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.value}
                role="option"
                aria-selected={aspectRatio === ratio.value}
                onClick={() => {
                  setAspectRatio(ratio.value);
                  setShowRatios(false);
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-1 hover:bg-white/10",
                  aspectRatio === ratio.value ? "bg-pictora-yellow text-black" : "text-white/60"
                )}
              >
                <div className={cn(
                  "border-2 border-current rounded-sm mb-1",
                  ratio.value === "1:1" && "w-4 h-4",
                  ratio.value === "16:9" && "w-6 h-3.5",
                  ratio.value === "9:16" && "w-3.5 h-6",
                  ratio.value === "4:3" && "w-5 h-4",
                  ratio.value === "3:4" && "w-4 h-5",
                  ratio.value === "16:10" && "w-6 h-4",
                  ratio.value === "2:3" && "w-3.5 h-5",
                  ratio.value === "3:2" && "w-5 h-3.5",
                  ratio.value === "4:5" && "w-4 h-5",
                )} aria-hidden="true" />
                {ratio.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StylePicker = ({ 
  prompt, 
  setPrompt, 
  isGenerating 
}: { 
  prompt: string; 
  setPrompt: (p: string) => void; 
  isGenerating: boolean;
}) => {
  const [showStyles, setShowStyles] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setShowStyles(false);
      }
    };
    if (showStyles) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStyles]);

  return (
    <div className="relative" ref={buttonRef}>
      <button 
        type="button"
        onClick={() => setShowStyles(!showStyles)}
        disabled={isGenerating}
        className={cn(
          "px-3 py-1.5 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2",
          showStyles ? "text-white bg-white/10" : "text-white/60",
          isGenerating && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Style presets"
        aria-expanded={showStyles}
        aria-haspopup="listbox"
      >
        <Palette className="w-[14px] h-[14px]" aria-hidden="true" />
        <span className="text-[10px] font-bold tracking-tight">Styles</span>
      </button>
      
      <AnimatePresence>
        {showStyles && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            role="listbox"
            aria-label="Select style preset"
            className="absolute bottom-full mb-4 left-0 bg-[#1A1A1A] text-white rounded-2xl shadow-2xl border border-white/10 p-2 grid grid-cols-2 gap-1 min-w-[280px] z-50 origin-bottom-left"
          >
            {STYLES.map((style) => (
              <button
                key={style.label}
                role="option"
                onClick={() => {
                  const newPrompt = prompt.trim() 
                    ? `${prompt.trim()}, ${style.value}`
                    : style.value;
                  setPrompt(newPrompt);
                  setShowStyles(false);
                }}
                className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-left hover:bg-white/10 text-white/60 hover:text-white"
              >
                {style.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QuotaIndicator = ({ provider, agnesApiKey, recentGenerations }: {
  provider: "comfyui" | "agnes";
  agnesApiKey: string;
  recentGenerations: number[];
}) => {
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  if (provider !== 'agnes') return null;

  const count = recentGenerations.filter(t => now - t < 60000).length;
  const hasKey = !!agnesApiKey;
  
  let colorClass = "text-emerald-500/60";
  let statusText = "Ready";

  if (count >= 2 && !hasKey) {
    colorClass = "text-red-500 animate-pulse";
    statusText = "Quota Near";
  } else if (count >= 1 && !hasKey) {
    colorClass = "text-yellow-500";
    statusText = "Used 1/2";
  }

  return (
    <div className="flex flex-col items-end gap-0.5 pr-1" aria-live="polite" aria-label="API quota status">
      <div className="flex items-center gap-1.5">
        <span className={cn("text-[8px] font-bold uppercase tracking-widest transition-colors", colorClass)}>
          {hasKey ? "Key Active" : statusText}
        </span>
        <div className="flex gap-0.5" role="img" aria-label={`Quota usage: ${count} of 2 requests used`}>
          {[1, 2].map((i) => (
            <div 
              key={i} 
              className={cn(
                "w-1 h-3 rounded-full transition-all duration-500",
                i <= count ? "bg-pictora-yellow shadow-[0_0_8px_rgba(255,220,100,0.5)]" : "bg-white/10"
              )} 
            />
          ))}
        </div>
      </div>
      {!hasKey && (
        <span className="text-[7px] text-white/20 font-medium">Free Tier Limit: 2/min</span>
      )}
    </div>
  );
};

const AdvancedSettings = ({
  provider, setProvider,
  comfyUiUrl, setComfyUiUrl,
  agnesApiUrl, setAgnesApiUrl,
  agnesApiKey, setAgnesApiKey,
  agnesImageModel, setAgnesImageModel,
  agnesTextModel, setAgnesTextModel,
  comfyUiCheckpoint, setComfyUiCheckpoint,
  comfyUiSteps, setComfyUiSteps,
  comfyUiCfg, setComfyUiCfg,
  comfyUiSampler, setComfyUiSampler,
  comfyUiScheduler, setComfyUiScheduler,
  comfyUiDenoise, setComfyUiDenoise,
  subjectImage,
  clearImages,
  images,
}: {
  provider: "comfyui" | "agnes";
  setProvider: (p: "comfyui" | "agnes") => void;
  comfyUiUrl: string; setComfyUiUrl: (v: string) => void;
  agnesApiUrl: string; setAgnesApiUrl: (v: string) => void;
  agnesApiKey: string; setAgnesApiKey: (v: string) => void;
  agnesImageModel: string; setAgnesImageModel: (v: string) => void;
  agnesTextModel: string; setAgnesTextModel: (v: string) => void;
  comfyUiCheckpoint: string; setComfyUiCheckpoint: (v: string) => void;
  comfyUiSteps: number; setComfyUiSteps: (v: number) => void;
  comfyUiCfg: number; setComfyUiCfg: (v: number) => void;
  comfyUiSampler: string; setComfyUiSampler: (v: string) => void;
  comfyUiScheduler: string; setComfyUiScheduler: (v: string) => void;
  comfyUiDenoise: number; setComfyUiDenoise: (v: number) => void;
  subjectImage: string | null;
  clearImages: () => void;
  images: any[];
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [settings, setSettings] = useState({ enhance: true, highRes: false, creative: true });

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  return (
    <div className="relative" ref={buttonRef}>
      <button 
        type="button"
        onClick={() => setShowSettings(!showSettings)}
        className={cn(
          "p-2 hover:bg-white/10 rounded-xl transition-colors",
          showSettings ? "text-white bg-white/10" : "text-white/60"
        )}
        aria-label="Advanced settings"
        aria-expanded={showSettings}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal className="w-[16px] h-[16px]" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            role="dialog"
            aria-label="Advanced settings"
            className="absolute bottom-full mb-4 left-0 bg-[#1A1A1A] text-white rounded-2xl shadow-2xl border border-white/10 p-4 min-w-[320px] z-50 text-left"
          >
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Advanced Settings</p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">AI Provider</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setProvider('comfyui')}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                      provider === 'comfyui' ? "bg-pictora-yellow border-transparent text-black" : "bg-[#222] border-white/10 text-white/60"
                    )}
                  >
                    ComfyUI
                  </button>
                  <button
                    onClick={() => setProvider('agnes')}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                      provider === 'agnes' ? "bg-pictora-yellow border-transparent text-black" : "bg-[#222] border-white/10 text-white/60"
                    )}
                  >
                    Agnes
                  </button>
                </div>
              </div>

              {provider === 'agnes' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Text Model (Chat / Prompt Craft)</span>
                    <select
                      value={AGNES_TEXT_MODELS.some(m => m.value === agnesTextModel) ? agnesTextModel : "custom"}
                      onChange={(e) => {
                        if (e.target.value !== "custom") {
                          setAgnesTextModel(e.target.value);
                        } else {
                          setAgnesTextModel("");
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 text-white"
                    >
                      {AGNES_TEXT_MODELS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                      <option value="custom">Custom ID...</option>
                     </select>

                    {(agnesTextModel === "" || !AGNES_TEXT_MODELS.some(m => m.value === agnesTextModel)) && (
                      <input
                        type="text"
                        value={agnesTextModel}
                        onChange={(e) => setAgnesTextModel(e.target.value)}
                        className="w-full px-3 py-2 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 mt-2"
                        placeholder="Enter custom text model ID (e.g. agnes-3.0-flash)"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Image Model</span>
                    <select 
                      value={AGNES_MODELS.some(m => m.value === agnesImageModel) ? agnesImageModel : "custom"}
                      onChange={(e) => {
                        if (e.target.value !== "custom") {
                          setAgnesImageModel(e.target.value);
                        } else {
                          setAgnesImageModel("");
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 text-white"
                    >
                      {AGNES_MODELS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                      <option value="custom">Custom ID...</option>
                     </select>

                    {(agnesImageModel === "" || !AGNES_MODELS.some(m => m.value === agnesImageModel)) && (
                      <input
                        type="text"
                        value={agnesImageModel}
                        onChange={(e) => setAgnesImageModel(e.target.value)}
                        className="w-full px-3 py-2 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 mt-2"
                        placeholder="Enter custom image model ID (e.g. agnes-image-2.5-flash)"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Text Model</span>
                    <select
                      value={AGNES_TEXT_MODELS.some(m => m.value === agnesTextModel) ? agnesTextModel : "custom"}
                      onChange={(e) => {
                        if (e.target.value !== "custom") {
                          setAgnesTextModel(e.target.value);
                        } else {
                          setAgnesTextModel("");
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 text-white"
                    >
                      {AGNES_TEXT_MODELS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                      <option value="custom">Custom ID...</option>
                     </select>

                    {(agnesTextModel === "" || !AGNES_TEXT_MODELS.some(m => m.value === agnesTextModel)) && (
                      <input
                        type="text"
                        value={agnesTextModel}
                        onChange={(e) => setAgnesTextModel(e.target.value)}
                        className="w-full px-3 py-2 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 mt-2"
                        placeholder="Enter custom text model ID (e.g. agnes-3.0-flash)"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">API Key (Required)</span>
                      <a 
                        href="https://platform.agnes-ai.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] text-pictora-yellow hover:underline flex items-center gap-1"
                      >
                        Get Key <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input 
                      type="password"
                      value={agnesApiKey}
                      onChange={(e) => setAgnesApiKey(e.target.value)}
                      className="w-full px-3 py-2 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50"
                      placeholder={process.env.AGNES_API_KEY ? "Using system key" : "Paste your Agnes API key"}
                    />
                  </div>
                </div>
              )}

              {provider === 'agnes' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Agnes API Endpoint</span>
                    <input 
                      type="text"
                      value={agnesApiUrl}
                      onChange={(e) => setAgnesApiUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 text-white"
                      placeholder="https://apihub.agnes-ai.com/v1"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">API Key (Required)</span>
                      <a 
                        href="https://apihub.agnes-ai.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] text-pictora-yellow hover:underline flex items-center gap-1"
                      >
                        Get Key <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input 
                      type="password"
                      value={agnesApiKey}
                      onChange={(e) => setAgnesApiKey(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 text-white"
                      placeholder="Paste your Agnes API key"
                    />
                  </div>
                  <p className="text-[8px] text-white/40 italic">
                    Uses OpenAI-compatible /images/generations endpoint. Model can be set above.
                  </p>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Agnes Image Model</span>
                    <select 
                      value={agnesImageModel}
                      onChange={(e) => setAgnesImageModel(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 text-white"
                    >
                      <option value="agnes-image-2.5-flash">Agnes Image 2.5 Flash</option>
                      <option value="agnes-image-2.5">Agnes Image 2.5</option>
                      <option value="flux.1-dev">Flux.1 Dev</option>
                      <option value="sdxl">SDXL</option>
                      <option value="stable-diffusion-xl">Stable Diffusion XL</option>
                      <option value="custom">Custom model ID...</option>
                    </select>
                    {agnesImageModel === "custom" && (
                      <input 
                        type="text"
                        value={agnesImageModel}
                        onChange={(e) => setAgnesImageModel(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 mt-1.5 text-white"
                        placeholder="Enter custom Agnes model ID (e.g. flux.1-dev)"
                      />
                    )}
                  </div>
                </div>
              )}

              {provider === 'comfyui' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">ComfyUI Endpoint</span>
                    <input 
                      type="text"
                      value={comfyUiUrl}
                      onChange={(e) => setComfyUiUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 text-white"
                      placeholder="http://127.0.0.1:8188"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Model Checkpoint</span>
                    <select 
                      value={["sd_xl_base_1.0.safetensors", "sd_xl_refiner_1.0.safetensors", "v1-5-pruned-emaonly.safetensors", "dreamshaperXL_v21.safetensors"].includes(comfyUiCheckpoint) ? comfyUiCheckpoint : "custom"}
                      onChange={(e) => {
                        if (e.target.value !== "custom") {
                          setComfyUiCheckpoint(e.target.value);
                        } else {
                          setComfyUiCheckpoint("");
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 text-white"
                    >
                      <option value="sd_xl_base_1.0.safetensors">SDXL Base 1.0 (sd_xl_base_1.0)</option>
                      <option value="sd_xl_refiner_1.0.safetensors">SDXL Refiner 1.0</option>
                      <option value="v1-5-pruned-emaonly.safetensors">SD 1.5 Pruned EMA Only</option>
                      <option value="dreamshaperXL_v21.safetensors">DreamShaper XL v21</option>
                      <option value="custom">Custom Checkpoint Name...</option>
                    </select>
                    
                    {(!["sd_xl_base_1.0.safetensors", "sd_xl_refiner_1.0.safetensors", "v1-5-pruned-emaonly.safetensors", "dreamshaperXL_v21.safetensors"].includes(comfyUiCheckpoint)) && (
                      <input 
                        type="text"
                        value={comfyUiCheckpoint}
                        onChange={(e) => setComfyUiCheckpoint(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 mt-1.5 text-white"
                        placeholder="Enter model filename (e.g. checkpoint.safetensors)"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sampler</span>
                      <select 
                        value={comfyUiSampler}
                        onChange={(e) => setComfyUiSampler(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 text-white"
                      >
                        {["dpmpp_2m", "dpmpp_sde_gpu", "dpmpp_2m_sde", "euler", "euler_ancestral", "heun", "ddim", "uni_pc"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Scheduler</span>
                      <select 
                        value={comfyUiScheduler}
                        onChange={(e) => setComfyUiScheduler(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 text-white"
                      >
                        {["karras", "normal", "exponential", "sgm_uniform", "simple", "ddim_uniform"].map((sc) => (
                          <option key={sc} value={sc}>{sc}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Steps ({comfyUiSteps})</span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="100" 
                      step="1"
                      value={comfyUiSteps} 
                      onChange={(e) => setComfyUiSteps(parseInt(e.target.value))}
                      className="w-full accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">CFG Scale ({comfyUiCfg})</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      step="0.5"
                      value={comfyUiCfg} 
                      onChange={(e) => setComfyUiCfg(parseFloat(e.target.value))}
                      className="w-full accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {subjectImage ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Img2Img Active
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">Denoise: {comfyUiDenoise}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0.05" 
                          max="0.95" 
                          step="0.05"
                          value={comfyUiDenoise} 
                          onChange={(e) => setComfyUiDenoise(parseFloat(e.target.value))}
                          className="w-full accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-[8px] text-white/30 italic">Lower values preserve more of your Subject Image. Higher values match the text prompt more.</p>
                      </>
                    ) : (
                      <div className="p-2 rounded-xl bg-white/5 flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/30"></span>
                          Text-to-Image Mode
                        </span>
                        <p className="text-[8px] text-white/30">Upload a <b className="text-white/40">Subject</b> image in the left sidebar to unlock Image-to-Image (img2img) controls.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">Enhance Prompt</span>
                    <span className="text-[10px] text-white/40">AI-powered prompt expansion</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, enhance: !s.enhance }))}
                    className={cn(
                      "w-8 h-4 rounded-full transition-colors relative",
                      settings.enhance ? "bg-pictora-yellow" : "bg-[#333]"
                    )}
                    aria-label={settings.enhance ? "Disable enhance prompt" : "Enable enhance prompt"}
                    role="switch"
                    aria-checked={settings.enhance}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                      settings.enhance ? "right-0.5" : "left-0.5"
                    )} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">High Resolution</span>
                    <span className="text-[10px] text-white/40">Generate 2K quality images</span>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, highRes: !s.highRes }))}
                    className={cn(
                      "w-8 h-4 rounded-full transition-colors relative",
                      settings.highRes ? "bg-pictora-yellow" : "bg-[#333]"
                    )}
                    aria-label={settings.highRes ? "Disable high resolution" : "Enable high resolution"}
                    role="switch"
                    aria-checked={settings.highRes}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                      settings.highRes ? "right-0.5" : "left-0.5"
                    )} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <button 
                onClick={() => clearImages()}
                className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Clear Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReferenceModalInput = ({
  title, icon: Icon, thumbnail, onClear, onUpload,
  descriptionText, onDescriptionChange, placeholderText,
}: {
  title: string;
  icon: React.ElementType;
  thumbnail: string | null;
  onClear: () => void;
  onUpload: (url: string) => void;
  descriptionText: string;
  onDescriptionChange: (text: string) => void;
  placeholderText: string;
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isDescribing, setIsDescribing] = React.useState(false);

  const handleDescribe = async () => {
    if (!thumbnail) return;
    const toastId = toast.loading("Analyzing reference image...");
    try {
      toast.dismiss(toastId);
      toast.info("Use AI Describe in the Sidebar for prompt extraction.");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Failed to analyze image.");
    } finally {
      setIsDescribing(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onUpload(result);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const activeColor = title === "Subject" ? "text-pictora-yellow" : title === "Scene" ? "text-sky-400" : "text-emerald-400";

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${activeColor} shrink-0`} />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{title}</span>
      </div>
      <div 
        className={cn(
          "relative group border border-dashed rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden aspect-video min-h-[120px]",
          thumbnail ? "border-transparent bg-white/10" : "border-white/10 bg-black/20 hover:bg-white/5",
          isDragging && "border-white/50 bg-white/5 scale-[0.98]"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-full flex flex-col items-center justify-center"
        >
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          ) : (
            <>
              <span className="text-white/50 uppercase tracking-widest">Upload {title.toLowerCase()}</span>
            </>
          )}
        </button>
        {thumbnail && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10 pointer-events-none rounded-xl">
            <div className="flex gap-2 pointer-events-auto">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDescribe(); }}
                disabled={isDescribing}
                className="w-8 h-8 bg-pictora-yellow hover:bg-yellow-400 disabled:bg-yellow-600 active:scale-90 text-black rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer"
              >
                {isDescribing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClear(); }}
                className="w-8 h-8 bg-red-500 hover:bg-red-600 active:scale-90 text-white rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      <input
        type="text"
        value={descriptionText}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder={placeholderText}
        className="w-full bg-black/40 text-white/90 text-[9px] px-2.5 py-2 rounded-md border border-white/10 hover:border-white/20 focus:border-pictora-yellow focus:outline-none transition-all placeholder:text-white/20 font-sans"
      />
    </div>
  );
};

export const PromptBar = () => {
  const { 
    prompt, setPrompt, generateImages, isGenerating, images, 
    clearImages, aspectRatio, setAspectRatio, showVariations, 
    toggleShowVariations, randomizePrompt, provider, setProvider, 
    comfyUiUrl, setComfyUiUrl,
    comfyUiCheckpoint, setComfyUiCheckpoint,
    comfyUiSteps, setComfyUiSteps,
    comfyUiCfg, setComfyUiCfg,
    comfyUiSampler, setComfyUiSampler,
    comfyUiScheduler, setComfyUiScheduler,
    comfyUiDenoise, setComfyUiDenoise,
    subjectImage, setSubjectImage,
    sceneImage, setSceneImage,
    styleImage, setStyleImage,
    subjectText, setSubjectText,
    sceneText, setSceneText,
    styleText, setStyleText,
    agnesApiUrl, setAgnesApiUrl,
    agnesApiKey, setAgnesApiKey,
    agnesImageModel, setAgnesImageModel,
    agnesTextModel, setAgnesTextModel,
    recentGenerations
  } = useGeneratorStore();
  
  const [isFocused, setIsFocused] = useState(false);
  const [showExpandedTextarea, setShowExpandedTextarea] = useState(false);
  const [isPromptActing, setIsPromptActing] = useState(false);
  const [showReferencesModal, setShowReferencesModal] = useState(false);

  const handleRefine = async () => {
    if (!prompt.trim() || isPromptActing) return;
    setIsPromptActing(true);
    try {
      const { agnesApiKey, agnesTextModel } = useGeneratorStore.getState();
      const data = await agnesFetch(
        "/chat/completions",
        {
          model: agnesTextModel,
          messages: [
            {
              role: "user",
              content: `Enhance this image generation prompt to be more artistic and detailed: "${prompt}". Response should be ONLY the enhanced prompt.`,
            },
          ],
        },
        agnesApiKey
      );
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) setPrompt(text);
    } catch (e: any) {
      console.error("Failed to refine prompt:", e);
      const parsedMessage = parseAgnesError(e);
      toast.error(parsedMessage, { duration: 8000 });
    } finally {
      setIsPromptActing(false);
    }
  };

  const handleRandomize = async () => {
    if (isPromptActing) return;
    setIsPromptActing(true);
    try {
      await randomizePrompt();
    } catch (e: any) {
      console.error("Failed to randomize prompt:", e);
      const parsedMessage = parseAgnesError(e);
      toast.error(parsedMessage, { duration: 8000 });
    } finally {
      setIsPromptActing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateImages();
    }
  };

  return (
    <div className="w-full flex justify-center px-4 pb-6 pt-2 z-20 shrink-0 bg-[#0A0A0A]">
      <div className="flex flex-col gap-3 w-full max-w-[900px]">
        {images.length > 1 && (
           <div className="flex justify-start">
             <button 
              onClick={() => toggleShowVariations()}
              className="bg-pictora-yellow text-black px-5 py-2 rounded-full font-bold text-[9px] tracking-[0.15em] uppercase flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-xl shadow-black/10 active:scale-95 shrink-0"
            >
               <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform", !showVariations && "rotate-180")} /> 
               {showVariations ? "Hide Variations" : "Show Variations"}
             </button>
           </div>
        )}

        {/* Section 1: Quick Style Chips */}
        <div className="px-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-white/60 uppercase tracking-widest px-2 select-none mb-1.5">
            <span>Quick Craft Styles</span>
            <span className="text-[9px] text-white/30 capitalize font-medium">Toggle style constraints</span>
          </div>
          <StyleChips prompt={prompt} setPrompt={setPrompt} isGenerating={isGenerating} />
        </div>

        {/* Section 1.5: References button (opens modal with Subject/Scene/Style inputs) */}
        <div className="px-1">
          <button
            onClick={() => setShowReferencesModal(true)}
            className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            aria-label="Open reference keys modal"
          >
            <User className="w-4 h-4 text-pictora-yellow shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white uppercase tracking-wider">Reference Keys</p>
              <p className="text-[8.5px] text-white/40 truncate">
                {(subjectImage ? "Subject • " : "")}{(sceneImage ? "Scene • " : "")}{(styleImage ? "Style" : "") || "Set Subject / Scene / Style images"}
              </p>
            </div>
            <ChevronRight className="w-3 h-3 text-white/40 shrink-0" />
          </button>
        </div>

        {/* References Modal */}
        {showReferencesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <button
              onClick={() => setShowReferencesModal(false)}
              className="absolute inset-0 z-0"
              aria-label="Close references modal"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#131313] border border-white/10 rounded-3xl shadow-2xl p-6 w-full max-w-2xl z-10"
              role="dialog"
              aria-modal="true"
              aria-label="Reference Keys"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-pictora-yellow" />
                  Reference Keys
                </h3>
                <button
                  onClick={() => setShowReferencesModal(false)}
                  className="p-1.5 text-white/40 hover:text-white rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-white/50 mb-6">
                Upload reference images and describe them. These guide image generation consistency across scenes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReferenceModalInput
                  title="Subject"
                  icon={User}
                  thumbnail={subjectImage}
                  onClear={() => setSubjectImage(null)}
                  onUpload={(url) => setSubjectImage(url)}
                  descriptionText={subjectText}
                  onDescriptionChange={setSubjectText}
                  placeholderText="e.g., detective in trench coat"
                />
                <ReferenceModalInput
                  title="Scene"
                  icon={MapPin}
                  thumbnail={sceneImage}
                  onClear={() => setSceneImage(null)}
                  onUpload={(url) => setSceneImage(url)}
                  descriptionText={sceneText}
                  onDescriptionChange={setSceneText}
                  placeholderText="e.g., rainy cyberpunk alley"
                />
                <ReferenceModalInput
                  title="Style"
                  icon={PenTool}
                  thumbnail={styleImage}
                  onClear={() => setStyleImage(null)}
                  onUpload={(url) => setStyleImage(url)}
                  descriptionText={styleText}
                  onDescriptionChange={setStyleText}
                  placeholderText="e.g., neon noir photography"
                />
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Section 2: Main Prompt Input + Primary Actions */}
        <div 
          className={cn(
            "bg-[#111111] backdrop-blur-md rounded-3xl shadow-2xl shadow-black/50 flex flex-col p-2 transition-all duration-300 border border-white/5",
            isFocused && "ring-2 ring-pictora-yellow/50"
          )}
        >
          {/* Row 1: Prompt Input (Primary Focus) */}
          <div className="flex items-start px-5 py-4 border-b border-white/10 relative">
            <button 
              onClick={handleRefine}
              disabled={!prompt.trim() || isGenerating || isPromptActing}
              className={cn(
                "mr-2 p-2.5 hover:bg-white/5 rounded-2xl text-pictora-yellow transition-all disabled:opacity-30 active:scale-90 shrink-0",
                isPromptActing && "animate-pulse"
              )}
              title="Refine Prompt with AI"
              aria-label="Refine prompt with AI"
            >
              <Sparkles className="w-6 h-6 fill-current" aria-hidden="true" />
            </button>

            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your idea or roll the dice for prompt ideas"
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-[16px] font-medium font-['Arial'] tracking-tight px-2 py-3 focus:ring-0 resize-none min-h-[64px] max-h-[200px] overflow-y-auto w-full leading-relaxed"
              disabled={isGenerating || isPromptActing}
              rows={1}
              aria-label="Image generation prompt"
            />
            
            <button 
              onClick={() => setShowExpandedTextarea(true)}
              className="absolute top-4 right-4 p-1 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              title="Expand Textarea"
              aria-label="Expand prompt editor"
            >
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
              {showExpandedTextarea && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-6 flex flex-col gap-4 mx-auto pointer-events-auto"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-white/70 font-bold text-sm tracking-widest uppercase">Expanded Prompt Editor</h3>
                      <button onClick={() => setShowExpandedTextarea(false)} className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Close expanded editor">
                        <X className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                    
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Paste or type your highly detailed prompt here..."
                      className="w-full h-[40vh] bg-black/30 border border-white/10 rounded-2xl text-white placeholder:text-white/30 p-4 focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 resize-none font-medium text-lg leading-relaxed shadow-inner"
                      autoFocus
                      aria-label="Expanded prompt editor"
                    />
                    
                    <div className="flex justify-end pt-2">
                       <button 
                        onClick={() => {
                          setShowExpandedTextarea(false);
                          if (prompt.trim()) {
                            generateImages();
                          }
                        }}
                        className="px-6 py-3 bg-pictora-yellow text-black hover:bg-yellow-400 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg shadow-black/20"
                      >
                        OK & Generate <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* Row 2: Controls + Primary Action */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 rounded-b-3xl">
            <div className="flex items-center gap-1" role="group" aria-label="Generation controls">
              <AspectRatioPicker aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} isGenerating={isGenerating} />
              <StylePicker prompt={prompt} setPrompt={setPrompt} isGenerating={isGenerating} />
              
              <button 
                type="button"
                onClick={handleRandomize}
                disabled={isPromptActing || isGenerating}
                className={cn(
                  "p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors",
                  isPromptActing && "animate-pulse",
                  isGenerating && "opacity-50 cursor-not-allowed"
                )}
                title="AI Random Prompt"
                aria-label="Generate random prompt with AI"
              >
                <Dice5 className="w-[16px] h-[16px]" aria-hidden="true" />
              </button>

              <button 
                type="button"
                onClick={() => setPrompt("")}
                disabled={isPromptActing || isGenerating || !prompt}
                className={cn(
                  "p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-colors disabled:opacity-50"
                )}
                title="Clear Prompt"
                aria-label="Clear prompt"
              >
                <Eraser className="w-[16px] h-[16px]" aria-hidden="true" />
              </button>
              
              <AdvancedSettings
                provider={provider} setProvider={setProvider}
                comfyUiUrl={comfyUiUrl} setComfyUiUrl={setComfyUiUrl}
                agnesApiUrl={agnesApiUrl} setAgnesApiUrl={setAgnesApiUrl}
                agnesApiKey={agnesApiKey} setAgnesApiKey={setAgnesApiKey}
                agnesImageModel={agnesImageModel} setAgnesImageModel={setAgnesImageModel}
                agnesTextModel={agnesTextModel} setAgnesTextModel={setAgnesTextModel}
                comfyUiCheckpoint={comfyUiCheckpoint} setComfyUiCheckpoint={setComfyUiCheckpoint}
                comfyUiSteps={comfyUiSteps} setComfyUiSteps={setComfyUiSteps}
                comfyUiCfg={comfyUiCfg} setComfyUiCfg={setComfyUiCfg}
                comfyUiSampler={comfyUiSampler} setComfyUiSampler={setComfyUiSampler}
                comfyUiScheduler={comfyUiScheduler} setComfyUiScheduler={setComfyUiScheduler}
                comfyUiDenoise={comfyUiDenoise} setComfyUiDenoise={setComfyUiDenoise}
                subjectImage={subjectImage}
                clearImages={clearImages}
                images={images}
              />
            </div>

            <div className="flex items-center gap-3">
              <QuotaIndicator provider={provider} agnesApiKey={agnesApiKey} recentGenerations={recentGenerations} />
              <button 
                type="button"
                onClick={() => generateImages()}
                disabled={isGenerating || !prompt.trim()}
                className={cn(
                  "px-6 h-9 bg-pictora-yellow rounded-xl flex items-center justify-center text-black hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/20 active:scale-95 gap-2"
                )}
                aria-busy={isGenerating}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                  {images.length > 0 ? "Variation" : "Generate"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};