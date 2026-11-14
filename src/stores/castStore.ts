/**
 * Cast Store - Pre-production studio state
 *
 * Manages sessions, projects, cast, locations, props, and shot planning
 * for the Cast Mode (pre-production phase).
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// --- Types ---

export interface CastSession {
  id: string;
  name: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  director: string;
  logline: string;
  description?: string;
  status: 'draft' | 'in-progress' | 'completed' | 'archived';
}

export interface Character {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  poses: Pose[];
  movements: Movement[];
  framing: Framing[];
}

export interface Pose {
  id: string;
  characterId: string;
  name: string;
  imageUrl: string;
  description: string;
  direction?: string;
}

export interface Movement {
  id: string;
  characterId: string;
  name: string;
  description: string;
  keyFrames?: KeyFrame[];
}

export interface KeyFrame {
  time: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}

export interface Framing {
  id: string;
  characterId: string;
  shotType: ShotType;
  description: string;
}

export interface Location {
  id: string;
  sessionId: string;
  name: string;
  images: string[];
  description?: string;
  lighting: string;
  cameraPositions: CameraPosition[];
}

export interface CameraPosition {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  angle: number;
  fov: number;
  notes?: string;
}

export interface Prop {
  id: string;
  sessionId: string;
  name: string;
  variations: string[];
  attributes: string[];
  imageUrl?: string;
}

export type ShotType =
  | 'establishing' | 'wide' | 'medium' | 'close-up'
  | 'extreme close-up' | 'over the shoulder' | 'point of view';

export interface CastState {
  // Sessions
  sessions: CastSession[];
  activeSessionId: string | null;

  // Projects (within sessions)
  projects: Project[];
  activeProjectId: string | null;

  // Selected items
  selectedCharacterId: string | null;
  selectedLocationId: string | null;
  selectedPropId: string | null;

  // Actions
  createSession: (name: string, director: string, logline: string) => string;
  updateSession: (id: string, updates: Partial<CastSession>) => void;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;

  createProject: (name: string) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;

  // Character actions
  createCharacter: (sessionId: string, name: string) => string;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  setActiveCharacter: (id: string | null) => void;

  // Location actions
  createLocation: (sessionId: string, name: string) => string;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;
  setActiveLocation: (id: string | null) => void;

  // Prop actions
  createProp: (sessionId: string, name: string) => string;
  updateProp: (id: string, updates: Partial<Prop>) => void;
  deleteProp: (id: string) => void;
  setActiveProp: (id: string | null) => void;

  // AI actions
  generateCharacterImage: (characterId: string, prompt: string) => Promise<string | null>;
  generateLocationImage: (locationId: string, prompt: string) => Promise<string | null>;
  generatePropImage: (propId: string, prompt: string) => Promise<string | null>;
}

export interface Project {
  id: string;
  sessionId: string;
  name: string;
  createdAt: Date;
}

// --- Store ---

export const useCastStore = create<CastState>()(
  devtools(
    persist(
      (set, get) => ({
        sessions: [],
        activeSessionId: null,
        projects: [],
        activeProjectId: null,
        selectedCharacterId: null,
        selectedLocationId: null,
        selectedPropId: null,

        createSession: (name: string, director: string, logline: string) => {
          const id = crypto.randomUUID();
          const session: CastSession = {
            id,
            name,
            director,
            logline,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'draft',
          };
          set((state) => ({
            sessions: [...state.sessions, session],
            activeSessionId: id,
          }));
          return id;
        },

        updateSession: (id: string, updates: Partial<CastSession>) => {
          set((state) => ({
            sessions: state.sessions.map(s =>
              s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
            ),
          }));
        },

        deleteSession: (id: string) => {
          set((state) => ({
            sessions: state.sessions.filter(s => s.id !== id),
            activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
            projects: state.projects.filter(p => p.sessionId !== id),
          }));
        },

        setActiveSession: (id: string | null) => set({ activeSessionId: id }),

        createProject: (name: string) => {
          const state = get();
          const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
          if (!activeSession) return '';

          const id = crypto.randomUUID();
          const project: Project = {
            id,
            sessionId: activeSession.id,
            name,
            createdAt: new Date(),
          };
          set((state) => ({
            projects: [...state.projects, project],
            activeProjectId: id,
          }));
          return id;
        },

        updateProject: (id: string, updates: Partial<Project>) => {
          set((state) => ({
            projects: state.projects.map(p =>
              p.id === id ? { ...p, ...updates } : p
            ),
          }));
        },

        deleteProject: (id: string) => {
          set((state) => ({
            projects: state.projects.filter(p => p.id !== id),
            activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
          }));
        },

        setActiveProject: (id: string | null) => set({ activeProjectId: id }),

        createCharacter: (sessionId: string, name: string) => {
          const id = crypto.randomUUID();
          const character: Character = {
            id,
            sessionId,
            name,
            poses: [],
            movements: [],
            framing: [],
          };
          set((state) => ({
            sessions: state.sessions.map(s =>
              s.id === sessionId ? { ...s, updatedAt: new Date() } : s
            ),
          }));
          return id;
        },

        updateCharacter: (id: string, updates: Partial<Character>) => {
          // Characters are added to session-specific state in actual implementation
        },

        deleteCharacter: (id: string) => {
          // Implementation
        },

        setActiveCharacter: (id: string | null) => set({ selectedCharacterId: id }),

        createLocation: (sessionId: string, name: string) => {
          const id = crypto.randomUUID();
          // Implementation
          return id;
        },

        updateLocation: (id: string, updates: Partial<Location>) => {
          // Implementation
        },

        deleteLocation: (id: string) => {
          // Implementation
        },

        setActiveLocation: (id: string | null) => set({ selectedLocationId: id }),

        createProp: (sessionId: string, name: string) => {
          const id = crypto.randomUUID();
          // Implementation
          return id;
        },

        updateProp: (id: string, updates: Partial<Prop>) => {
          // Implementation
        },

        deleteProp: (id: string) => {
          // Implementation
        },

        setActiveProp: (id: string | null) => set({ selectedPropId: id }),

        generateCharacterImage: async (characterId: string, prompt: string) => {
          // TODO: Implement character image generation with Agnes
          return null;
        },

        generateLocationImage: async (locationId: string, prompt: string) => {
          // TODO: Implement location image generation with Agnes
          return null;
        },

        generatePropImage: async (propId: string, prompt: string) => {
          // TODO: Implement prop image generation with Agnes
          return null;
        },
      }),
      { name: 'pictora-cast-storage' }
    )
  )
);