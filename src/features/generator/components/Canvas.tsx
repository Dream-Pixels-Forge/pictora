import React, { useMemo, useLayoutEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, User, MapPin, PenTool, Trash2, RefreshCw, Crop, Clock, Sparkles, Brush, Sliders } from "lucide-react";
import { useGeneratorStore, AspectRatio } from "../store/useGeneratorStore";
import { cn } from "@/lib/utils";
import { UpscalerModal } from "./UpscalerModal";
import { ImageEditorModal } from "./ImageEditorModal";

const getAspectRatioClass = (ratio: AspectRatio) => {
  switch (ratio) {
    case "1:1": return "aspect-square";
    case "16:9": return "aspect-video";
    case "9:16": return "aspect-[9/16]";
    case "4:3": return "aspect-[4/3]";
    case "3:4": return "aspect-[3/4]";
    case "16:10": return "aspect-[16/10]";
    case "2:3": return "aspect-[2/3]";
    case "3:2": return "aspect-[3/2]";
    case "4:5": return "aspect-[4/5]";
    default: return "aspect-square";
  }
};

const SUGGESTED_PROMPTS = [
  { text: "Ethereal crystal forest, bioluminescent mushrooms, cinematic lighting", category: "Fantasy" },
  { text: "Cyberpunk street market, neon signs, rainy night, cinematic 4k", category: "Vibe" },
  { text: "Minimalist desk setup, soft natural light, architectural photography", category: "Design" },
  { text: "Surreal portrait of a robot with flowers growing from its head", category: "Art" },
];

const ASPECT_RATIOS: Record<AspectRatio, number> = {
  "1:1": 1,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "16:10": 16 / 10,
  "2:3": 2 / 3,
  "3:2": 3 / 2,
  "4:5": 0.8,
};

const AspectBox = ({ children, aspectRatioValue }: { children: React.ReactNode, aspectRatioValue: number }) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { width: containerWidth, height: containerHeight } = size;

  let style: React.CSSProperties = {};

  if (containerWidth > 0 && containerHeight > 0) {
    const containerRatio = containerWidth / containerHeight;
    if (containerRatio > aspectRatioValue) {
      // Height is the limit, width scales down to fit perfectly
      style = {
        height: `${containerHeight}px`,
        width: `${containerHeight * aspectRatioValue}px`,
      };
    } else {
      // Width is the limit, height scales down to fit perfectly
      style = {
        width: `${containerWidth}px`,
        height: `${containerWidth / aspectRatioValue}px`,
      };
    }
  }

  return (
    <div ref={ref} className="w-full h-full flex items-center justify-center min-h-0 min-w-0 relative">
      <div 
        style={style}
        className="relative transition-all duration-300 shadow-2xl rounded-none border border-white/10 overflow-hidden flex items-center justify-center"
      >
        {children}
      </div>
    </div>
  );
};

export const Canvas = () => {
  const { images, isGenerating, aspectRatio, showVariations, setPrompt, generateImages } = useGeneratorStore();
  const [upscaleTarget, setUpscaleTarget] = useState<any>(null);
  const [isUpscaleOpen, setIsUpscaleOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleOpenUpscaler = (img: any) => {
    setUpscaleTarget(img);
    setIsUpscaleOpen(true);
  };

  const handleOpenEditor = (img: any) => {
    setEditTarget(img);
    setIsEditOpen(true);
  };

  const mainImages = useMemo(() => {
    if (isGenerating) {
      return showVariations ? [null, ...images.slice(0, 1)] : [null];
    }
    return showVariations ? images.slice(0, 2) : images.slice(0, 1);
  }, [images, isGenerating, showVariations]);

  const hasAtLeastOneImage = mainImages.length > 0;

  const ratioValue = ASPECT_RATIOS[aspectRatio] || 1;

  if (!hasAtLeastOneImage) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-pictora-bg dot-grid relative flex flex-col items-center justify-center p-6 md:p-12">
        <div className="max-w-4xl w-full flex flex-col items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full aspect-[2/1] border border-white/5 rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group"
          >
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,214,0,0.1),transparent)]" />
             <p className="text-white/10 font-display font-bold text-4xl md:text-7xl uppercase tracking-[0.2em] select-none group-hover:text-pictora-yellow/10 transition-colors duration-700">Imagine</p>
             <p className="text-white/20 text-xs md:text-sm font-medium tracking-[0.5em] mt-2 uppercase">Create anything you can dream</p>
          </motion.div>

          <div className="w-full space-y-6">
            <div className="flex items-center gap-4 px-2">
              <span className="w-12 h-[1px] bg-white/10" />
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Try these for inspiration</p>
              <span className="flex-1 h-[1px] bg-white/10" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUGGESTED_PROMPTS.map((item, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  onClick={() => {
                    setPrompt(item.text);
                    generateImages();
                  }}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-pictora-yellow/50 hover:bg-white/[0.05] transition-all text-left flex items-start justify-between group"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-pictora-yellow/60 uppercase tracking-widest">{item.category}</span>
                    <p className="text-sm text-white/50 group-hover:text-white/90 transition-colors line-clamp-1">{item.text}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <RefreshCw className="w-3 h-3 text-pictora-yellow" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-pictora-bg dot-grid relative overflow-hidden flex flex-col">
      <div className="flex-1 w-full h-full p-4 md:p-6 lg:p-12">
        <div className={cn(
          "grid gap-6 lg:gap-12 w-full h-full items-center justify-center",
          mainImages.length > 1 ? "grid-cols-1 lg:grid-cols-2 lg:grid-rows-1" : "grid-cols-1 grid-rows-1"
        )}>
          {mainImages.map((img, i) => {
            const isLatestGenerating = isGenerating && i === 0;
            return (
              <div key={img?.id || `generating-${i}`} className="w-full h-full flex items-center justify-center min-h-0 relative">
                <AspectBox aspectRatioValue={ratioValue}>
                  {isLatestGenerating ? (
                    <SkeletonLoader />
                  ) : (
                    img && <ImageCard image={img} onOpenUpscale={handleOpenUpscaler} onOpenEdit={handleOpenEditor} large />
                  )}
                </AspectBox>
              </div>
            );
          })}
        </div>
      </div>
      
      <UpscalerModal 
        image={upscaleTarget} 
        isOpen={isUpscaleOpen} 
        onClose={() => setIsUpscaleOpen(false)} 
      />

      <ImageEditorModal 
        image={editTarget} 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
      />
    </div>
  );
};

interface ImageCardProps {
  image?: { id: string; url: string; prompt: string; generationTime?: number; aspectRatio?: AspectRatio; upscaledUrl?: string };
  large?: boolean;
  onOpenUpscale?: (img: any) => void;
  onOpenEdit?: (img: any) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, large, onOpenUpscale, onOpenEdit }) => {
  const { setPrompt, generateImages, setSubjectImage, setSceneImage, setStyleImage, aspectRatio, deleteImage, updateImage } = useGeneratorStore();
  
  if (!image) return <div className="w-full h-full bg-white/5 rounded-none" />;
  
  const isCropping = image.aspectRatio && image.aspectRatio !== aspectRatio;

  const parseRatio = (ratio: AspectRatio) => {
    let [w, h] = ratio.split(':').map(Number);
    if (!w || !h) return 1;
    return w / h;
  };

  const handleApplyCrop = async () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.url;
    await new Promise(r => img.onload = r);

    const currentRatio = img.naturalWidth / img.naturalHeight;
    const targetRatio = parseRatio(aspectRatio);

    let cropW = img.naturalWidth;
    let cropH = img.naturalHeight;

    if (currentRatio > targetRatio) {
      cropW = img.naturalHeight * targetRatio;
    } else if (currentRatio < targetRatio) {
      cropH = img.naturalWidth / targetRatio;
    }

    const canvas = document.createElement('canvas');
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startX = (img.naturalWidth - cropW) / 2;
    const startY = (img.naturalHeight - cropH) / 2;

    ctx.drawImage(img, startX, startY, cropW, cropH, 0, 0, cropW, cropH);
    const croppedUrl = canvas.toDataURL('image/png', 1.0);

    updateImage(image.id, { url: croppedUrl, aspectRatio: aspectRatio });
  };

  const handleDownload = async () => {
    try {
      const downloadUrl = image.upscaledUrl || image.url;
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pictora-${image.upscaledUrl ? 'UHD-' : ''}${image.id.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <motion.div 
      layout
      layoutId={image.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full relative flex items-center justify-center group overflow-hidden rounded-none shadow-md bg-[#1A1A1A]"
    >
      <img 
        src={image.upscaledUrl || image.url} 
        alt={image.prompt} 
        onClick={() => onOpenEdit?.(image)}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-105"
        title="Click to enter Granular Edit mode"
      />

      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        {image.generationTime && (
          <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white/90 border border-white/10 shadow-xl flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-pictora-yellow" />
            {(image.generationTime / 1000).toFixed(1)}s
          </div>
        )}
        {image.upscaledUrl && (
          <div className="bg-[#FFD600] text-black px-2 py-0.5 rounded-md text-[9px] font-bold shadow-xl flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 fill-current" />
            <span>ULTRA HD</span>
          </div>
        )}
      </div>
      
      {/* Overlay Controls */}
      <div className={cn(
        "absolute inset-0 transition-all duration-300 flex flex-col justify-between p-3.5 z-10 pointer-events-none",
        isCropping 
          ? "bg-black/40 opacity-100" 
          : "bg-black/5 sm:bg-black/0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:bg-black/20"
      )}>
        {isCropping ? (
          <div className="flex-1 flex items-center justify-center pointer-events-auto">
            <button 
              onClick={handleApplyCrop}
              className="px-6 py-3 bg-pictora-yellow hover:bg-yellow-400 rounded-full text-black shadow-xl transition-all hover:scale-105 flex items-center gap-2 font-bold transform -translate-y-2 animate-in fade-in zoom-in duration-300"
            >
              <Crop className="w-5 h-5" />
              <span>Apply Crop ({aspectRatio})</span>
            </button>
          </div>
        ) : (
          <>
            {/* Top Bar Action pill deck with easy-to-click controls */}
            <div className="flex justify-end pointer-events-auto">
              <div className="bg-[#111111]/90 backdrop-blur-md border border-white/10 rounded-full p-1.5 flex items-center gap-2 shadow-2xl">
                {onOpenEdit && (
                  <button 
                    onClick={() => onOpenEdit(image)}
                    className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 rounded-full text-black flex items-center justify-center shadow transition-all hover:scale-[1.12] active:scale-90 cursor-pointer"
                    title="Granular Image Editor"
                  >
                    <Brush className="w-4 h-4" />
                  </button>
                )}
                {onOpenUpscale && (
                  <button 
                    onClick={() => onOpenUpscale(image)}
                    className="w-10 h-10 bg-gradient-to-r from-amber-500 to-pictora-yellow hover:from-amber-600 hover:to-yellow-500 rounded-full text-black flex items-center justify-center shadow transition-all hover:scale-[1.12] active:scale-90 cursor-pointer"
                    title="Upscale to Ultra-HD"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => {
                    setPrompt(image.prompt);
                    generateImages();
                  }}
                  className="w-10 h-10 bg-sky-500 hover:bg-sky-600 rounded-full text-white flex items-center justify-center shadow transition-all hover:scale-[1.12] active:scale-90 cursor-pointer"
                  title="Regenerate with this prompt"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                
                {/* Bright contrast Red Deletion action with outstanding hit container area */}
                <button 
                  onClick={() => deleteImage(image.id)}
                  className="w-10 h-10 bg-red-500 hover:bg-red-650 rounded-full text-white flex items-center justify-center shadow-lg transition-all hover:scale-[1.18] active:scale-75 cursor-pointer border border-red-400/20"
                  title="Delete Image"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
                
                <button 
                  onClick={handleDownload}
                  className="w-10 h-10 bg-white/10 hover:bg-white/25 border border-white/5 rounded-full text-white flex items-center justify-center shadow transition-all hover:scale-[1.12] active:scale-90 cursor-pointer"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Bottom Bar Reference pill deck for builder settings */}
            <div className="flex justify-center pointer-events-auto">
              <div className="bg-[#111111]/90 backdrop-blur-md border border-white/10 rounded-full p-1.5 flex items-center gap-1.5 sm:gap-2 shadow-2xl">
                <button 
                  onClick={() => setSubjectImage(image.url)}
                  className="px-3.5 py-2 bg-pictora-yellow hover:bg-yellow-400 rounded-full text-black shadow transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  title="Set as Reference Subject"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wide hidden xs:inline">Subject</span>
                </button>
                <button 
                  onClick={() => setSceneImage(image.url)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/5 rounded-full text-white shadow transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  title="Set as Reference Scene"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wide hidden xs:inline">Scene</span>
                </button>
                <button 
                  onClick={() => setStyleImage(image.url)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/5 rounded-full text-white shadow transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  title="Set as Reference Style"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wide hidden xs:inline">Style</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

const SkeletonLoader = () => (
  <motion.div 
    layout
    layoutId="skeleton"
    className="w-full h-full relative overflow-hidden rounded-none bg-white/5"
  >
    {/* Spinning Glow Effect */}
    <div className="absolute inset-0 p-[1px]">
      <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg_120deg,rgba(255,215,0,0.3)_180deg,transparent_240deg_360deg)]" />
    </div>
    <div className="absolute inset-[1px] bg-[#111111] rounded-none flex items-center justify-center">
      <div className="w-full h-full bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#111] animate-pulse" />
    </div>
  </motion.div>
);
