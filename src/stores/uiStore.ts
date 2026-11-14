/**
 * UI Store - Mode selection, panel states, modals
 *
 * Manages the top-level UI state for Pictora's three-mode architecture:
 * - cast: Pre-production studio
 * - storyboard: Visual direction
 * - video: Post-production editing
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type Mode = 'cast' | 'storyboard' | 'video';

export interface PanelState {
  isOpen: boolean;
  width?: number;
  height?: number;
}

export interface UiState {
  // Mode selection
  mode: Mode;
  setMode: (mode: Mode) => void;

  // Panel states
  leftPanel: PanelState;
  rightPanel: PanelState;
  bottomPanel: PanelState;

  setLeftPanel: (state: Partial<PanelState>) => void;
  setRightPanel: (state: Partial<PanelState>) => void;
  setBottomPanel: (state: Partial<PanelState>) => void;

  // Modal states
  poseModalOpen: boolean;
  cameraModalOpen: boolean;
  settingsModalOpen: boolean;
  projectModalOpen: boolean;

  setPoseModalOpen: (open: boolean) => void;
  setCameraModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setProjectModalOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  devtools((set, get) => ({
    // Initial mode - storyboard (existing functionality)
    mode: 'storyboard',

    setMode: (mode: Mode) => set({ mode }),

    // Panel states - default to visible
    leftPanel: { isOpen: true },
    rightPanel: { isOpen: true },
    bottomPanel: { isOpen: false },

    setLeftPanel: (state: Partial<PanelState>) => set((prev) => ({
      leftPanel: { ...prev.leftPanel, ...state }
    })),

    setRightPanel: (state: Partial<PanelState>) => set((prev) => ({
      rightPanel: { ...prev.rightPanel, ...state }
    })),

    setBottomPanel: (state: Partial<PanelState>) => set((prev) => ({
      bottomPanel: { ...prev.bottomPanel, ...state }
    })),

    // Modal states
    poseModalOpen: false,
    cameraModalOpen: false,
    settingsModalOpen: false,
    projectModalOpen: false,

    setPoseModalOpen: (open: boolean) => set({ poseModalOpen: open }),
    setCameraModalOpen: (open: boolean) => set({ cameraModalOpen: open }),
    setSettingsModalOpen: (open: boolean) => set({ settingsModalOpen: open }),
    setProjectModalOpen: (open: boolean) => set({ projectModalOpen: open }),
  }))
);