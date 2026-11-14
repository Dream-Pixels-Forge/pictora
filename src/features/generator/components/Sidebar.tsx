import React, { useState, useMemo } from "react";
import { Plus, Dice5, Menu, Settings, LogOut, Sparkles, RefreshCw, Film, BrainCircuit, Clapperboard, Download, Clock, ArrowRight, Image, X, User, Trash2 } from "lucide-react";
import { useGeneratorStore } from "../store/useGeneratorStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ExportStoryboardModal } from "./ExportStoryboardModal";

export const Sidebar = ({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) => {
  const { 
    viewMode, setViewMode, storyboardScenes: allStoryboardScenes, activeSceneId, setActiveSceneId, 
    addStoryboardScene, deleteStoryboardScene, generateStoryboardOutline,
    userEmail, signOut,
    activeProjectId
  } = useGeneratorStore();

  const storyboardScenes = useMemo(() => {
    return allStoryboardScenes.filter(
      (s) => s.projectId === activeProjectId || (!s.projectId && activeProjectId === null)
    );
  }, [allStoryboardScenes, activeProjectId]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"references" | "deck">("deck");
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  React.useEffect(() => {
    if (confirmWipe) {
      const timer = setTimeout(() => {
        setConfirmWipe(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmWipe]);

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

  // Auto-focus tabs based on mode switches
  React.useEffect(() => {
    if (viewMode === "storyboard") {
      setSidebarTab("deck");
    } else {
      setSidebarTab("references");
    }
  }, [viewMode]);

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [concept, setConcept] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);

  const handleCreateOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) {
      toast.error("Please enter a concept idea first");
      return;
    }
    setIsDrafting(true);
    const toastId = toast.loading("Gemini AI is crafting sequential screenplay scenes...");
    try {
      await generateStoryboardOutline(concept);
      setShowDraftModal(false);
      setConcept("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrafting(false);
      toast.dismiss(toastId);
    }
  };

  const exportStoryboardHTML = () => {
    if (storyboardScenes.length === 0) {
      toast.error("No storyboard scenes to export yet");
      return;
    }

    try {
      const scenesHtml = storyboardScenes.map(s => `
        <div class="scene-card" style="margin-bottom: 40px; background: #151515; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column;">
          <div style="padding: 16px; background: rgba(255, 214, 0, 0.1); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #FFD600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">ROUND ${s.sceneNumber} / SCENE ${s.sceneNumber}</span>
            <span style="font-weight: bold; font-size: 16px; color: #ffffff;">${s.title}</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; flex-direction: row; align-items: stretch; max-width: 100%;">
            <div style="flex: 1 1 450px; min-height: 300px; background: #0a0a0a; display: flex; align-items: center; justify-content: center; position: relative;">
               ${s.imageUrl 
                 ? `<img src="${s.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` 
                 : `<div style="color: rgba(255,255,255,0.2); font-size: 14px; padding: 40px; text-align: center;">Frame Image Pending Render</div>`
               }
            </div>
            <div style="flex: 1 1 350px; padding: 24px; display: flex; flex-direction: column; gap: 16px; justify-content: center; border-left: 1px solid rgba(255,255,255,0.05);">
              <div>
                <h4 style="margin: 0 0 6px 0; color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Creative Prompt Trigger</h4>
                <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.8); font-style: italic; line-height: 1.5;">"${s.prompt || "No prompt written yet."}"</p>
              </div>
              <div>
                <h4 style="margin: 0 0 6px 0; color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Screenplay Narration & Stage Action</h4>
                <p style="margin: 0; font-size: 14px; color: #ffffff; line-height: 1.6;">${s.narration || "No voiceover written yet."}</p>
              </div>
            </div>
          </div>
        </div>
      `).join("");

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pictora Storyboard Export</title>
  <style>
    body {
      background-color: #0d0d0d;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      margin-bottom: 50px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      padding-bottom: 30px;
    }
    h1 { margin: 0 0 10px 0; color: #FFD600; font-weight: 800; letter-spacing: -0.5px; }
    p.meta { margin: 0; color: rgba(255,255,255,0.4); font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>PICTORA STORYBOARD PORTFOLIO</h1>
      <p class="meta">Exported on ${new Date().toLocaleDateString()} &bull; Total Scenes: ${storyboardScenes.length}</p>
    </header>
    <main>
      ${scenesHtml}
    </main>
  </div>
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `storyboard-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      toast.success("Storyboard HTML Script exported successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export storyboard portfolio file");
    }
  };
  
  return (
    <div className={cn(
      "relative h-full bg-[#111111] flex flex-col border-r border-white/5 shrink-0 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16 p-3 md:py-6 items-center" : "w-10 md:w-72 p-4 md:p-6"
    )}>
      <div className={cn("flex items-center gap-3 mb-6 overflow-hidden whitespace-nowrap", isCollapsed && "justify-center")}>
        <Menu className="w-6 h-6 text-white/80 cursor-pointer shrink-0" onClick={onToggle} />
        {!isCollapsed && (
          <span className="font-display font-bold text-xl transition-opacity duration-300 opacity-100">Pictora</span>
        )}
      </div>

      {/* Mode Select Header */}
      {!isCollapsed ? (
        <div className="mb-4 p-1 bg-black/45 rounded-xl border border-white/5 flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("canvas")}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer",
              viewMode === "canvas"
                ? "bg-gradient-to-r from-amber-500 to-pictora-yellow text-black shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/[0.02]"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Canvas</span>
          </button>
          
          <button
            type="button"
            onClick={() => setViewMode("storyboard")}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer",
              viewMode === "storyboard"
                ? "bg-gradient-to-r from-amber-500 to-pictora-yellow text-black shadow-lg"
                : "text-white/60 hover:text-white hover:bg-white/[0.02]"
            )}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Storyboard</span>
          </button>
        </div>
      ) : (
        <div className="mb-4 flex flex-col gap-2 items-center shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("canvas")}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
              viewMode === "canvas" ? "bg-pictora-yellow text-black shadow" : "text-white/40 hover:text-white hover:bg-white/5"
            )}
            title="Canvas Mode"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("storyboard")}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
              viewMode === "storyboard" ? "bg-pictora-yellow text-black shadow" : "text-white/40 hover:text-white hover:bg-white/5"
            )}
            title="Storyboard Mode"
          >
            <Film className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Selector for Storyboard view Mode */}
      {!isCollapsed && viewMode === "storyboard" && (
        <div className="mb-4 flex border-b border-white/5 text-[10px] font-bold uppercase tracking-wider select-none shrink-0">
          <button
            type="button"
            onClick={() => setSidebarTab("deck")}
            className={cn(
              "flex-1 pb-2 border-b-2 transition-all cursor-pointer text-center",
              sidebarTab === "deck"
                ? "border-pictora-yellow text-pictora-yellow"
                : "border-transparent text-white/40 hover:text-white/80"
            )}
          >
            Deck
          </button>
          <button
            type="button"
            onClick={() => setSidebarTab("references")}
            className={cn(
              "flex-1 pb-2 border-b-2 transition-all cursor-pointer text-center",
              sidebarTab === "references"
                ? "border-pictora-yellow text-pictora-yellow"
                : "border-transparent text-white/40 hover:text-white/80"
            )}
          >
            References
          </button>
        </div>
      )}

      {isCollapsed && viewMode === "storyboard" && (
        <div className="mb-4 flex gap-1 p-0.5 bg-black/30 rounded-lg border border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarTab("deck")}
            className={cn(
              "p-1.5 rounded-md transition-all cursor-pointer",
              sidebarTab === "deck" ? "bg-pictora-yellow text-black" : "text-white/40 hover:text-white"
            )}
            title="Scenes Deck"
          >
            <Film className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSidebarTab("references")}
            className={cn(
              "p-1.5 rounded-md transition-all cursor-pointer",
              sidebarTab === "references" ? "bg-pictora-yellow text-black" : "text-white/40 hover:text-white"
            )}
            title="Consistent Keys"
          >
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary Scroll Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 w-full min-h-0 flex flex-col justify-between">
        
        {/* TAB 1: References (Always shown in canvas mode, or when selected in storyboard mode) */}
        {(viewMode === "canvas" || sidebarTab === "references") ? (
          <div className="space-y-4">
            {!isCollapsed && (
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="px-1">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-white/40">Featured Ideas</span>
                </div>
                <div className="space-y-2">
                  {[
                    { title: "Dreamy Watercolor", prompt: "A soft dreamy watercolor painting of a Parisian cafe, pastel colors" },
                    { title: "Retro Tech", prompt: "Macro shot of a vintage circuit board with glowing neon fibers" },
                    { title: "Cyber Biosphere", prompt: "Organic glass dome containing a dense alien coral forest, twin suns, neon bioluminescence" },
                    { title: "Steampunk Chrono", prompt: "Extreme macro shot of steampunk clock gears, copper filigree, leaky pipes, teal lighting" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        useGeneratorStore.getState().setPrompt(item.prompt);
                      }}
                      className="w-full p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 text-left transition-all active:scale-95 group"
                    >
                      <p className="text-[9.5px] font-bold text-pictora-yellow/80 mb-0.5">{item.title}</p>
                      <p className="text-[8.5px] text-white/35 line-clamp-1 group-hover:text-white/60 transition-colors uppercase tracking-wider">{item.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: Storyboard Deck (Shown in storyboard mode when deck tab is active) */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Expanded view */}
            {!isCollapsed ? (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Action belt */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button 
                    type="button"
                    onClick={() => setShowDraftModal(true)}
                    className="px-2 py-1.5 bg-gradient-to-r from-amber-500 to-pictora-yellow text-black text-[9px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow active:scale-95 transition-all"
                    title="Generate custom sequential draft with Gemini"
                  >
                    <BrainCircuit className="w-3.5 h-3.5 shrink-0" />
                    <span>AI Draft</span>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={addStoryboardScene}
                    className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 text-[9px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Scene</span>
                  </button>
                </div>

                {/* Scene list scrolls beautifully */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide min-h-0 pb-4">
                  {storyboardScenes.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center border border-dashed border-white/5 rounded-xl bg-white/[0.005]">
                      <Clapperboard className="w-6 h-6 text-white/10 mb-1.5 animate-pulse" />
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">No Scenes Drafted</p>
                      <p className="text-[8px] text-white/20 mt-0.5 max-w-[150px]">Click AI Draft or Add Scene to initiate.</p>
                    </div>
                  ) : (
                    storyboardScenes.map((scene) => {
                      const isActive = scene.id === activeSceneId;
                      return (
                        <div
                          key={scene.id}
                          onClick={() => setActiveSceneId(scene.id)}
                          className={cn(
                            "group relative p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 active:scale-[0.98]",
                            isActive 
                              ? "bg-white/10 border-pictora-yellow ring-1 ring-pictora-yellow/10" 
                              : "bg-[#141414] border-white/5 hover:border-white/10 hover:bg-[#1a1a1a]"
                          )}
                        >
                          {/* Mini Thumbnail */}
                          <div className="w-12 aspect-video bg-black rounded-md overflow-hidden border border-white/10 flex items-center justify-center shrink-0 relative">
                            {scene.isGenerating ? (
                              <div className="absolute inset-0 bg-pictora-yellow/10 flex items-center justify-center">
                                <Clock className="w-3 h-3 text-pictora-yellow animate-spin" />
                              </div>
                            ) : scene.imageUrl ? (
                              <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Image className="w-3 h-3 text-white/15" />
                            )}
                            <div className="absolute bottom-0.5 left-0.5 bg-black/70 px-0.5 rounded text-[7px] font-mono text-white/70">
                              R{scene.sceneNumber}
                            </div>
                          </div>

                          {/* Info caption */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-[9px] font-bold text-white/80 truncate">{scene.title || `Scene ${scene.sceneNumber}`}</p>
                            </div>
                            <p className="text-[8px] text-white/30 truncate mt-0.5">{scene.prompt || "No prompt written yet"}</p>
                          </div>

                          {/* Scene deletion icon */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStoryboardScene(scene.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 bg-red-500/10 hover:bg-red-500 hover:text-white rounded text-red-400 transition-all active:scale-90"
                            title="Delete Scene"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom export action */}
                {storyboardScenes.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white/90 hover:text-pictora-yellow border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer"
                    >
                      <Download className="w-3 h-3 animate-bounce" />
                      <span>Export Portfolio</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Collapsed view */
              <div className="flex flex-col gap-3 items-center w-full">
                <button 
                  type="button"
                  onClick={() => setShowDraftModal(true)}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-pictora-yellow flex items-center justify-center text-black shadow active:scale-90 transition-all cursor-pointer"
                  title="AI Draft Storyboard with Gemini"
                >
                  <BrainCircuit className="w-4 h-4" />
                </button>
                
                <button 
                  type="button"
                  onClick={addStoryboardScene}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/5 flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                  title="Add New Scene"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <div className="w-full border-t border-white/5 my-1" />

                {storyboardScenes.map((scene) => {
                  const isActive = scene.id === activeSceneId;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => setActiveSceneId(scene.id)}
                      className={cn(
                        "w-8 h-8 rounded-lg bg-black border flex items-center justify-center transition-all relative overflow-hidden select-none active:scale-95 cursor-pointer",
                        isActive 
                          ? "border-pictora-yellow ring-1 ring-pictora-yellow/20" 
                          : "border-white/5 hover:border-white/10"
                      )}
                      title={`Scene ${scene.sceneNumber}: ${scene.title || "Untitled"}`}
                    >
                      {scene.isGenerating ? (
                        <Clock className="w-3.5 h-3.5 text-pictora-yellow animate-spin" />
                      ) : scene.imageUrl ? (
                        <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[8px] font-mono font-bold text-white/50">R{scene.sceneNumber}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Settings / Logged Email Profile Footer */}
      <div className="mt-auto pt-4 border-t border-white/5 relative w-full flex justify-center shrink-0" ref={profileMenuRef}>
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
              <p className="text-xs font-bold truncate">{userEmail || "Guest Director"}</p>
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
                <p className="text-xs font-medium truncate">{userEmail || "Guest Director"}</p>
              </div>
              <button 
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowSettingsModal(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 rounded-lg transition-colors"
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button 
                onClick={() => {
                  signOut();
                  setShowProfileMenu(false);
                  toast.success("Successfully signed out.", { description: "Your workspace state remains securely saved." });
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Collapse arrow slider trigger button */}
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

      {/* AI Draft Backdrop Input Modal prompt */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151515] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pictora-yellow fill-current" />
              AI Storyboard Designer
            </h3>
            <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
              Describe your project concept or film summary. Gemini AI will automatically generate 4 sequential screenplay rounds with detailed descriptive prompt cues and action scripts.
            </p>

            <form onSubmit={handleCreateOutline} className="mt-3.5 space-y-3">
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-white/30 uppercase tracking-wider">Concept Idea</label>
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 focus:border-pictora-yellow text-xs rounded-xl px-3 py-2.5 text-white placeholder:text-white/25 outline-none focus:ring-1 focus:ring-pictora-yellow/20"
                  placeholder="e.g. A cyber pirate searching asteroid docks..."
                  disabled={isDrafting}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-[9px] font-bold uppercase tracking-wider cursor-pointer font-sans"
                  disabled={isDrafting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pictora-yellow hover:bg-yellow-400 text-black rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow active:scale-95 font-sans"
                  disabled={isDrafting}
                >
                  {isDrafting ? "Drafting..." : "Draft Full Story"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Application Settings */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151515] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-pictora-yellow" />
                Workspace Settings
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setConfirmWipe(false);
                }}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-5">
              {/* Account Section */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Account Information</h4>
                <div className="bg-black/25 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5 overflow-hidden">
                    <p className="text-xs font-semibold text-white/95 truncate">{userEmail || "Guest Director"}</p>
                    <p className="text-[10px] text-white/40 font-mono">Workspace Role: Creator & Auteur</p>
                  </div>
                </div>
              </div>

              {/* Data & Database Section */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-pictora-yellow uppercase tracking-wider">Storage & Offline Database</h4>
                <div className="bg-black/25 border border-white/5 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    All your storyboard scene scripts, prompts, reference images, and project containers are securely saved locally.
                  </p>
                  <p className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 leading-relaxed">
                    ⚠️ Warning: Clearing database will permanently purge all scene timelines and configurations. This cannot be undone.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Clear DB on top of Sign Out */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirmWipe) {
                      setConfirmWipe(true);
                      toast.warning("Click again to clear database.", { 
                        description: "This will discard all storyboard scenes, reference states, and project groupings." 
                      });
                      return;
                    }
                    
                    try {
                      const { del } = await import('idb-keyval');
                      await del('pictora-storage');
                      localStorage.removeItem('pictora-storage');
                      toast.success("IndexedDB wiped. Restarting...");
                      setTimeout(() => {
                        window.location.reload();
                      }, 500);
                    } catch (err) {
                      console.error("Failed to wipe:", err);
                      toast.error("Failed to wipe database.");
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border",
                    confirmWipe 
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30 animate-pulse duration-500" 
                      : "bg-[#1A1A1A] hover:bg-white/5 text-amber-500 border-white/10"
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{confirmWipe ? "Confirm Clear DB?" : "Clear Database"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setShowSettingsModal(false);
                    toast.success("Successfully signed out.", { description: "Your workspace state remains securely saved." });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-lg transition-all active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Exporter Suite Options Overlay Overlay */}
      <ExportStoryboardModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportHtmlFn={exportStoryboardHTML}
      />
    </div>
  );
};
