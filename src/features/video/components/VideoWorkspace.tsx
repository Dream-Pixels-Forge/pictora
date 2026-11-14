import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play, Pause, Rewind, FastForward, SkipBack, SkipForward,
  Film, Clock, Timer, Volume2, VolumeX, Maximize2, Minimize2,
  Trash2, Save, Download, Heart, Users, Layers, Settings,
  ChevronLeft, ChevronRight, Plus, Edit3, Shuffle, X
} from "lucide-react";
import { useGeneratorStore } from "@/features/generator/store/useGeneratorStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Video timeline interface
interface VideoClip {
  id: string;
  sceneId: string;
  startTime: number;  // in seconds
  duration: number;   // in seconds
  inPoint: number;    // in seconds within the source
  outPoint: number;   // in seconds within the source
}

// Cast member interface for video casting
interface CastMember {
  id: string;
  name: string;
  role?: string;
  voiceId?: string;
  personality?: string;
  imagePrompt?: string;
  imageUrl?: string | null;
}

export const VideoWorkspace = () => {
  const {
    // Storyboard state
    storyboardScenes,
    activeSceneId,
    setActiveSceneId,
    addStoryboardScene,

    // Generation state
    images,
    generateImages,
    setPrompt,
    provider,
    aspectRatio,

    // User state
    isAuthenticated,
  } = useGeneratorStore();

  // Video workspace state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Timeline state
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Cast members
  const [castMembers, setCastMembers] = useState<CastMember[]>([]);
  const [showCastDialog, setShowCastDialog] = useState(false);

  // Video export settings
  const [exportQuality, setExportQuality] = useState<"720p" | "1080p" | "4k">("1080p");
  const [exportFormat, setExportFormat] = useState<"mp4" | "webm" |("gif")>("mp4");

  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();

  // Get active scene
  const activeScene = useMemo(() => {
    return storyboardScenes.find(s => s.id === activeSceneId) || storyboardScenes[0];
  }, [storyboardScenes, activeSceneId]);

  // Calculate video duration based on clips (default 5 seconds per clip)
  useEffect(() => {
    const baseDuration = storyboardScenes.length * 5;
    setDuration(baseDuration);

    // Create default clips if none exist
    if (storyboardScenes.length > 0 && clips.length === 0) {
      const initialClips: VideoClip[] = storyboardScenes.map((scene, idx) => ({
        id: `clip-${idx + 1}`,
        sceneId: scene.id,
        startTime: idx * 5,
        duration: 5,
        inPoint: 0,
        outPoint: 5
      }));
      setClips(initialClips);
    }
  }, [storyboardScenes, clips.length]);

  // Auto-play/pause handler
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(console.error);
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Time update handler
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // Timeline drag handler
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    setCurrentTime(newTime);

    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // Clip drag handler
  const handleClipDrag = (clipId: string, deltaTime: number) => {
    setClips(clips => clips.map(clip => {
      if (clip.id === clipId) {
        const newStart = Math.max(0, clip.startTime + deltaTime);
        return {
          ...clip,
          startTime: newStart,
          inPoint: Math.max(0, clip.inPoint + deltaTime),
          outPoint: clip.outPoint + deltaTime
        };
      }
      return clip;
    }));
  };

  // Add new clip
  const addClip = () => {
    if (activeScene) {
      const newClip: VideoClip = {
        id: `clip-${Date.now()}`,
        sceneId: activeScene.id,
        startTime: currentTime,
        duration: 5,
        inPoint: 0,
        outPoint: 5
      };
      setClips(clips => [...clips, newClip]);
      toast.success("Added clip to timeline");
    }
  };

  // Delete clip
  const deleteClip = (clipId: string) => {
    setClips(clips.filter(c => c.id !== clipId));
    setSelectedClipId(null);
  };

  // Select clip
  const selectClip = (clipId: string) => {
    setSelectedClipId(clipId);
  };

  // Render current frame based on time
  const getCurrentFrame = () => {
    const currentClip = clips.find(c =>
      currentTime >= c.startTime && currentTime < c.startTime + c.duration
    );

    if (currentClip && currentClip.sceneId) {
      return storyboardScenes.find(s => s.id === currentClip.sceneId);
    }
    return null;
  };

  const currentFrame = getCurrentFrame();

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Playback rate options
  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="flex-1 min-h-0 bg-pictora-bg flex flex-col overflow-hidden">

      {/* Video Player Section */}
      <div className="flex-1 relative bg-black/90 overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted={muted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        >
          {/* Display current frame as poster */}
          {currentFrame?.imageUrl && (
            <source src={currentFrame.imageUrl} />
          )}
        </video>

        {/* Overlay info */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
          <div className="text-xs font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          {currentFrame && (
            <div className="text-[10px] text-white/80 max-w-xs truncate">
              {currentFrame.title || `Scene ${currentFrame.sceneNumber}`}
            </div>
          )}
        </div>

        {/* Center play/pause button */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
            onClick={() => setIsPlaying(true)}
          >
            <div className="bg-white/20 hover:bg-white/30 rounded-full w-20 h-20 flex items-center justify-center cursor-pointer">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-[#111111] border-t border-white/10 px-4 py-3">

        {/* Transport Controls */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setCurrentTime(0)}
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10"
          >
            <Rewind className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsPlaying(p => !p)}
            className="p-2 text-white rounded-full bg-pictora-yellow hover:bg-yellow-400"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <div className="flex-1 bg-black/30 rounded-full h-1 cursor-pointer" onClick={handleTimelineClick}>
            <div
              className="bg-pictora-yellow h-1 rounded-full transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          <span className="text-[10px] text-white/50 font-mono w-16 text-center">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            onClick={() => setCurrentTime(duration)}
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentTime(duration)}
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10"
          >
            <FastForward className="w-5 h-5" />
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center gap-4 text-white/70">
          {/* Mute */}
          <button
            onClick={() => setMuted(m => !m)}
            className="p-1.5 rounded hover:bg-white/10"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Playback Rate */}
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="text-xs bg-black/30 border border-white/10 rounded px-2 py-0.5"
          >
            {playbackRates.map(rate => (
              <option key={rate} value={rate}>{rate}x</option>
            ))}
          </select>

          {/* Progress */}
          <div className="flex-1 text-xs font-mono text-white/50">
            {duration > 0 && Math.round((currentTime / duration) * 100)}%
          </div>

          {/* Export Quality */}
          <select
            value={exportQuality}
            onChange={(e) => setExportQuality(e.target.value as any)}
            className="text-xs bg-black/30 border border-white/10 rounded px-2 py-0.5"
          >
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
            <option value="4k">4K</option>
          </select>

          {/* Export Format */}
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
            className="text-xs bg-black/30 border border-white/10 rounded px-2 py-0.5"
          >
            <option value="mp4">MP4</option>
            <option value="webm">WebM</option>
            <option value="gif">GIF</option>
          </select>
        </div>
      </div>

      {/* Timeline Section */}
      <AnimatePresence>
        {showTimeline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '120px', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#111111] border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-white/60">Timeline ({clips.length} clips)</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCastDialog(true)}
                    className="px-2.5 py-1 text-xs font-bold rounded bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
                  >
                    <Users className="w-3 h-3 inline mr-1" />
                    Cast
                  </button>
                  <button
                    onClick={addClip}
                    className="px-2.5 py-1 text-xs font-bold rounded bg-pictora-yellow/20 text-pictora-yellow hover:bg-yellow-400/20"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    Add Clip
                  </button>
                </div>
              </div>

              {/* Timeline Ruler */}
              <div className="bg-black/30 rounded-xl p-2">
                <div className="h-8 bg-black/40 rounded-md relative mb-2">
                  {/* Timeline markers */}
                  {Array.from({ length: Math.max(10, Math.floor(duration / 5)) }).map((_, i) => {
                    const time = i * 5;
                    return (
                      <div
                        key={time}
                        className="absolute h-6 w-0.5 -left-0.5"
                        style={{ left: `${(time / duration) * 100}%` }}
                      >
                        <div className="w-2 h-2 bg-white/30 rounded-full absolute top-1/2 -translate-y-1/2" />
                        <span className="text-[7px] text-white/30 absolute top-4 -left-1 text-center w-8">
                          {Math.floor(time / 60)}:{Math.floor(time % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Clips */}
                <div className="h-10 bg-black/20 rounded-md relative flex items-center">
                  {clips.map(clip => {
                    const clipStart = (clip.startTime / duration) * 100;
                    const clipWidth = (clip.duration / duration) * 100;
                    const isSelected = selectedClipId === clip.id;

                    return (
                      <div
                        key={clip.id}
                        onClick={() => selectClip(clip.id)}
                        className={cn(
                          "absolute top-1.5 rounded-md transition-all cursor-pointer",
                          isSelected ? "ring-2 ring-pictora-yellow" : "hover:opacity-80"
                        )}
                        style={{
                          left: `${clipStart}%`,
                          width: `${clipWidth}%`,
                          backgroundColor: isSelected ? "rgba(255, 214, 0, 0.4)" : "rgba(255, 214, 0, 0.25)"
                        }}
                      >
                        <div className="h-full flex items-center px-2 text-xs font-bold text-black">
                          {storyboardScenes.find(s => s.id === clip.sceneId)?.title || `Scene`}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-5 left-0 bg-black/80 px-1.5 py-0.5 rounded text-[7px] font-mono text-white">
                            {formatTime(clip.startTime)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clip Properties Panel */}
      {selectedClipId && (
        <div className="bg-[#111111] border-t border-white/10 p-4">
          <div className="flex justify-between items-center mb-3">
            <h5 className="text-xs font-bold text-white/60">Clip Properties</h5>
            <button onClick={() => setSelectedClipId(null)} className="text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {(() => {
            const clip = clips.find(c => c.id === selectedClipId);
            const scene = clip ? storyboardScenes.find(s => s.id === clip.sceneId) : null;

            if (!clip || !scene) return null;

            return (
              <div className="space-y-3">
                <div>
                  <span className="text-[9px] text-white/40 block mb-1">Scene</span>
                  <div className="text-xs text-white font-bold">{scene.title || `Scene ${scene.sceneNumber}`}</div>
                </div>

                <div>
                  <span className="text-[9px] text-white/40 block mb-1">Duration</span>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={clip.duration}
                    onChange={(e) => {
                      const newDuration = parseFloat(e.target.value);
                      setClips(clips => clips.map(c =>
                        c.id === clip.id ? { ...c, duration: newDuration } : c
                      ));
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[8px] text-white/50">
                    <span>1s</span>
                    <span>{clip.duration}s</span>
                    <span>30s</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteClip(selectedClipId)}
                  className="w-full py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold"
                >
                  Delete Clip
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};