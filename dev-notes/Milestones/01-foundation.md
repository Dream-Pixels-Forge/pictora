# Milestone 1: Foundation

## Objective
Create the architectural foundation for Pictora 2.0 as a three-mode video production suite.

## Date: 2026-11-14

---

## Tasks

### 1.1 State Management Refactor

- [x] Create modular Zustand stores directory (`src/stores/`)
- [x] Create `uiStore.ts` with Mode type definition
- [x] Migrate current generator state to `generatorStore.ts`
- [x] Remove all Gemini-specific references from types
- [x] Ensure type safety with Provider union type

### 1.2 Mode System Implementation

- [x] Update `src/App.tsx` to use three modes (cast/storyboard/video)
- [x] Create mode navigation buttons in NavRail (Sidebar.tsx)
- [x] Update provider type to exclude 'gemini'
- [x] Create mode switching logic with proper transitions
- [x] Create VideoWorkspace component with timeline, clips, and cast/export dialogs

### 1.3 Archive Existing Work

- [x] Move all `dev-notes/subgoals/` files to `dev-notes/Archives/`
- [x] Update GOAL.md to document current vision
- [ ] Clean up any remaining test files

### 1.4 Component Cleanup

- [x] Remove Gemini UI buttons from PromptBar
- [x] Update Canvas.tsx text from "Agnes Rendering" to appropriate messaging
- [x] Ensure all components are agnostic to Gemini naming

---

## Quality Gates

- [x] `tsc --noEmit` passes with zero errors
- [x] `pnpm build` succeeds
- [x] No references to "gemini" in source code (except Agnes comments)
- [x] Git history is clean (proper commits, no WIP)

---

## Checkmark Before Proceeding

- [x] All existing functionality preserved (image generation with Agnes)
- [ ] No breaking user-facing changes
- [ ] Bundle size under 700KB (current: ~190KB gzipped)
- [ ] Documentation updated