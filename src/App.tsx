/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { Sidebar } from "./features/generator/components/Sidebar";
import { Canvas } from "./features/generator/components/Canvas";
import { PromptBar } from "./features/generator/components/PromptBar";
import { StoryboardWorkspace } from "./features/generator/components/StoryboardWorkspace";
import { VideoWorkspace } from "./features/video/components/VideoWorkspace";
import { HistorySidebar } from "./features/generator/components/HistorySidebar";
import { SplashScreen } from "./features/ui/SplashScreen";
import { SignInScreen } from "./features/ui/SignInScreen";
import { AnimatePresence, motion } from "motion/react";
import { useGeneratorStore } from "./features/generator/store/useGeneratorStore";
import { Keyboard, ArrowRight, Film, Palette } from "lucide-react";

type Mode = "cast" | "storyboard" | "video";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false); // Default to open for space utilization
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { viewMode, isAuthenticated } = useGeneratorStore();

  // Use local state for animation transitions to ensure smooth transitions
  const [localViewMode, setLocalViewMode] = useState<Mode>("cast");

  // Sync local state with store
  useEffect(() => {
    if (viewMode !== undefined) {
      setLocalViewMode(viewMode as Mode);
    }
  }, [viewMode]);

type Shortcut = { key: string; label: string; group: string };

  const KEYBOARD_SHORTCUTS: Shortcut[] = [
    { key: "?", label: "Open shortcuts help", group: "General" },
    { key: "⌘/Ctrl + Enter", label: "Generate image", group: "Prompt Bar" },
    { key: "R", label: "Randomize prompt", group: "Prompt Bar" },
    { key: "E", label: "Refine prompt with AI", group: "Prompt Bar" },
    { key: "1-9", label: "Aspect ratio presets (via panel)", group: "Prompt Bar" },
    { key: "← / →", label: "Navigate storyboard scenes", group: "Storyboard" },
    { key: "1", label: "Switch to Cast mode", group: "Navigation" },
    { key: "2", label: "Switch to Storyboard mode", group: "Navigation" },
    { key: "3", label: "Switch to Video mode", group: "Navigation" },
    { key: "Space", label: "Play/pause presentation", group: "Video" },
    { key: "Esc", label: "Close modals / cancel", group: "Global" },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
      if ((e.key === "Enter") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        generateImages();
      }
      // Navigation shortcuts
      if (e.key === "1") {
        e.preventDefault();
        useGeneratorStore.getState().setViewMode("cast");
      }
      if (e.key === "2") {
        e.preventDefault();
        useGeneratorStore.getState().setViewMode("storyboard");
      }
      if (e.key === "3") {
        e.preventDefault();
        useGeneratorStore.getState().setViewMode("video");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const generateImages = () => {
    // Trigger via store (uses the global generator state)
    const store = useGeneratorStore.getState();
    store.generateImages();
  };

  // Get mode label and icon
  const getModeConfig = (mode: Mode) => {
    switch (mode) {
      case "cast":
        return { label: "CAST", icon: Palette };
      case "storyboard":
        return { label: "STORYBOARD", icon: Film };
      case "video":
        return { label: "VIDEO", icon: Film };
    }
  };

  return (
    <>
      <Toaster position="top-center" theme="dark" richColors />
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      {!showSplash && !isAuthenticated ? (
        <SignInScreen />
      ) : (
        <div className="flex h-screen w-full bg-pictora-bg overflow-hidden relative">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          <main className="flex-1 relative flex flex-col h-full min-w-0">
            <AnimatePresence mode="wait">
              {localViewMode === "storyboard" && (
                <motion.div
                  key="storyboard"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <StoryboardWorkspace />
                </motion.div>
              )}

              {localViewMode === "video" && (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <VideoWorkspace />
                </motion.div>
              )}

              {(localViewMode === "cast" || localViewMode === "storyboard") && (
                <motion.div
                  key="cast-content"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex-1 flex flex-col"
                >
                  <Canvas />
                  <PromptBar />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <HistorySidebar
            isCollapsed={isHistoryCollapsed}
            onToggle={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
          />

          {/* Keyboard Shortcuts Help Modal */}
          {showShortcuts && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <button
                onClick={() => setShowShortcuts(false)}
                className="absolute inset-0 z-0"
                aria-label="Close shortcuts help"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#131313] border border-white/10 rounded-3xl shadow-2xl p-8 w-full max-w-lg z-10"
                role="dialog"
                aria-modal="true"
                aria-label="Keyboard shortcuts"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Keyboard className="w-6 h-6 text-pictora-yellow" aria-hidden="true" />
                  <h2 className="text-lg font-bold text-white tracking-tight">Keyboard Shortcuts</h2>
                </div>

                <div className="space-y-3">
                  {KEYBOARD_SHORTCUTS.reduce<{ group: string; items: Shortcut[] }[]>(
                    (acc, shortcut) => {
                      const groupExists = acc.find((g) => g.group === shortcut.group);
                      if (groupExists) {
                        groupExists.items.push(shortcut);
                      } else {
                        acc.push({ group: shortcut.group, items: [shortcut] });
                      }
                      return acc;
                    },
                    []
                  ).map((group) => (
                    <div key={group.group} className="space-y-2">
                      <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">
                        {group.group}
                      </h3>
                      <div className="space-y-1.5">
                        {group.items.map((shortcut) => (
                          <div key={shortcut.key} className="flex justify-between items-center text-sm">
                            <span className="text-white/60">{shortcut.label}</span>
                            <kbd className="bg-[#222] border border-white/10 px-2 py-0.5 rounded text-[11px] font-mono text-white/80">
                              {shortcut.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => setShowShortcuts(false)}
                    className="px-4 py-2 bg-pictora-yellow text-black rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
                  >
                    Got it <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </>
  );
}