import React, { useState } from "react";
import { User, MapPin, PenTool, Plus, Dice5, Menu, Settings, LogOut, Trash2 } from "lucide-react";
import { useGeneratorStore } from "../store/useGeneratorStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface SidebarSectionProps {
  title: string;
  icon: React.ElementType;
  thumbnail?: string | null;
  onClear?: () => void;
  onUpload?: (url: string) => void;
  isCollapsed?: boolean;
}

const SidebarSection = ({ title, icon: Icon, thumbnail, onClear, onUpload, isCollapsed }: SidebarSectionProps) => {
  const { setPrompt } = useGeneratorStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  
  const handleDiceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ideas = [
      "A futuristic city with flying cars", 
      "Cyberpunk cat in a neon alley", 
      "Oil painting of a misty forest",
      "Minimalist architecture in the desert",
      "Portrait of a robot with flowers"
    ];
    setPrompt(ideas[Math.floor(Math.random() * ideas.length)]);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onUpload?.(result);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="mb-4 w-full">
      {!isCollapsed && (
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[9px] font-bold tracking-widest uppercase text-white/60">{title}</span>
          <div className="flex gap-2">
              <Dice5 
                onClick={handleDiceClick}
                className="w-2.5 h-2.5 opacity-40 cursor-pointer hover:opacity-100 transition-opacity" 
              />
              <Plus 
                onClick={() => fileInputRef.current?.click()}
                className="w-2.5 h-2.5 opacity-40 cursor-pointer hover:opacity-100 transition-opacity" 
              />
          </div>
        </div>
      )}
      <div 
        className="relative group"
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
          className={cn(
            "w-full border border-dashed rounded-md flex flex-col items-center justify-center transition-all group relative overflow-hidden",
            isCollapsed ? "aspect-square rounded-full border-white/30 bg-transparent" : "aspect-[4/3]",
            thumbnail ? "border-transparent bg-white/20" : (!isCollapsed ? "border-white/20 bg-black/20 hover:bg-white/5" : "hover:bg-white/5"),
            isDragging && "border-white/50 bg-white/5 scale-[0.98]"
          )}
        >
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          ) : (
            <>
              <Icon className="w-6 h-6 text-white/80 mb-2" />
              {!isCollapsed && (
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Upload</span>
              )}
            </>
          )}
        </button>
        {thumbnail && (
          <div className={cn(
            "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10 pointer-events-none",
            isCollapsed ? "rounded-full" : "rounded-md"
          )}>
            <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                e.preventDefault();
                onClear?.(); 
              }}
              className="w-10 h-10 bg-red-500 hover:bg-red-600 active:scale-90 text-white rounded-full flex items-center justify-center transition-all shadow-xl pointer-events-auto cursor-pointer border border-red-400/20 hover:scale-110"
              title="Remove Image"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const Sidebar = ({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) => {
  const { subjectImage, sceneImage, styleImage, setSubjectImage, setSceneImage, setStyleImage } = useGeneratorStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);
  
  return (
    <div className={cn(
      "relative h-full bg-[#111111] flex flex-col border-r border-white/5 shrink-0 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16 p-3 md:py-6 items-center" : "w-24 md:w-72 p-4 md:p-6"
    )}>
      <div className={cn("flex items-center gap-3 mb-10 overflow-hidden whitespace-nowrap", isCollapsed && "justify-center")}>
        <Menu className="w-6 h-6 text-white/80 cursor-pointer shrink-0" onClick={onToggle} />
        {!isCollapsed && (
          <span className="font-display font-bold text-xl transition-opacity duration-300 opacity-100">Pictora</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 w-full">
        <SidebarSection 
          title="Subject" 
          icon={User} 
          thumbnail={subjectImage}
          onClear={() => setSubjectImage(null)}
          onUpload={(url) => setSubjectImage(url)}
          isCollapsed={isCollapsed}
        />
        <SidebarSection 
          title="Scene" 
          icon={MapPin} 
          thumbnail={sceneImage}
          onClear={() => setSceneImage(null)}
          onUpload={(url) => setSceneImage(url)}
          isCollapsed={isCollapsed} 
        />
        <SidebarSection 
          title="Style" 
          icon={PenTool} 
          thumbnail={styleImage}
          onClear={() => setStyleImage(null)}
          onUpload={(url) => setStyleImage(url)}
          isCollapsed={isCollapsed} 
        />

        {!isCollapsed && (
          <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
            <div className="px-1">
              <span className="text-[9px] font-bold tracking-widest uppercase text-white/60">Featured Ideas</span>
            </div>
            <div className="space-y-2">
              {[
                { title: "Dreamy Watercolor", prompt: "A soft dreamy watercolor painting of a Parisian cafe, pastel colors" },
                { title: "Retro Tech", prompt: "Macro shot of a vintage circuit board with glowing neon fibers" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    useGeneratorStore.getState().setPrompt(item.prompt);
                  }}
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 text-left transition-all active:scale-95 group"
                >
                  <p className="text-[10px] font-bold text-pictora-yellow/80 mb-1">{item.title}</p>
                  <p className="text-[9px] text-white/40 line-clamp-1 group-hover:text-white/60 transition-colors uppercase tracking-wider">{item.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-4 border-t border-white/5 relative w-full flex justify-center" ref={profileMenuRef}>
        <button 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className={cn(
            "w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all active:scale-95",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
        >
          <div className="w-8 h-8 bg-pictora-yellow rounded-full flex items-center justify-center text-black shrink-0">
            <User className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-xs font-bold truncate">dimona.patrick@gmail.com</p>
            </div>
          )}
        </button>

        <AnimatePresence>
          {showProfileMenu && (
            <motion.div
              initial={{ opacity: 0, x: isCollapsed ? 20 : 0, y: -10 }}
              animate={{ opacity: 1, x: isCollapsed ? 60 : 0, y: -20 }}
              exit={{ opacity: 0, x: isCollapsed ? 20 : 0, y: -10 }}
              className={cn(
                "absolute bg-[#1A1A1A] text-white rounded-xl shadow-2xl border border-white/5 p-2 z-50 min-w-[200px]",
                isCollapsed ? "left-0 bottom-12" : "left-0 bottom-full mb-2"
              )}
            >
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Account</p>
                <p className="text-xs font-medium truncate">dimona.patrick@gmail.com</p>
              </div>
              <button 
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 rounded-lg transition-colors"
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button 
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="absolute -right-3 top-16 z-20">
        <button 
          onClick={onToggle}
          className={cn(
            "w-6 h-6 bg-pictora-yellow rounded-full flex items-center justify-center text-black hover:scale-110 transition-all duration-300",
            isCollapsed && "rotate-180"
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
