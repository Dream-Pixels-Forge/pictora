/**
 * Video Store - Post-production state
 *
 * Manages timeline, clips, edits, playback, and output generation
 * for the Video Mode (post-production phase).
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// --- Types ---

export interface Clip {
  id: string;
  shotId?: string;
  sceneId?: string;
  trackId: string;
  startTime: number;
  endTime: number;
  duration: number;
  mediaUrl?: string;
  thumbnailUrl?: string;
  inPoint?: number;
  outPoint?: number;
  speed: number;
  transition?: Transition;
  effects?: ClipEffect[];
  muted: boolean;
  volume: number;
  locked: boolean;
  name?: string;
}

export interface Transition {
  id: string;
  type: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'push' | 'slide';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down' | 'center';
}

export interface ClipEffect {
  id: string;
  type: 'blur' | 'brightness' | 'contrast' | 'saturation' | 'opacity';
  value: number;
  enabled: boolean;
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'titles';
  clips: Clip[];
  muted: boolean;
  solo: boolean;
  volume: number;
  locked: boolean;
}

export interface Timeline {
  tracks: Track[];
  duration: number;
  currentTimecode: number;
  isPlaying: boolean;
  playbackRate: number;
}

export interface ExportSettings {
  format: 'mp4' | 'webm' | 'gif' | 'mov';
  resolution: '240p' | '360p' | '480p' | '720p' | '1080p' | '4k';
  frameRate: 24 | 30 | 60;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  codec: string;
  preset?: string;
}

export interface VideoState {
  // Timeline
  timeline: Timeline;

  // Export
  exportSettings: ExportSettings;
  exportProgress: number;
  isExporting: boolean;

  // Preview
  previewScale: number;
  previewOffset: { x: number; y: number };

  // Actions
  addTrack: (name: string, type: 'video' | 'audio' | 'titles') => string;
  removeTrack: (trackId: string) => void;

  addClip: (clip: Omit<Clip, 'id' | 'duration'>) => string;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;

  moveClip: (clipId: string, newStartTime: number) => void;

  play: () => void;
  pause: () => void;
  stop: () => void;
  setTimecode: (timecode: number) => void;
  setPlaybackRate: (rate: number) => void;

  setExportSettings: (settings: Partial<ExportSettings>) => void;
  exportVideo: () => Promise<string>;

  importStoryboard: (sceneIds: string[]) => Promise<void>;
  clearTimeline: () => void;
}

// --- Store ---

export const useVideoStore = create<VideoState>()(
  devtools(
    persist(
      (set, get) => ({
        timeline: {
          tracks: [],
          duration: 0,
          currentTimecode: 0,
          isPlaying: false,
          playbackRate: 1,
        },

        exportSettings: {
          format: 'mp4',
          resolution: '1080p',
          frameRate: 30,
          quality: 'high',
          codec: 'h264',
        },

        exportProgress: 0,
        isExporting: false,

        previewScale: 1,
        previewOffset: { x: 0, y: 0 },

        addTrack: (name: string, type: 'video' | 'audio' | 'titles') => {
          const id = crypto.randomUUID();
          const track: Track = {
            id,
            name,
            type,
            clips: [],
            muted: false,
            solo: false,
            volume: 1,
            locked: false,
          };
          set((state) => ({
            timeline: {
              ...state.timeline,
              tracks: [...state.timeline.tracks, track],
            },
          }));
          return id;
        },

        removeTrack: (trackId: string) => {
          set((state) => ({
            timeline: {
              ...state.timeline,
              tracks: state.timeline.tracks.filter(t => t.id !== trackId),
            },
          }));
        },

        addClip: (clip: Omit<Clip, 'id' | 'duration'>) => {
          const id = crypto.randomUUID();
          const duration = clip.endTime - clip.startTime;
          const newClip: Clip = { ...clip, id, duration };

          set((state) => ({
            timeline: {
              ...state.timeline,
              tracks: state.timeline.tracks.map(t =>
                t.id === clip.trackId
                  ? { ...t, clips: [...t.clips, newClip] }
                  : t
              ),
              duration: Math.max(state.timeline.duration, clip.endTime),
            },
          }));
          return id;
        },

        removeClip: (clipId: string) => {
          set((state) => ({
            timeline: {
              ...state.timeline,
              tracks: state.timeline.tracks.map(t => ({
                ...t,
                clips: t.clips.filter(c => c.id !== clipId),
              })),
            },
          }));
        },

        updateClip: (clipId: string, updates: Partial<Clip>) => {
          set((state) => ({
            timeline: {
              ...state.timeline,
              tracks: state.timeline.tracks.map(t => ({
                ...t,
                clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c),
              })),
            },
          }));
        },

        moveClip: (clipId: string, newStartTime: number) => {
          const clip = get().timeline.tracks
            .flatMap(t => t.clips)
            .find(c => c.id === clipId);

          if (clip) {
            const offset = newStartTime - clip.startTime;
            set((state) => ({
              timeline: {
                ...state.timeline,
                tracks: state.timeline.tracks.map(t => ({
                  ...t,
                  clips: t.clips.map(c =>
                    c.id === clipId
                      ? { ...c, startTime: newStartTime, endTime: newStartTime + c.duration }
                      : c
                  ),
                })),
              },
            }));
          }
        },

        play: () => set({
          timeline: { ...get().timeline, isPlaying: true }
        }),

        pause: () => set({
          timeline: { ...get().timeline, isPlaying: false }
        }),

        stop: () => set({
          timeline: { ...get().timeline, isPlaying: false, currentTimecode: 0 }
        }),

        setTimecode: (timecode: number) => set({
          timeline: { ...get().timeline, currentTimecode: timecode }
        }),

        setPlaybackRate: (rate: number) => set({
          timeline: { ...get().timeline, playbackRate: rate }
        }),

        setExportSettings: (settings: Partial<ExportSettings>) => {
          set((state) => ({
            exportSettings: { ...state.exportSettings, ...settings },
          }));
        },

        exportVideo: async () => {
          set({ isExporting: true, exportProgress: 0 });

          // TODO: Implement actual video export
          // This would use WebCodecs API or a worker for processing

          const settings = get().exportSettings;
          set({ isExporting: false, exportProgress: 100 });

          return '';
        },

        importStoryboard: async (sceneIds: string[]) => {
          // This will be implemented to import storyboard scenes as clips
          // For now, placeholder
        },

        clearTimeline: () => set({
          timeline: {
            tracks: [],
            duration: 0,
            currentTimecode: 0,
            isPlaying: false,
            playbackRate: 1,
          },
        }),
      }),
      { name: 'pictora-video-storage' }
    )
  )
);