# Pictora — Full Agnes AI Refactor (COMPLETED)

## Objective
Replace ALL Google Gemini API usage with Agnes AI Hub across the entire Pictora application, following the Agnes AI skill specification.

## Changes Made

### 1. `src/features/generator/store/useGeneratorStore.ts` — Core state + all AI logic
- Removed `import { GoogleGenAI } from "@google/genai"`
- Added `agnesFetch()` — OpenAI-compatible fetch wrapper (auth, JSON body, response parsing)
- Added `parseAgnesError()` — Agnes-specific error mapping (quota 429, permission 403, safety)
- Removed `parseGeminiError()` entirely
- State: `geminiApiKey` → kept as legacy field; `geminiModel` → default `'agnes-2.5-flash'`; added `agnesImageModel` default `'agnes-image-2.5-flash'`
- Added `setAgnesApiUrl`, `setAgnesApiKey`, `setAgnesImageModel` actions
- `generateGeminiTTS` → Agnes has no TTS endpoint; falls back to browser `SpeechSynthesisUtterance`
- `randomizePrompt` → `POST /chat/completions` with `agnes-2.5-flash`
- `describeImage` → `POST /chat/completions` with `image_url` in content + `extra_body.response_format: text`
- `generateImages` → `POST /images/generations` with Agnes conventions:
  - `size` tiers (`1K`, `2K`, etc.) instead of raw widthxheight
  - `ratio` parameter (`1:1`, `16:9`, etc.)
  - `response_format` + `image` refs in `extra_body`
  - Image references (subject/scene/style) passed as `extra_body.image` array
- `generateStoryboardOutline` → `POST /chat/completions` JSON array output
- `generateStoryboardSceneImage` → `POST /images/generations` with style suffix
- Removed all `if (provider === 'gemini')` blocks; only `agnes` and `comfyui` remain
- Updated `partialize` to persist `agnesApiKey`, `agnesApiUrl`, `agnesImageModel`

### 2. `src/features/generator/components/PromptBar.tsx`
- Removed `GoogleGenAI` import, added `agnesFetch` + `parseAgnesError` imports
- `handleRefine` → Agnes `/chat/completions` enhance prompt
- Replaced `GEMINI_MODELS` with `AGNES_MODELS` (`agnes-image-2.5-flash`, `agnes-image-2.5`)
- Provider selector: Gemini button removed, Agnes button added alongside ComfyUI
- AdvancedSettings: Agnes model selector + API Key (Required) field; removed Gemini model/API key fields
- QuotaIndicator: checks `agnesApiKey`, shows when `provider === 'agnes'`

### 3. `src/features/generator/components/ImageEditorModal.tsx`
- Removed `GoogleGenAI` import
- `handleExecuteAiEdit` → Agnes `/images/generations` with:
  - Base image as first `extra_body.image` ref
  - Mask as second `extra_body.image` ref (when painted)
  - Canvas-based mask compositing preserved
  - `parseAgnesError` for error handling

### 4. `src/features/generator/components/StoryboardWorkspace.tsx`
- Removed `GoogleGenAI` import and `geminiApiKey` from store destructuring

### 5. `src/features/generator/components/Canvas.tsx`
- Replaced `geminiModel` with `agnesImageModel` in store destructuring
- Updated status text to show Agnes model name

## Quality Gates
- `tsc --noEmit` ✅ Zero errors
- `vite build` ✅ Build succeeds (670KB JS, 190KB gzipped)

## Files Modified
- `src/features/generator/store/useGeneratorStore.ts` — Agnes state, actions, all generation logic
- `src/features/generator/components/PromptBar.tsx` — Agnes provider UI, model selector, API settings
- `src/features/generator/components/ImageEditorModal.tsx` — Agnes image editing
- `src/features/generator/components/StoryboardWorkspace.tsx` — removed Gemini imports
- `src/features/generator/components/Canvas.tsx` — Agnes model display

## Out of Scope (not changed)
- ComfyUI provider (kept as-is)
- Sidebar/PromptBar layout refactor (done in previous session)
- StoryboardWorkspace layout optimization (done in previous session)
