# Pictora 2.0 — Video Production Suite

## Vision

Transform Pictora from an AI image generator into a **professional video production suite** with three integrated modes:

- **Cast Mode** — Pre-production: manage sessions, projects, cast, locations, props, and shot planning
- **Storyboard Mode** — Art direction: convert written scripts into visual storyboards with scene, shot, take structure, camera control, and asset placement
- **Video Mode** — Post-production: timeline-based video editing, playback, and output generation driven by storyboards

---

## Architecture Overview

```
Pictora 2.0
├── App Shell
│   ├── NavRail (left)
│   │   ├── Cast Mode
│   │   ├── Storyboard Mode  
│   │   └── Video Mode
│   ├── Workspace (center)
│   │   ├── Canvas / Editor Views
│   └── Inspector (right)
│       ├── Settings / Properties
│       └── History
│
├── Core Features
│   ├── Sessions & Projects
│   ├── AI Story Generation
│   ├── 3D/2.5D Scene Management
│   ├── Timeline Editor
│   └── Asset Pipeline
│
└── Data Flow
    Cast → Storyboard → Video → Export
```

---

## Phase 1: Foundation (Current Session)

### 1.1 State Management Refactor

**Goal**: Create modular, type-safe Zustand stores for each mode

```typescript
// src/stores/
├── castStore.ts          // Sessions, projects, cast, locations, props
├── storyboardStore.ts    // Scenes, shots, takes, camera positions, 2.5D assets
├── videoStore.ts         // Timeline, clips, edits, playback state
└── uiStore.ts            // Mode selection, panel states, modals
```

### 1.2 Mode System

**Goal**: Implement three-mode navigation with shared context

```typescript
type Mode = 'cast' | 'storyboard' | 'video';

interface UiState {
  mode: Mode;
  setMode: (mode: Mode) => void;
  
  // Panel states
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  
  // Modal states
  poseModalOpen: boolean;
  cameraModalOpen: boolean;
  settingsModalOpen: boolean;
}
```

### 1.3 Archive Existing Work

**Goal**: Preserve current Gemini/Agnes migration work

- Move all `dev-notes/` files to `dev-notes/Archives/`
- Document what was completed in GOAL.md
- Start fresh with new vision

---

## Phase 2: Cast Mode — Pre-Production Studio

### Clean UI Principles

- **No visual noise** — Only essential controls visible
- **Single primary action per view** — Clear hierarchy
- **Progressive disclosure** — Advanced features in modals

### Core Components

```
Cast Workspace
├── Session List
│   ├── Project Grouping
│   ├── Session Details
│   └── Session Actions (Duplicate, Archive, Delete)
│
├── Main Canvas
│   ├── Character Placement (drag-drop)
│   ├── Location Gallery
│   ├── Prop Library
│   └── Shot Planner (minimal)
│
├── Detail Panels
│   ├── Character Details Modal
│   │   ├── Poses (grid of pose references)
│   │   ├── Movements (key-framed)
│   │   └── Framaing Guidelines
│   │
│   ├── Location Details Modal
│   │   ├── 360° View
│   │   ├── Lighting Setup
│   │   └── Camera Positions
│   │
│   └── Prop Details Modal
│       ├── Variations
│       └── Attributes
│
└── Settings Bar (bottom)
    ├── AI Provider
    ├── Model Selection
    └── API Keys
```

### Data Model

```typescript
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

interface Pose {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  direction?: string;
}

interface Location {
  id: string;
  name: string;
  images: string[];
  lighting: string;
  cameraPositions: CameraPosition[];
}

interface Prop {
  id: string;
  name: string;
  variations: string[];
  attributes: string[];
}
```

---

## Phase 3: Storyboard Mode — Visual Direction

### Scene Structure

```
Storyboard Workspace
├── Scene List (vertical filmstrip)
│   ├── Scene ID
│   ├── Scene Title
│   ├── Shot List
│   └── Take List
│
├── Scene Editor
│   ├── Canvas (3D/2.5D)
│   │   ├── Characters (position, scale, rotation)
│   │   ├── Locations (background, lighting)
│   │   ├── Props (placement)
│   │   └── Camera (position, angle, FOV)
│   │
│   ├── Shot Controls
│   │   ├── Shot Type (CU, MCU, etc.)
│   │   ├── Frame Composition Guide
│   │   └── Save as Template
│   │
│   └── Timeline Preview (mini)
│
├── Asset Panel
│   ├── Uploaded Assets
│   ├── AI-Generated Assets
│   └── Asset Inspector (right-click menu)
│
└── AI Tools
    ├── Generate Scene from Text
    ├── Refine Scene Description
    └── Generate Character/Pose
```

### 3D/2.5D Implementation

**For 2.5D**:
- Isometric character sprites with position/animation states
- Parallax background layers for depth
- Camera as 2D transform + layer opacity

**For 3D** (future):
- Three.js integration for full 3D scenes
- GLTF asset loader
- Basic orbit camera controls

### Data Model

```typescript
interface Scene {
  id: string;
  sessionId: string;
  number: number;
  title: string;
  description: string;
  shots: Shot[];
}

interface Shot {
  id: string;
  sceneId: string;
  number: number;
  type: ShotType;
  description: string;
  camera: Camera;
  elements: Element[];
}

interface Take {
  id: string;
  shotId: string;
  number: number;
  version: number;
  imageData: string;
  notes: string;
}

interface Camera {
  position: { x: number; y: number; z: number };
  angle: number;
  fov: number;
  shotType: ShotType;
}

type ShotType = 
  | 'establishing' | 'wide' | 'medium' | 'close-up' 
  | 'extreme close-up' | 'over the shoulder' | 'point of view';
```

---

## Phase 4: Video Mode — Post-Production

### Timeline Architecture

```
Video Workspace
├── Timeline (horizontal)
│   ├── Tracks
│   │   ├── Video Track 1
│   │   ├── Video Track 2
│   │   ├── Audio Track 1
│   │   └── Audio Track 2
│   │
│   ├── Clips (from Storyboard Takes)
│   ├── Transitions
│   ├── Key-frames
│   └── Trim Handles
│
├── Preview Window
│   ├── Play/Pause
│   ├── Scrubbing
│   ├── Frame Step
│   └── Zoom Controls
│
├── Edit Tools (minimal set)
│   ├── Trim
│   ├── Split
│   ├── Volume
│   └── Fade
│
├── Export Panel
│   ├── Format Selection
│   ├── Resolution
│   ├── Frame Rate
│   └── Quality Settings
```

### Storyboard-to-Video Flow

```
Storyboard Take 
  → Generate Video Clip (via AI or template)
  → Apply to Timeline
  → Add Transitions
  → Add Audio/Music
  → Export Final Video
```

---

## Technical Stack (Unchanged)

- **React 19 + TypeScript** — Component model
- **Vite 6** — Build tool
- **Zustand** — State management
- **TanStack Router** — File-based routing
- **Tailwind CSS** — Styling
- **Motion** — Animations
- **Agnes AI** — Image/Story generation

---

## Success Criteria

- [ ] Clean git repo with proper branch strategy
- [ ] Three distinct modes with clear navigation
- [ ] Cast mode: Session/project management with clean UI
- [ ] Storyboard mode: Scene/shot/take structure with 3D controls
- [ ] Video mode: Timeline with storyboard import
- [ ] All quality gates pass: `tsc --noEmit`, `pnpm build`
- [ ] No Gemini references remaining
- [ ] Comprehensive documentation for developers

---

## Milestones

| Milestone | Description | ETA |
|-----------|-------------|-----|
| 1.0.0 | Foundation: Mode system, state refactor, archived docs | --- |
| 2.0.0 | Cast Mode: Clean UI, sessions, projects, cast/location/prop | TBD |
| 2.1.0 | Storyboard Mode: Scenes, shots, 3D camera, assets | TBD |
| 2.2.0 | Video Mode: Timeline, preview, export | TBD |
| 3.0.0 | Polishing: Performance, accessibility, production ready | TBD |