import React, { useState, useMemo } from "react";
import { Copy, Plus, Menu, Clock, Play, Download, Heart, Trash2, Check, Filter, Sparkles } from "lucide-react";
import { useGeneratorStore } from "../store/useGeneratorStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

export const HistorySidebar = ({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) => {
  const { images, setPrompt, toggleFavorite, deleteImage } = useGeneratorStore();
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredImages = useMemo(() => {
    if (filter === "favorites") {
      return images.filter(img => img.isFavorite);
    }
    return images;
  }, [images, filter]);

  const handleExportHistory = () => {
    if (filteredImages.length === 0) {
      toast.error("No images in history to export");
      return;
    }
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredImages, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `pictora-history-${filter}-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(`Exported ${filteredImages.length} items to JSON backup file!`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to export history file");
    }
  };

  const handleCopyAllPrompts = () => {
    if (filteredImages.length === 0) {
      toast.error("No prompts to copy");
      return;
    }
    try {
      const promptsList = filteredImages.map((img, idx) => `[Image ${idx + 1}] (Ratio: ${img.aspectRatio})\nPrompt: ${img.prompt}`).join("\n\n");
      navigator.clipboard.writeText(promptsList);
      toast.success(`Copied prompts list of ${filteredImages.length} items to clipboard!`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to copy prompts list");
    }
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (url: string, id: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `pictora-${id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  };

  return (
    <div className={cn(
      "relative h-full bg-[#111111] flex flex-col border-l border-white/5 shrink-0 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16 p-2 md:py-6 items-center" : "w-24 md:w-80 p-4 md:p-6"
    )}>
      <div className={cn("flex items-center justify-between mb-6 overflow-hidden", isCollapsed && "justify-center")}>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-white/80 shrink-0" />
          {!isCollapsed && (
            <span className="font-bold text-sm tracking-tight">History</span>
          )}
        </div>
        
        {!isCollapsed && images.length > 0 && (
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 animate-in fade-in zoom-in-95 duration-300">
            <button 
              onClick={handleExportHistory}
              className="p-1.5 rounded-lg text-white/40 hover:text-pictora-yellow hover:bg-white/5 transition-all active:scale-90 cursor-pointer"
              title="Export History JSON Backup"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleCopyAllPrompts}
              className="p-1.5 rounded-lg text-white/40 hover:text-pictora-yellow hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
              title="Copy All Prompts Text"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <span className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
            <button 
              onClick={() => setFilter(prev => prev === "all" ? "favorites" : "all")}
              className={cn(
                "p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer",
                filter === "favorites" ? "bg-red-500/25 text-red-500 hover:bg-red-500/35" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
              title={filter === "favorites" ? "Showing Favorites Only" : "Filter by Favorites"}
            >
              <Heart className={cn("w-3.5 h-3.5", filter === "favorites" && "fill-current")} />
            </button>
          </div>
        )}

        {!isCollapsed && images.length === 0 && (
          <div className="text-[10px] text-white/20 select-none">Empty</div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 w-full pb-20">
        {filteredImages.length === 0 && !isCollapsed && (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20">
              <Filter className="w-5 h-5" />
            </div>
            <p className="text-xs text-white/40 max-w-[150px]">
              {filter === "favorites" ? "No favorite generations yet" : "No generated images yet"}
            </p>
          </div>
        )}
        
        <AnimatePresence initial={false}>
          {filteredImages.map((image) => (
            <motion.div 
              key={image.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "relative group flex flex-col w-full",
                isCollapsed ? "items-center" : "items-stretch"
              )}
            >
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#1A1A1A] shadow-lg border border-white/5 ring-pictora-yellow/30 group-hover:ring-2 transition-all">
                <img src={image.upscaledUrl || image.url} alt={image.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                
                {image.generationTime && (
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold text-white/90 z-10 border border-white/10 flex items-center gap-1 shadow-lg">
                    <Clock className="w-2 h-2" />
                    {(image.generationTime / 1000).toFixed(1)}s
                  </div>
                )}

                {image.upscaledUrl && (
                  <div className="absolute bottom-2 left-2 bg-[#FFD600] text-black px-1.5 py-0.5 rounded text-[7px] font-extrabold z-10 flex items-center gap-0.5 shadow-md">
                    <Sparkles className="w-2 h-2 fill-current" />
                    <span>UHD</span>
                  </div>
                )}

                {image.isFavorite && (
                  <div className="absolute top-2 right-2 text-red-500 z-10 drop-shadow-md">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPrompt(image.prompt)}
                      className="p-2.5 bg-white text-black rounded-xl hover:bg-pictora-yellow transition-colors shadow-lg"
                      title="Use Prompt"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDownload(image.upscaledUrl || image.url, image.id)}
                      className="p-2.5 bg-black/80 text-white rounded-xl hover:bg-black transition-colors shadow-lg"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleFavorite(image.id)}
                      className={cn(
                        "p-2.5 rounded-xl transition-colors shadow-lg",
                        image.isFavorite ? "bg-red-500 text-white" : "bg-black/60 text-white/60 hover:text-white"
                      )}
                      title={image.isFavorite ? "Unfavorite" : "Favorite"}
                    >
                      <Heart className={cn("w-4 h-4", image.isFavorite && "fill-current")} />
                    </button>
                    <button 
                      onClick={() => deleteImage(image.id)}
                      className="p-2.5 bg-black/60 text-white/60 hover:bg-red-500 hover:text-white rounded-xl transition-colors shadow-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {!isCollapsed && (
                <div className="mt-3 px-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-medium text-white/70 line-clamp-2 leading-relaxed">
                      {image.prompt}
                    </p>
                    <button 
                      onClick={() => handleCopyPrompt(image.id, image.prompt)}
                      className="text-white/30 hover:text-pictora-yellow transition-colors p-1"
                    >
                      {copiedId === image.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="absolute -left-3 top-16 z-20">
        <button 
          onClick={onToggle}
          className={cn(
            "w-6 h-6 bg-pictora-yellow rounded-full flex items-center justify-center text-black hover:scale-110 transition-all shadow-lg active:scale-95",
            !isCollapsed && "rotate-180"
          )}
        >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
            </svg>
        </button>
      </div>
    </div>
  );
};

