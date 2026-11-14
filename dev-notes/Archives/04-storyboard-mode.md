---
name: storyboard-mode
description: Art direction with scenes, shots, takes, camera control, 2.5D assets
metadata:
  type: project  
---

# Subgoal 2.1: Storyboard Mode — Visual Direction

## Objective
Create a storyboard editor with scene structure, 3D/2.5D character rendering, and camera control.

## Scene Structure

### Storyboard Workspace Layout
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

## 3D/2.5D Implementation

### 2.5D Approach (MVP)
- Isometric character sprites with position/animation states
- Parallax background layers for depth
- Camera as 2D transform + layer opacity

### 3D Approach (Future)
- Three.js integration for full 3D scenes
- GLTF asset loader
- Basic orbit camera controls

## Data Model
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

## Storyboard-to-Video Flow
Scene Take → Generate Video Clip → Apply to Timeline → Add Transitions → Add Audio/Music → Export Final Video