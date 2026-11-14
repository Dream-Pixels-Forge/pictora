---
name: state-refactor
description: Create modular Zustand stores for Cast, Storyboard, Video modes
metadata:
  type: project
---

# Subgoal 1.1: State Management Refactor

## Objective
Create modular, type-safe Zustand stores for each mode, replacing the monolithic generator store.

## Tasks
- [ ] Create `src/stores/castStore.ts` — Sessions, projects, cast, locations, props, poses, movements, framing
- [ ] Create `src/stores/storyboardStore.ts` — Scenes, shots, takes, camera positions, 2.5D assets
- [ ] Create `src/stores/videoStore.ts` — Timeline, clips, edits, playback state
- [ ] Create `src/stores/uiStore.ts` — Mode selection, panel states, modals
- [ ] Update `src/stores/index.ts` — Re-export all stores for clean imports
- [ ] Migrate existing generator state to appropriate stores

## Data Models (TypeScript)
```typescript
// Cast Store
interface CastSession {
  id: string;
  name: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  director: string;
  logline: string;
}

interface Character {
  id: string;
  name: string;
  sessionId: string;
  poses: Pose[];
  movements: Movement[];
  framing: Framing[];
}

interface Pose { id: string; name: string; imageUrl: string; description: string; direction?: string; }
interface Location { id: string; name: string; images: string[]; lighting: string; cameraPositions: CameraPosition[]; }
interface Prop { id: string; name: string; variations: string[]; attributes: string[]; }

// Storyboard Store  
interface Scene { id: string; sessionId: string; number: number; title: string; description: string; shots: Shot[]; }
interface Shot { id: string; sceneId: string; number: number; type: ShotType; description: string; camera: Camera; elements: Element[]; }
interface Take { id: string; shotId: string; number: number; version: number; imageData: string; notes: string; }
type ShotType = 'establishing' | 'wide' | 'medium' | 'close-up' | 'extreme close-up' | 'over the shoulder' | 'point of view';

// Video Store
interface Clip { id: string; shotId: string; startTime: number; endTime: number; mediaUrl?: string; }
interface Timeline { tracks: Track[]; duration: number; currentTimecode: number; }
interface Track { id: string; name: string; clips: Clip[]; }
```