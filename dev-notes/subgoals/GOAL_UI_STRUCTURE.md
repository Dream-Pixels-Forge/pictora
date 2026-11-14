# Pictora UI Structure & UX Clarity — Subgoal

## Objective
Turn Pictora's dense, noisy interface into a calm, well-organized app with one obvious path per task. Every screen gets a clear layout (navigation → workspace → inspector), one primary action, readable type, and a small shared set of design tokens and components, with no loss of existing functionality.

## Why (baseline audit, 2026-11-04)

Measured on the current `main` working tree:

| Signal | Baseline | Problem |
|--------|----------|---------|
| Arbitrary font sizes (`text-[Npx]`) | **269** uses across 11 sizes (7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 13, 16px) | No type scale; 7–9px text is unreadable |
| Sub-10px text | **130** uses (`text-[9px]` 62, `[8px]` 28, `[8.5px]` 17, `[9.5px]` 12, `[7px]` 7, `[7.5px]` 4) | Fails legibility, adds visual noise |
| Hard-coded dark backgrounds | **12+** near-identical greys (`#111`, `#111111`, `#141414`, `#151515`, `#181818`, `#1a1a1a`, `#1A1A1A`, `#222`, `#0E0E10`, `#18191b`…) | No surface hierarchy; panels blur together |
| Corner radii | 8 variants (`none`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `full`) | Inconsistent shape language |
| `<button>`s per component | StoryboardWorkspace 51, ImageEditorModal 33, PromptBar 26, Sidebar 25 | Too many equal-weight actions; no hierarchy |
| Component size | StoryboardWorkspace 2287 lines, PromptBar 1286, ImageEditorModal 1194 | Monoliths hide structure and resist reuse |
| Layout | Left Sidebar + main + right HistorySidebar **open by default** | Three columns compete for attention; canvas gets squeezed |
| Duplicated controls | `StyleChips` and `StylePicker` both in PromptBar; References live in a PromptBar modal while Storyboard has its own Reference Keys | Same concept, two places |
| Global shortcuts | `⌘/Ctrl+Enter` in `App.tsx` calls `generateImages()` in every view, storyboard included; `R`/`E` listed in help but not wired in `App.tsx` | Shortcuts that don't match what's on screen |

## Design Principles (the rules every change is checked against)

1. **One primary action per view.** Canvas → *Generate*. Storyboard → *Render Frame*. Editor → *Apply Edit*. Everything else is secondary (ghost/outline) or tertiary (icon + tooltip).
2. **Progressive disclosure.** Show the 20% used 80% of the time. Advanced settings, provider config, and power-user options live behind a single "More" / inspector panel, collapsed by default.
3. **One place per concept.** Styles, references, aspect ratio, and provider settings each have exactly one home, reused across Canvas and Storyboard.
4. **Stable regions.** Navigation on the left, work in the center, context (history, inspector) on the right, prompt/actions anchored at the bottom. Regions don't shift between modes.
5. **Tokens, not literals.** No new `text-[Npx]`, `bg-[#hex]`, or ad-hoc radii in components. Use `@theme` tokens only.
6. **Readable by default.** Minimum body/label size 11px (`text-xs`), meta size 10px only for badges, WCAG AA contrast on all text.

## Scope of Work

### Phase 1 — Design tokens foundation (`src/index.css`)
- [ ] Define a **type scale** in `@theme`: `--text-meta` (10px), `--text-label` (11px), `--text-body` (13px), `--text-title` (16px), `--text-display` (20px+). Map Tailwind classes to them.
- [ ] Define **surface tokens** for a 4-step elevation ramp: `--color-surface-0` (app bg `#0A0A0A`), `-1` (panels), `-2` (cards/inputs), `-3` (popovers/modals), plus `--color-border-subtle` / `--color-border-strong`.
- [ ] Define **text tokens**: `--color-fg`, `--color-fg-muted`, `--color-fg-subtle`. Remove the `!important` overrides of `.text-white/20…/50` once components use tokens.
- [ ] Fix **radii** to 3 values: `--radius-control` (inputs/buttons), `--radius-card` (cards/panels), `--radius-pill` (chips/avatars).
- [ ] Define **spacing rhythm**: 4px base; panel padding 16px, section gap 24px, control gap 8px.

### Phase 2 — Shared UI primitives (`src/features/ui/`)
- [ ] `Button` with variants `primary | secondary | ghost | icon` and sizes `sm | md`. Only `primary` uses `pictora-yellow`.
- [ ] `IconButton` (with required `aria-label` + tooltip).
- [ ] `Panel` / `PanelSection` (title, optional collapse, consistent padding).
- [ ] `Disclosure` (collapsible section, used for every "advanced" block).
- [ ] `Modal` (one shell: backdrop, focus trap, `Esc` to close, `role="dialog"`), replacing the hand-rolled modals in `App.tsx`, `PromptBar.tsx`, `UpscalerModal.tsx`, `ExportStoryboardModal.tsx`, `ImageEditorModal.tsx`.
- [ ] `Chip` / `SegmentedControl` (styles, aspect ratios, provider, mode toggle).
- [ ] `EmptyState` (icon, one line, one CTA).

### Phase 3 — App shell & information architecture (`src/App.tsx`)
- [ ] Define the shell explicitly: `NavRail` (left, collapsible to icons) · `Workspace` (center) · `Inspector` (right, contextual) · `ActionBar` (bottom, Canvas mode).
- [ ] **HistorySidebar collapsed by default**; opens as the right Inspector tab "History", so it doesn't compete with the canvas on first load.
- [ ] Mode switch (Canvas / Storyboard) becomes one `SegmentedControl` at the top of the NavRail; nothing else in the shell changes between modes.
- [ ] Scope keyboard shortcuts per view: `⌘/Ctrl+Enter` → Generate in Canvas, Render Frame in Storyboard; wire or remove `R`/`E` so the help modal matches reality.

### Phase 4 — Canvas mode clean-up
- [ ] **PromptBar** (1286 lines) → split into `PromptInput`, `PromptActions` (Randomize, Refine, Generate), `StyleSelector` (merge `StyleChips` + `StylePicker` into one), `AspectRatioSelector`, `ReferencesButton`.
- [ ] Move `AdvancedSettings` (provider, model, API keys, quota) out of the prompt area into the Inspector "Settings" tab or a Settings modal. Prompt bar shows only prompt, style, ratio, references, Generate.
- [ ] **Canvas**: one empty state (suggested prompts as 3–4 chips max); image card actions (Edit, Upscale, Download, Reuse prompt) in a hover toolbar, not always visible.
- [ ] **Sidebar** (734 lines): keep only navigation, projects, and profile. Featured ideas move to the Canvas empty state; storyboard deck moves into Storyboard mode.

### Phase 5 — Storyboard & modals
- [ ] **StoryboardWorkspace** (2287 lines) → split into `StoryboardHeader`, `SceneList`/`Filmstrip`, `SceneEditor`, `SceneViewport`, `StoryboardInspector` (style presets, audio, reference keys as `Disclosure` sections).
- [ ] Reuse the Phase 4 `StyleSelector` and the single References component instead of storyboard-specific copies.
- [ ] **ImageEditorModal** (1194 lines): tool palette (left) · canvas (center) · tool options (right) · Apply/Cancel footer. One primary action.
- [ ] **UpscalerModal** / **ExportStoryboardModal**: migrate onto the shared `Modal` shell with a consistent header/footer.

### Phase 6 — Polish & verification
- [ ] Responsive pass at 1280, 1440, 1920 and a 1024 narrow layout (NavRail auto-collapses, Inspector becomes overlay).
- [ ] Accessibility pass: every icon-only button labeled, focus order follows regions, modals trap focus, AA contrast verified.
- [ ] Before/after screenshots of Canvas (empty + with results), Storyboard, Image Editor for the PR.

## Success Criteria (checkable)
- [ ] `grep -rE 'text-\[[0-9.]+px\]' src` → **0** matches (was 269)
- [ ] `grep -rE 'bg-\[#[0-9a-fA-F]+\]' src` → **0** matches outside `index.css` tokens
- [ ] No text below 10px anywhere; labels/body ≥ 11px
- [ ] Radius classes limited to the 3 tokenized values
- [ ] Each view has exactly **one** `primary` Button visible at a time
- [ ] No component file > **500** lines (StoryboardWorkspace, PromptBar, ImageEditorModal, Sidebar split)
- [ ] Visible buttons on first load of Canvas mode reduced by **≥ 40%** (measure via DOM count before/after)
- [ ] All modals use the shared `Modal` primitive; `Esc` closes every modal
- [ ] HistorySidebar collapsed by default; shortcuts help modal lists only working shortcuts
- [ ] All existing features still reachable (generate, refine, randomize, references, styles, ratios, providers, edit, upscale, storyboard, export, auth)
- [ ] `tsc --noEmit` ✅ · `pnpm lint` ✅ zero warnings · `vite build` ✅
- [ ] Unit/component tests for new primitives (`Button`, `Modal`, `Disclosure`, `StyleSelector`) pass

## Execution Notes
- Follow the workspace mandates (AGENTS.md): pipeline-orchestrator + git-driven-development skills, TDD, subagent-driven work.
- One branch per phase: `refactor/ui-tokens`, `refactor/ui-primitives`, `refactor/app-shell`, `refactor/canvas-ux`, `refactor/storyboard-ux`, `chore/ui-polish`. Phases 1→2 are sequential; Phases 4 and 5 can run in parallel once 2–3 land (they touch different files).
- Atomic conventional commits; each phase ends with the quality gates green and a before/after screenshot.
- Behavior-preserving: this is a reorganization. No new AI features, no store logic changes beyond what shortcut scoping needs.

## Out of Scope
- AI provider logic in `useGeneratorStore.ts` (Agnes / ComfyUI behavior)
- New features or new generation capabilities
- Light theme (tokens should make it possible later, but it isn't shipped here)
- SplashScreen / SignInScreen redesign (token migration only)
