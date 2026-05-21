/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Toaster } from "sonner";
import { Sidebar } from "./features/generator/components/Sidebar";
import { Canvas } from "./features/generator/components/Canvas";
import { PromptBar } from "./features/generator/components/PromptBar";
import { HistorySidebar } from "./features/generator/components/HistorySidebar";
import { SplashScreen } from "./features/ui/SplashScreen";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(true); // Default to collapsed

  return (
    <>
      <Toaster position="top-center" theme="dark" richColors />
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <div className="flex h-screen w-full bg-pictora-bg overflow-hidden relative">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        
        <main className="flex-1 relative flex flex-col h-full min-w-0">
          <Canvas />
          <PromptBar />
        </main>

        <HistorySidebar 
          isCollapsed={isHistoryCollapsed} 
          onToggle={() => setIsHistoryCollapsed(!isHistoryCollapsed)} 
        />
      </div>
    </>
  );
}
