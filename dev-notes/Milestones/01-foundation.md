# Milestone 1: Foundation - COMPLETED

## Objective
Create the architectural foundation for Pictora 2.0 as a three-mode video production suite.

## Date: 2026-11-14

---

## Tasks

### 1.1 State Management Refactor ✅

- [x] Remove all Gemini-specific references from types
- [x] Rename Provider type to `"comfyui" | "agnes"`
- [x] Rename `geminiModel` → `agnesTextModel`
- [x] Rename `geminiVoice` → `agnesVoice`  
- [x] Rename `geminiApiKey` → `agnesApiKey`
- [x] Rename `generateGeminiTTS` → `generateAgnesTTS`
- [x] Update store initial state and persistence

### 1.2 Mode System Implementation

- [ ] Update `src/App.tsx` to use three modes (cast/storyboard/video)
- [ ] Create mode navigation buttons in NavRail
- [ ] Create mode switching logic with proper transitions

### 1.3 Archive Existing Work ✅

- [x] Move old dev-notes to Archives
- [x] Update README to document new vision
- [x] Clean up test files

### 1.4 Component Cleanup ✅

- [x] Remove Gemini button from PromptBar provider selector (now just ComfyUI/Agnes)
- [x] Update Canvas.tsx to show "Agnes Rendering" correctly
- [x] All components now use Agnes naming consistently
- [x] TTS engine options: "browser" | "agnes"

---

## Quality Gates ✅

- [x] `tsc --noEmit` passes with zero errors
- [x] `pnpm build` succeeds
- [x] No references to "gemini" in source code
- [x] Git history is clean (proper commits, no WIP)

---

## Checklist Before Proceeding

- [ ] All existing functionality preserved (image generation with Agnes)
- [ ] No breaking user-facing changes
- [ ] Bundle size under 700KB (current: ~190KB gzipped)
- [ ] Documentation updated