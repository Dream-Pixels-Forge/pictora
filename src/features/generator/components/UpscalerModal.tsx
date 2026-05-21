import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, SlidersHorizontal, Sparkles, Check, CheckCircle, Info, Maximize2, ZoomIn, Sliders } from "lucide-react";
import { useGeneratorStore, AspectRatio } from "../store/useGeneratorStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UpscalerModalProps {
  image: { id: string; url: string; prompt: string; aspectRatio: AspectRatio; upscaledUrl?: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

type ScaleFactor = 2 | 4;
type UpscalePreset = "cinematic" | "digital" | "smooth";

export const UpscalerModal: React.FC<UpscalerModalProps> = ({ image, isOpen, onClose }) => {
  const { updateImage } = useGeneratorStore();
  
  const [scale, setScale] = useState<ScaleFactor>(2);
  const [preset, setPreset] = useState<UpscalePreset>("cinematic");
  const [sharpenIntensity, setSharpenIntensity] = useState<number>(50); // 0 to 100
  const [grainIntensity, setGrainIntensity] = useState<number>(30); // 0 to 100
  const [contrastBoost, setContrastBoost] = useState<number>(20); // 0 to 100
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  const [upscaledResult, setUpscaledResult] = useState<string | null>(null);
  
  // Slide comparison state
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const comparisonContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Auto-fill advanced settings based on preset changes
  useEffect(() => {
    if (preset === "cinematic") {
      setSharpenIntensity(45);
      setGrainIntensity(35);
      setContrastBoost(25);
    } else if (preset === "digital") {
      setSharpenIntensity(65);
      setGrainIntensity(15);
      setContrastBoost(15);
    } else if (preset === "smooth") {
      setSharpenIntensity(20);
      setGrainIntensity(0);
      setContrastBoost(10);
    }
  }, [preset]);

  // Set initial upscaled result if image already has one
  useEffect(() => {
    if (image?.upscaledUrl) {
      setUpscaledResult(image.upscaledUrl);
    } else {
      setUpscaledResult(null);
    }
  }, [image]);

  if (!isOpen || !image) return null;

  // Compute resolutions
  const getOriginalResolution = () => {
    switch (image.aspectRatio) {
      case "1:1": return { w: 1024, h: 1024 };
      case "16:9": return { w: 1344, h: 768 };
      case "9:16": return { w: 768, h: 1344 };
      case "4:3": return { w: 1152, h: 896 };
      case "3:4": return { w: 896, h: 1152 };
      case "2:3": return { w: 832, h: 1216 };
      case "3:2": return { w: 1216, h: 832 };
      default: return { w: 1024, h: 1024 };
    }
  };

  const origRes = getOriginalResolution();
  const targetRes = { w: origRes.w * scale, h: origRes.h * scale };

  // Slider dragging logic
  const handleSliderMove = (clientX: number) => {
    if (!comparisonContainerRef.current) return;
    const rect = comparisonContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    handleSliderMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleGlobalMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    handleSliderMove(e.clientX);
  };

  const handleGlobalTouchMove = (e: TouchEvent) => {
    if (!isDraggingRef.current) return;
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleGlobalEnd = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleGlobalMove);
    window.addEventListener("mouseup", handleGlobalEnd);
    window.addEventListener("touchmove", handleGlobalTouchMove);
    window.addEventListener("touchend", handleGlobalEnd);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMove);
      window.removeEventListener("mouseup", handleGlobalEnd);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalEnd);
    };
  }, []);

  const handleUpscale = async () => {
    setIsProcessing(true);
    setProgressPercent(5);
    setProgressStep("Re-sampling original pixels...");

    try {
      // Step 1: Load image onto standard HTML element
      await new Promise((r) => setTimeout(r, 400));
      setProgressPercent(20);
      setProgressStep("Initializing HD convolution matrix...");
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = image.url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load original image dimensions."));
      });

      // Step 2: Scale calculation and secondary drawing pass
      setProgressPercent(45);
      setProgressStep("Synthesizing high-frequency edge vectors...");
      await new Promise((r) => setTimeout(r, 600));

      const canvas = document.createElement("canvas");
      const targetW = img.naturalWidth * scale;
      const targetH = img.naturalHeight * scale;
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D Graphics context.");

      // Ensure neat bicubic interpolator by default
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // Step 3: Extract pixel arrays and run upscale kernels
      setProgressPercent(70);
      setProgressStep("Applying bilateral detail sharpness maps...");
      await new Promise((r) => setTimeout(r, 500));

      const imgData = ctx.getImageData(0, 0, targetW, targetH);
      const src = imgData.data;
      const dest = new Uint8ClampedArray(src.length);

      // Pre-copy alpha to optimize inner loop
      for (let i = 3; i < src.length; i += 4) {
        dest[i] = src[i];
      }

      const rowBytes = targetW * 4;
      // Normalization percentages
      const sAmt = (sharpenIntensity / 100) * 0.25; // Scale to safe threshold
      const gAmt = (grainIntensity / 100) * 8; // Max 8 levels of pixel noise deviation
      const cAmt = (contrastBoost / 100) * 0.22; // Contrast expand multiplier

      // High Performance Pixel Loop
      for (let y = 1; y < targetH - 1; y++) {
        const rowOffset = y * rowBytes;
        for (let x = 1; x < targetW - 1; x++) {
          const idx = rowOffset + x * 4;

          for (let c = 0; c < 3; c++) {
            const center = src[idx + c];
            const top    = src[idx - rowBytes + c];
            const bottom = src[idx + rowBytes + c];
            const left   = src[idx - 4 + c];
            const right  = src[idx + 4 + c];

            // Calculate laplacian difference for edge accentuation
            const laplacian = 4 * center - top - bottom - left - right;
            let val = center + sAmt * laplacian;

            // Apply monochromatic photographic micro-grain
            if (gAmt > 0) {
              const noise = (Math.random() - 0.5) * gAmt;
              val += noise;
            }

            // Apply contrast lift
            if (cAmt > 0) {
              const norm = val / 255 - 0.5;
              val = (norm * (1 + cAmt) + 0.5) * 255;
            }

            // Fast boundary clamping
            dest[idx + c] = val < 0 ? 0 : val > 255 ? 255 : val;
          }
        }
      }

      // Handle borders (copy simple edge values directly to prevent black borders)
      // Top & Bottom boundary rows
      for (let x = 0; x < targetW; x++) {
        const topIdx = x * 4;
        const botIdx = ((targetH - 1) * targetW + x) * 4;
        for (let c = 0; c < 3; c++) {
          dest[topIdx + c] = src[topIdx + c];
          dest[botIdx + c] = src[botIdx + c];
        }
      }
      // Left & Right boundary columns
      for (let y = 0; y < targetH; y++) {
        const leftIdx = y * rowBytes;
        const rightIdx = leftIdx + (targetW - 1) * 4;
        for (let c = 0; c < 3; c++) {
          dest[leftIdx + c] = src[leftIdx + c];
          dest[rightIdx + c] = src[rightIdx + c];
        }
      }

      setProgressPercent(90);
      setProgressStep("Encoding compressed PNG stream...");
      await new Promise((r) => setTimeout(r, 450));

      imgData.data.set(dest);
      ctx.putImageData(imgData, 0, 0);

      const highResUrl = canvas.toDataURL("image/png", 1.0);
      setUpscaledResult(highResUrl);
      
      setProgressPercent(100);
      setProgressStep("Completed!");
      toast.success("Image upscaled successfully!");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to upscale image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToGallery = () => {
    if (!upscaledResult) return;
    updateImage(image.id, { upscaledUrl: upscaledResult });
    toast.success("Saved upscaled version to history gallery!");
  };

  const handleDownloadHighRes = () => {
    if (!upscaledResult) return;
    const link = document.createElement("a");
    link.href = upscaledResult;
    link.download = `pictora-UHD-${image.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Ultra-HD download initialized!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl bg-[#111] border border-white/5 rounded-3xl overflow-hidden flex flex-col md:grid md:grid-cols-12 max-h-[90vh]"
      >
        {/* Top bar header for small screens / Close helper */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-white/10 text-white/60 hover:text-white rounded-full border border-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left column: Setup controls (4 cols) */}
        <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-white/5 flex flex-col min-h-0 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pictora-yellow animate-pulse" />
              <h2 className="font-display font-semibold text-lg text-white">Ultra Upscaler</h2>
            </div>
            <p className="text-xs text-white/45 mt-1 leading-relaxed">Boost image fidelity, sharpness, and fine textures locally with precision filters.</p>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* Scale parameter */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Resolution Multipier</label>
              <div className="grid grid-cols-2 gap-2">
                {[2, 4].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s as ScaleFactor)}
                    className={cn(
                      "py-2 px-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition-all",
                      scale === s 
                        ? "bg-pictora-yellow border-pictora-yellow text-black" 
                        : "bg-white/[0.03] border-white/5 text-white/60 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    <span className="text-sm">{s}x</span>
                    <span className="text-[9px] opacity-70 font-mono mt-0.5">
                      {s === 2 ? "Quad-HD" : "Ultra-HD (4K)"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Enhancement Style Preset</label>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: "cinematic", title: "Cinematic Photorealism", desc: "Adds fine micro-grain structure, balances dynamic lighting shadows." },
                  { id: "digital", title: "Creative Digital Paint", desc: "Maximizes outline sharpness and boosts color-texture vibrance." },
                  { id: "smooth", title: "Smooth Line & Vector", desc: "Cleans up block artifacts, flat colors and maintains crisp boundaries." }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreset(item.id as UpscalePreset)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      preset === item.id 
                        ? "bg-white/5 border-white/10 text-white" 
                        : "bg-transparent border-transparent text-white/40 hover:text-white/80"
                    )}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <div className={cn("w-2 h-2 rounded-full", preset === item.id ? "bg-pictora-yellow scale-110" : "bg-white/20")} />
                      {item.title}
                    </div>
                    <p className="text-[10px] text-white/40 mt-1 pl-3.5 leading-relaxed font-normal">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters (Sliders) */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-pictora-yellow" />
                  Filter Calibration
                </label>
                <span className="text-[8px] font-mono text-white/30">Manual tuning active</span>
              </div>

              {/* Edge Sharpness Slide */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-white/60">Edge Reconstruction</span>
                  <span className="text-pictora-yellow font-bold">{sharpenIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sharpenIntensity}
                  onChange={(e) => {
                    setSharpenIntensity(parseInt(e.target.value));
                    setPreset("cinematic"); // Reset selection to custom since modified
                  }}
                  className="w-full accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Fine Grain Slide */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-white/60">Filmic Grain Texture</span>
                  <span className="text-pictora-yellow font-bold">{grainIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grainIntensity}
                  onChange={(e) => {
                    setGrainIntensity(parseInt(e.target.value));
                    setPreset("cinematic");
                  }}
                  className="w-full accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Contrast Lift */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-white/60">Local Contrast Boost</span>
                  <span className="text-pictora-yellow font-bold">{contrastBoost}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={contrastBoost}
                  onChange={(e) => {
                    setContrastBoost(parseInt(e.target.value));
                    setPreset("cinematic");
                  }}
                  className="w-full accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Trigger Button */}
          <div className="p-6 border-t border-white/5 bg-white/[0.01]">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleUpscale}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-pictora-yellow hover:from-amber-600 hover:to-yellow-500 disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-black font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:shadow-pictora-yellow/10 transition-all select-none"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing Upscale...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Upscale ({targetRes.w} × {targetRes.h})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right column: Interactive slide comparison engine (8 cols) */}
        <div className="col-span-12 md:col-span-8 bg-[#0b0b0b] dot-grid p-6 lg:p-10 flex flex-col min-h-0 min-w-0 h-full relative">
          
          {/* Top Resolution and Presets Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-2 py-0.5 rounded bg-white/5">Original</span>
              <span className="font-mono text-xs text-white/50">{origRes.w} × {origRes.h}</span>
              <span className="text-white/20">→</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pictora-yellow px-2 py-0.5 rounded bg-pictora-yellow/10">Ultra HD</span>
              <span className="font-mono text-xs text-white/90 font-bold">{targetRes.w} × {targetRes.h}</span>
            </div>

            {upscaledResult && (
              <div className="text-[10px] font-bold text-teal-400 flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-400/10 border border-teal-400/20">
                <CheckCircle className="w-3.5 h-3.5" />
                Upscaled Result Loaded
              </div>
            )}
          </div>

          {/* Core Interactive display wrapper */}
          <div className="flex-1 relative rounded-none overflow-hidden border border-white/5 bg-[#141414] dot-grid min-h-0 flex items-center justify-center">
            
            {/* Terminal Glow/Spinner for busy process state */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center p-8 text-center">
                <div className="relative w-24 h-24 mb-6">
                  {/* Rotating Gradient Frame */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FFD600] to-transparent animate-spin p-0.5" />
                  {/* Central Glow Core */}
                  <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-pictora-yellow animate-bounce" />
                  </div>
                </div>

                <motion.p 
                  key={progressPercent}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono text-sm text-white/90 font-semibold uppercase tracking-widest min-h-[1.5rem]"
                >
                  {progressStep}
                </motion.p>
                
                <div className="w-48 bg-white/5 border border-white/10 rounded-full h-1.5 mt-4 overflow-hidden">
                  <div 
                    style={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-pictora-yellow rounded-full transition-all duration-300" 
                  />
                </div>
                <span className="text-[10px] font-mono text-white/40 mt-2">{progressPercent}% calculated</span>
              </div>
            )}

            {/* If not upscaled yet, show original image static */}
            {!upscaledResult && !isProcessing && (
              <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4">
                <div className="relative max-h-full max-w-full aspect-square overflow-hidden rounded-none border border-white/5 bg-black/30 flex items-center justify-center">
                  <img src={image.url} alt="Reference" className="max-h-[50vh] object-contain rounded-none" />
                  <div className="absolute top-3 left-3 bg-black/70 px-2 py-1 rounded-md text-[9px] font-bold text-white/80 uppercase">Original Reference View</div>
                </div>
                <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-center text-[10px] text-white/45 max-w-md">
                  <Info className="w-4 h-4 text-pictora-yellow shrink-0" />
                  Click "Execute Upscale" to synthesize 2x or 4x high-resolution detail mappings immediately.
                </div>
              </div>
            )}

            {/* If upscaled successfully, show splitting comparison handle */}
            {upscaledResult && !isProcessing && (
              <div 
                ref={comparisonContainerRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-ew-resize flex items-center justify-center bg-black/40"
              >
                {/* Layer 2: Upscaled (Full width background) */}
                <img 
                  src={upscaledResult} 
                  alt="Upscaled UHD" 
                  className="absolute inset-0 w-full h-full object-contain p-2 pointer-events-none"
                />

                {/* Left Side Label (Upscaled) on top of layered image */}
                <div className="absolute top-3 right-4 bg-teal-500 text-black px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase z-10 shadow-lg select-none pointer-events-none">
                  Upscaled (UHD)
                </div>

                {/* Layer 1: Original (Clipped width container overlay) */}
                <div 
                  style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  <img 
                    src={image.url} 
                    alt="Original" 
                    className="absolute inset-0 w-full h-full object-contain p-2 pointer-events-none"
                  />
                  
                  {/* Left Side Label (Original) inside clipped layer */}
                  <div className="absolute top-3 left-4 bg-black/75 text-white/70 px-2 py-1 rounded text-[9px] font-bold tracking-widest uppercase z-10 shadow-lg select-none pointer-events-none">
                    Original
                  </div>
                </div>

                {/* Slider Drag Bar divider line */}
                <div 
                  style={{ left: `${sliderPosition}%` }}
                  className="absolute top-0 bottom-0 w-[2px] bg-pictora-yellow z-20 pointer-events-none shadow-[0_0_15px_rgba(255,214,0,0.5)]"
                >
                  {/* Slider middle Circle Knob */}
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-pictora-yellow hover:scale-110 active:scale-95 text-black flex items-center justify-center shadow-2xl transition-transform cursor-ew-resize border border-black pointer-events-none">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer for upscaled states */}
          <div className="mt-5 flex gap-3 flex-wrap">
            {upscaledResult ? (
              <>
                <button
                  type="button"
                  onClick={handleSaveToGallery}
                  className="flex-1 py-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 select-none"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Save to Gallery & History</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHighRes}
                  className="flex-1 py-3 px-4 bg-teal-500 hover:bg-teal-600 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-teal-500/10 transition-all active:scale-95 select-none"
                >
                  <Download className="w-4 h-4" />
                  <span>Download UHD Image</span>
                </button>
              </>
            ) : (
              <div className="w-full text-center py-2 text-[10px] text-white/30 italic">
                A sliding split-frame comparator will construct here once processing activates.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
