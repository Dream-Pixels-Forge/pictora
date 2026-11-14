/**
 * Stores - Modular Zustand stores for Pictora 2.0
 *
 * This barrel file exports all stores for clean imports.
 *
 * Mode types:
 * - 'cast' - Pre-production: sessions, projects, cast, locations, props, shot planning
 * - 'storyboard' - Art direction: scenes, shots, takes, camera control, asset placement
 * - 'video' - Post-production: timeline, clips, edits, playback, output generation
 */

// UI Store - Mode selection, panel states, modals
export { useUiStore } from './uiStore';
export type { UiState, Mode, PanelState } from './uiStore';

// Cast Store - Pre-production studio state
export { useCastStore } from './castStore';

// Storyboard Store - Art direction state
export { useStoryboardStore } from './storyboardStore';

// Video Store - Post-production state
export { useVideoStore } from './videoStore';

// Generator Store - Image generation, storyboard, TTS (moved from features/generator)
export { useGeneratorStore } from '../features/generator/store/useGeneratorStore';
export type { Provider, AspectRatio, StoryboardProject, StoryboardScene } from '../features/generator/store/useGeneratorStore';

// Mode helpers
export const MODES: {
  CAST: 'cast';
  STORYBOARD: 'storyboard';
  VIDEO: 'video';
} = {
  CAST: 'cast',
  STORYBOARD: 'storyboard',
  VIDEO: 'video',
};