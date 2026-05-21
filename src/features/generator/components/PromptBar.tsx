import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Dice5, SlidersHorizontal, ArrowRight, Square, Sparkles, ChevronLeft, Eraser, Palette, Maximize2, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { useGeneratorStore, AspectRatio } from "../store/useGeneratorStore";
import { cn } from "@/lib/utils";

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

const GEMINI_MODELS = [
  { label: "Gemini 2.5 Flash Image", value: "gemini-2.5-flash-image" },
  { label: "Gemini 3.1 Flash Image (Preview)", value: "gemini-3.1-flash-image-preview" },
  { label: "Gemini 3 Pro Image (Preview)", value: "gemini-3-pro-image-preview" },
  { label: "Imagen 4.0 Generate", value: "imagen-4.0-generate-001" },
  { label: "Imagen 3.0 Generate", value: "imagen-3.0-generate-001" },
  { label: "Imagen 3.0 Fast", value: "imagen-3.0-fast-001" },
];

export const PromptBar = () => {
  const { 
    prompt, setPrompt, generateImages, isGenerating, images, 
    clearImages, aspectRatio, setAspectRatio, showVariations, 
    toggleShowVariations, randomizePrompt, provider, setProvider, 
    comfyUiUrl, setComfyUiUrl, geminiApiKey, setGeminiApiKey, 
    geminiModel, setGeminiModel,
    comfyUiCheckpoint, setComfyUiCheckpoint,
    comfyUiSteps, setComfyUiSteps,
    comfyUiCfg, setComfyUiCfg,
    comfyUiSampler, setComfyUiSampler,
    comfyUiScheduler, setComfyUiScheduler,
    comfyUiDenoise, setComfyUiDenoise,
    subjectImage
  } = useGeneratorStore();
  
  const [isFocused, setIsFocused] = useState(false);
  const [showRatios, setShowRatios] = useState(false);
  const [showStyles, setShowStyles] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExpandedTextarea, setShowExpandedTextarea] = useState(false);
  const [isPromptActing, setIsPromptActing] = useState(false);
  const [settings, setSettings] = useState({
    enhance: true,
    highRes: false,
    creative: true
  });

  const handleRefine = async () => {
    if (!prompt.trim() || isPromptActing) return;
    setIsPromptActing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey || process.env.GEMINI_API_KEY || '' });
      const result = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Enhance this image generation prompt to be more artistic and detailed: "${prompt}". Response should be ONLY the enhanced prompt.`
      });
      const text = result.text?.trim();
      if (text) setPrompt(text);
    } catch (e: any) {
      console.error("Failed to refine prompt:", e);
      if (e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED")) {
        alert("API Quota exceeded. Please try again later or add your own API key in Settings.");
      }
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
      if (e.message?.includes("429") || e.message?.includes("RESOURCE_EXHAUSTED")) {
        alert("API Quota exceeded. Please try again later or add your own API key in Settings.");
      }
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
              title="Refine Prompt"
            >
              <Sparkles className="w-6 h-6 fill-current" />
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
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-[16px] font-medium font-['Arial'] tracking-tight px-2 py-2 focus:ring-0 resize-none min-h-[44px] max-h-[150px] overflow-y-auto w-full leading-relaxed"
              disabled={isGenerating || isPromptActing}
              rows={1}
            />
            
            <button 
              onClick={() => setShowExpandedTextarea(true)}
              className="absolute top-4 right-4 p-1 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              title="Expand Textarea"
            >
              <Maximize2 className="w-4 h-4" />
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
                      <button onClick={() => setShowExpandedTextarea(false)} className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Paste or type your highly detailed prompt here..."
                      className="w-full h-[40vh] bg-black/30 border border-white/10 rounded-2xl text-white placeholder:text-white/30 p-4 focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 resize-none font-medium text-lg leading-relaxed shadow-inner"
                      autoFocus
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
                        OK & Generate <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* Row 2: Secondary Controls & Primary Action */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 rounded-b-3xl">
            <div className="flex items-center gap-1">
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowRatios(!showRatios);
                    setShowStyles(false);
                  }}
                  className={cn(
                    "px-3 py-1.5 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2",
                    showRatios ? "text-white bg-white/10" : "text-gray-400"
                  )}
                  title="Aspect Ratio"
                >
                  <Square className="w-[14px] h-[14px]" />
                  <span className="text-[10px] font-bold tracking-tight">{aspectRatio}</span>
                </button>
                
                <AnimatePresence>
                  {showRatios && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full mb-4 left-0 bg-[#1A1A1A] text-white rounded-2xl shadow-2xl border border-white/10 p-2 grid grid-cols-3 gap-1 min-w-[240px] z-50"
                    >
                      {ASPECT_RATIOS.map((ratio) => (
                        <button
                          key={ratio.value}
                          onClick={() => {
                            setAspectRatio(ratio.value);
                            setShowRatios(false);
                          }}
                          className={cn(
                            "px-3 py-2 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-1 hover:bg-white/10",
                            aspectRatio === ratio.value ? "bg-pictora-yellow text-black" : "text-gray-400"
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
                          )} />
                          {ratio.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button 
                  onClick={() => {
                    setShowStyles(!showStyles);
                    setShowRatios(false);
                  }}
                  className={cn(
                    "px-3 py-1.5 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2",
                    showStyles ? "text-white bg-white/10" : "text-gray-400"
                  )}
                  title="Style Injection"
                >
                  <Palette className="w-[14px] h-[14px]" />
                  <span className="text-[10px] font-bold tracking-tight">Styles</span>
                </button>
                
                <AnimatePresence>
                  {showStyles && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full mb-4 left-0 bg-[#1A1A1A] text-white rounded-2xl shadow-2xl border border-white/10 p-2 grid grid-cols-2 gap-1 min-w-[280px] z-50 origin-bottom-left"
                    >
                      {STYLES.map((style) => (
                        <button
                          key={style.label}
                          onClick={() => {
                            const newPrompt = prompt.trim() 
                              ? `${prompt.trim()}, ${style.value}`
                              : style.value;
                            setPrompt(newPrompt);
                            setShowStyles(false);
                          }}
                          className={cn(
                            "px-3 py-2 rounded-xl text-[10px] font-bold transition-all text-left hover:bg-white/10 text-gray-400 hover:text-white"
                          )}
                        >
                          {style.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => handleRandomize()}
                disabled={isPromptActing}
                className={cn(
                  "p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors",
                  isPromptActing && "animate-pulse"
                )}
                title="AI Random Prompt"
              >
                <Dice5 className="w-[16px] h-[16px]" />
              </button>

              <button 
                onClick={() => setPrompt("")}
                disabled={isPromptActing || !prompt}
                className={cn(
                  "p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                )}
                title="Clear Prompt"
              >
                <Eraser className="w-[16px] h-[16px]" />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn(
                    "p-2 hover:bg-white/10 rounded-xl transition-colors",
                    showSettings ? "text-white bg-white/10" : "text-gray-400"
                  )}
                  title="Advanced Settings"
                >
                  <SlidersHorizontal className="w-[16px] h-[16px]" />
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full mb-4 left-0 bg-[#1A1A1A] text-white rounded-2xl shadow-2xl border border-white/10 p-4 min-w-[320px] z-50 text-left"
                    >
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Advanced Settings</p>
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Model Provider</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setProvider('gemini')}
                              className={cn(
                                "flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                                provider === 'gemini' ? "bg-pictora-yellow border-transparent text-black" : "bg-[#222] border-white/10 text-gray-400"
                              )}
                            >
                              Gemini
                            </button>
                            <button 
                              onClick={() => setProvider('comfyui')}
                              className={cn(
                                "flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                                provider === 'comfyui' ? "bg-pictora-yellow border-transparent text-black" : "bg-[#222] border-white/10 text-gray-400"
                              )}
                            >
                              ComfyUI
                            </button>
                          </div>
                        </div>

                        {provider === 'gemini' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Model Selection</span>
                              <select 
                                value={GEMINI_MODELS.some(m => m.value === geminiModel) ? geminiModel : "custom"}
                                onChange={(e) => {
                                  if (e.target.value !== "custom") {
                                    setGeminiModel(e.target.value);
                                  } else {
                                    setGeminiModel("");
                                  }
                                }}
                                className="w-full px-3 py-2 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 text-white"
                              >
                                {GEMINI_MODELS.map(m => (
                                  <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                                <option value="custom">Custom ID...</option>
                               </select>

                              {(geminiModel === "" || !GEMINI_MODELS.some(m => m.value === geminiModel)) && (
                                <input 
                                  type="text"
                                  value={geminiModel}
                                  onChange={(e) => setGeminiModel(e.target.value)}
                                  className="w-full px-3 py-2 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50 mt-2"
                                  placeholder="Enter custom model ID (e.g. imagen-3.0-generate-001)"
                                />
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">API Key (Optional)</span>
                                <a 
                                  href="https://aistudio.google.com/app/apikey" 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10px] text-pictora-yellow hover:underline flex items-center gap-1"
                                >
                                  Get Key <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                              <input 
                                type="password"
                                value={geminiApiKey}
                                onChange={(e) => setGeminiApiKey(e.target.value)}
                                className="w-full px-3 py-2 bg-[#222] border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pictora-yellow/50"
                                placeholder={process.env.GEMINI_API_KEY ? "Using system key" : "Paste your API key here"}
                              />
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
            </div>

            <div className="flex items-center gap-3">
              <QuotaIndicator />
              <button 
                onClick={() => generateImages()}
                disabled={isGenerating || !prompt.trim()}
                className={cn(
                  "px-6 h-9 bg-pictora-yellow rounded-xl flex items-center justify-center text-black hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/20 active:scale-95 gap-2"
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                  {images.length > 0 ? "Variation" : "Generate"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuotaIndicator = () => {
  const { recentGenerations, geminiApiKey, provider } = useGeneratorStore();
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  if (provider !== 'gemini') return null;

  const count = recentGenerations.filter(t => now - t < 60000).length;
  const hasKey = !!geminiApiKey;
  
  // Imagen 3 free tier is roughly 2/min. 
  // We'll show a warning if getting close.
  let colorClass = "text-green-500/60";
  let statusText = "Ready";

  if (count >= 2 && !hasKey) {
    colorClass = "text-red-500 animate-pulse";
    statusText = "Quota Near";
  } else if (count >= 1 && !hasKey) {
    colorClass = "text-yellow-500";
    statusText = "Used 1/2";
  }

  return (
    <div className="flex flex-col items-end gap-0.5 pr-1">
      <div className="flex items-center gap-1.5">
        <span className={cn("text-[8px] font-bold uppercase tracking-widest transition-colors", colorClass)}>
          {hasKey ? "Key Active" : statusText}
        </span>
        <div className="flex gap-0.5">
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
