---
name: mode-system
description: Implement three-mode navigation (Cast/Storyboard/Video)
metadata:
  type: project
---

# Subgoal 1.2: Mode System Implementation

## Objective
Implement three-mode navigation with shared context and proper transitions.

## Tasks
- [ ] Update `src/stores/uiStore.ts` with Mode type definition
- [ ] Create `src/components/NavRail.tsx` — Mode navigation buttons
- [ ] Update `src/App.tsx` — Switch workspace based on mode
- [ ] Implement mode transition animations
- [ ] Add keyboard shortcuts for mode switching (1/2/3)

## Mode Definition
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

## Navigation Structure
- NavRail (left sidebar) with three mode buttons
- Workspace (center) renders different views per mode
- Inspector (right sidebar) shows context-sensitive tools