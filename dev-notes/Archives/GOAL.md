# Pictora Sidebar Refactor — Subgoal

## Objective
Refactor the Sidebar into a modern, compact panel, move the 3 reference inputs (Subject, Scene, Style) from Sidebar into a single References modal in PromptBar, increase prompt textarea height, and add Agnes AI Hub provider for image/chat/video generation.

## Changes Made

### 1. Sidebar.tsx — Slimmed down
- Removed `SidebarSection` component (Subject/Scene/Style image upload + description inputs)
- Removed all 3 `SidebarSection` usages from the references tab
- Removed unused store destructuring (subjectImage, sceneImage, styleImage, subjectText, sceneText, styleText and setters)
- Removed `User`, `MapPin`, `PenTool`, `Trash2` from imports (kept `User`, `Trash2` for storyboard deck)
- Sidebar now handles: mode toggle, tab selection, storyboard deck, featured ideas, project switcher, export, auth/profile

### 2. PromptBar.tsx — Reference inputs + Agnes provider
- Added `ReferenceModalInput` component (image upload + description per reference key)
- Added "Reference Keys" button that opens a modal with Subject/Scene/Style inputs in a 3-column grid
- Made prompt textarea taller: `min-h-[44px]` → `min-h-[64px]`, `max-h-[150px]` → `max-h-[200px]`, `py-2` → `py-3`
- Added `"agnes"` to Provider type
- Added Agnes button alongside Gemini/ComfyUI in provider selection
- Added Agnes API settings (URL + API key) in AdvancedSettings panel
- Added `agnesApiUrl`, `setAgnesApiUrl`, `agnesApiKey`, `setAgnesApiKey` to store destructuring and props
- Added QuotaIndicator provider type update

### 3. useGeneratorStore.ts — Agnes provider state
- Added `"agnes"` to `export type Provider`
- Added `agnesApiUrl` (default: `https://apihub.agnes-ai.com/v1`) and `agnesApiKey` to state
- Added `setAgnesApiUrl` and `setAgnesApiKey` actions
- Added Agnes generation path in `generateImages` (OpenAI-compatible `POST /images/generations`)
- Added Agnes fields to persist `partialize` list

## Success Criteria (checkable)
- [x] `tsc --noEmit` passes with zero errors
- [x] `vite build` succeeds
- [x] Sidebar no longer renders Subject/Scene/Style `SidebarSection` components
- [x] PromptBar has "Reference Keys" button opening modal with 3 reference inputs
- [x] PromptBar textarea min-height increased to 64px
- [x] Agnes provider available in provider selector with API URL/Key settings
- [x] All existing functionality preserved
