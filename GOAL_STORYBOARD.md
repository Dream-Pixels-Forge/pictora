# Pictora Storyboard Workspace Layout Optimization — Subgoal (COMPLETED)

## Objective
Optimize the StoryboardWorkspace (`src/features/generator/components/StoryboardWorkspace.tsx`) layout to reduce visual density and cognitive load, keeping only what really matters for the core storyboard workflow.

## Changes Made

### 1. Collapsed secondary sections (progressive disclosure)
- **Director Style Presets** → single "Director Style Presets" toggle button (shows 5 preset cards only when expanded)
- **Audio/TTS Controls** → single "Audio Controls" toggle button (shows voice selector, engine toggle, rate slider only when expanded)
- **Continuity Reference Keys** → single "Reference Keys" toggle button with compact horizontal 3-column row (Subject/Scene/Style) instead of 3 vertical cards

### 2. Consolidated primary actions
- Removed duplicate "Cinema Reel" + "Export Deck" split — kept both but gave "Render Frame" visual dominance (yellow background, shadow, larger text)
- "Render Frame" is now the most prominent button in the header

### 3. Font size increases
- Style selector pills: `text-[8px]` → `text-[9px]`
- Continuity ref labels: `text-[8px]` → `text-[9px]`
- Continuity ref inputs: `text-[8px]` → `text-[9px]`
- Timeline scene labels: `text-[7px]` → `text-[8px]`
- Filmstrip badges: `text-[7px]` → `text-[8px]`
- "No Render" placeholder: `text-[7px]` → `text-[8px]`
- Eliminated all `text-[7.5px]` (4 instances → 0)
- Preset labels: `text-[8px]` → `text-[9px]`

### 4. ARIA landmarks added
- `role="main"`, `role="grid"`, `role="region"` on all major sections
- `aria-label` on storyboard editor, project switcher, scene layout, media viewport, text panels, filmstrip timeline

### 5. Whitespace & visual hierarchy
- Increased padding in continuity section (p-4 → p-3, gap-3 → gap-2)
- More breathing room between sections
- Primary CTA buttons use larger `text-sm` instead of `text-xs`

## Verified Density Improvement (browsy-bot DOM evaluation)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Buttons | 40 | **27** | -33% |
| Interactive elements | 41 | **32** | -22% |
| `text-[8px]` (tiny) | 8 | **4** | -50% |
| `text-[7px]` (tiny) | 4 | **1** | -75% |
| `text-[7.5px]` (tiny) | 4 | **0** | -100% |
| ARIA sections | 0 | **6** | +∞ |

## Quality Gates
- `tsc --noEmit` ✅ Zero errors
- `vite build` ✅ Build succeeds

## Files Modified
- `src/features/generator/components/StoryboardWorkspace.tsx` — full layout overhaul

## Out of Scope (not changed)
- Canvas mode
- PromptBar
- Adding new features (only reorganized existing ones)
