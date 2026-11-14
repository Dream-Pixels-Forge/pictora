/**
 * Storyboard Store - Art direction state
 *
 * Manages scenes, shots, takes, camera positions, and 2.5D assets
 * for the Storyboard Mode (visual direction phase).
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// --- Types ---

export interface Shot {
  id: string;
  sceneId: string;
  number: number;
  type: ShotType;
  description: string;
  camera: Camera;
  elements: Element[];
}

export interface Take {
  id: string;
  shotId: string;
  number: number;
  version: number;
  imageData: string;
  notes: string;
  generatedAt?: Date;
}

export interface Camera {
  position: { x: number; y: number; z: number };
  angle: number;
  fov: number;
  shotType: ShotType;
}

export interface Element {
  id: string;
  type: 'character' | 'location' | 'prop' | 'text' | 'shape' | 'light';
  position: { x: number; y: number; z: number };
  scale: number;
  rotation: number;
  data?: any;
  visible: boolean;
}

export interface Scene {
  id: string;
  sessionId: string;
  number: number;
  title: string;
  description: string;
  shots: Shot[];
  camera: Camera;
  elements: Element[];
}

export type ShotType =
  | 'establishing' | 'wide' | 'medium' | 'close-up'
  | 'extreme close-up' | 'over the shoulder' | 'point of view';

export interface StoryboardState {
  // Scenes
  scenes: Scene[];
  activeSceneId: string | null;

  // Shots
  activeShotId: string | null;

  // Camera
  selectedCameraId: string | null;

  // Elements
  selectedElementId: string | null;

  // 2.5D view settings
  view3D: boolean;
  cameraAngle: number;
  zoom: number;

  // Actions
  createScene: (sessionId: string, number: number, title: string) => string;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  setActiveScene: (id: string | null) => void;

  createShot: (sceneId: string, type: ShotType) => string;
  updateShot: (id: string, updates: Partial<Shot>) => void;
  deleteShot: (id: string) => void;
  setActiveShot: (id: string | null) => void;

  createTake: (shotId: string, imageData: string) => string;
  updateTake: (id: string, updates: Partial<Take>) => void;

  addElement: (sceneId: string, element: Omit<Element, 'id'>) => string;
  updateElement: (id: string, updates: Partial<Element>) => void;
  deleteElement: (id: string) => void;
  setActiveElement: (id: string | null) => void;

  setCameraPosition: (position: Camera['position']) => void;
  setCameraAngle: (angle: number) => void;
  setView3D: (view3D: boolean) => void;

  // AI actions
  generateSceneImage: (sceneId: string) => Promise<string | null>;
  refineSceneDescription: (sceneId: string, additionalPrompt: string) => Promise<void>;
}

// --- Store ---

export const useStoryboardStore = create<StoryboardState>()(
  devtools(
    persist(
      (set, get) => ({
        scenes: [],
        activeSceneId: null,
        activeShotId: null,
        selectedCameraId: null,
        selectedElementId: null,
        view3D: false,
        cameraAngle: 0,
        zoom: 1,

        createScene: (sessionId: string, number: number, title: string) => {
          const id = crypto.randomUUID();
          const scene: Scene = {
            id,
            sessionId,
            number,
            title,
            description: '',
            shots: [],
            camera: {
              position: { x: 0, y: 0, z: 0 },
              angle: 0,
              fov: 45,
              shotType: 'medium',
            },
            elements: [],
          };
          set((state) => ({
            scenes: [...state.scenes, scene],
            activeSceneId: id,
          }));
          return id;
        },

        updateScene: (id: string, updates: Partial<Scene>) => {
          set((state) => ({
            scenes: state.scenes.map(s =>
              s.id === id ? { ...s, ...updates } : s
            ),
          }));
        },

        deleteScene: (id: string) => {
          set((state) => ({
            scenes: state.scenes.filter(s => s.id !== id),
            activeSceneId: state.activeSceneId === id ? null : state.activeSceneId,
            activeShotId: state.activeShotId &&
              !state.scenes.find(s => s.id === id)?.shots.find(sh => sh.id === state.activeShotId)
              ? state.activeShotId
              : null,
          }));
        },

        setActiveScene: (id: string | null) => set({ activeSceneId: id, activeShotId: null }),

        createShot: (sceneId: string, type: ShotType = 'medium') => {
          const scene = get().scenes.find(s => s.id === sceneId);
          if (!scene) return '';

          const id = crypto.randomUUID();
          const shot: Shot = {
            id,
            sceneId,
            number: scene.shots.length + 1,
            type,
            description: '',
            camera: { ...scene.camera, shotType: type },
            elements: [],
          };

          set((state) => ({
            scenes: state.scenes.map(s =>
              s.id === sceneId ? {
                ...s,
                shots: [...s.shots, shot]
              } : s
            ),
            activeShotId: id,
          }));
          return id;
        },

        updateShot: (id: string, updates: Partial<Shot>) => {
          set((state) => ({
            scenes: state.scenes.map(s => ({
              ...s,
              shots: s.shots.map(sh => sh.id === id ? { ...sh, ...updates } : sh),
            })),
          }));
        },

        deleteShot: (id: string) => {
          set((state) => ({
            scenes: state.scenes.map(s => ({
              ...s,
              shots: s.shots.filter(sh => sh.id !== id),
            })),
            activeShotId: state.activeShotId === id ? null : state.activeShotId,
          }));
        },

        setActiveShot: (id: string | null) => set({ activeShotId: id }),

        createTake: (shotId: string, imageData: string) => {
          const id = crypto.randomUUID();
          // In a real implementation, this would store takes
          return id;
        },

        updateTake: (id: string, updates: Partial<Take>) => {
          // Implementation
        },

        addElement: (sceneId: string, element: Omit<Element, 'id'>) => {
          const id = crypto.randomUUID();
          set((state) => ({
            scenes: state.scenes.map(s =>
              s.id === sceneId ? {
                ...s,
                elements: [...s.elements, { ...element, id }]
              } : s
            ),
          }));
          return id;
        },

        updateElement: (id: string, updates: Partial<Element>) => {
          set((state) => ({
            scenes: state.scenes.map(s => ({
              ...s,
              elements: s.elements.map(e => e.id === id ? { ...e, ...updates } : e),
            })),
          }));
        },

        deleteElement: (id: string) => {
          set((state) => ({
            scenes: state.scenes.map(s => ({
              ...s,
              elements: s.elements.filter(e => e.id !== id),
            })),
            selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
          }));
        },

        setActiveElement: (id: string | null) => set({ selectedElementId: id }),

        setCameraPosition: (position) => set({
          scenes: get().scenes.map(s => ({
            ...s,
            camera: { ...s.camera, position },
          })),
        }),

        setCameraAngle: (angle) => set({ cameraAngle: angle }),

        setView3D: (view3D) => set({ view3D }),

        generateSceneImage: async (sceneId: string) => {
          // TODO: Implement scene image generation with Agnes
          return null;
        },

        refineSceneDescription: async (sceneId: string, additionalPrompt: string) => {
          // TODO: Implement scene refinement with Agnes
        },
      }),
      { name: 'pictora-storyboard-storage' }
    )
  )
);