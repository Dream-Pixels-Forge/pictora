# Milestone 1: Foundation

## Objective
Create the architectural foundation for Pictora 2.0 as a three-mode video production suite.

## Date: 2026-11-14

---

## Tasks

### 1.1 State Management Refactor

- [ ] Create modular Zustand stores directory (`src/stores/`)
- [ ] Create `uiStore.ts` with Mode type definition
- [ ] Migrate current generator state to `generatorStore.ts`
- [ ] Remove all Gemini-specific references from types
- [ ] Ensure type safety with Provider union type

### 1.2 Mode System Implementation

- [ ] Update `src/App.tsx` to use three modes (cast/storyboard/video)
- [ ] Create mode navigation buttons in NavRail
- [ ] Update provider type to exclude 'gemini'
- [ ] Create mode switching logic with proper transitions

### 1.3 Archive Existing Work

- [ ] Move `dev-notes/subgoals/` to `dev-notes/Archives/`
- [ ] Move `GOAL_UI_STRUCTURE.md` to Archives
- [ ] Update README to document new vision
- [ ] Clean up any remaining test files

### 1.4 Component Cleanup

- [ ] Remove Gemini UI buttons from PromptBar
- [ ] Update Canvas.tsx text from "Agnes Rendering" to appropriate messaging
- [ ] Ensure all components are agnostic to Gemini naming

---

## Quality Gates

- [ ] `tsc --noEmit` passes with zero errors
- [ ] `pnpm build` succeeds
- [ ] No references to "gemini" in source code (except Agnes comments)
- [ ] Git history is clean (proper commits, no WIP)

---

## Checklist Before Proceeding

- [ ] All existing functionality preserved (image generation with Agnes)
- [ ] No breaking user-facing changes
- [ ] Bundle size under 700KB
- [ ] Documentation updated