import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Trash2, Film, Sparkles, Download, ArrowRight, Clapperboard, 
  BrainCircuit, Check, Image, ChevronRight, Clock, User, MapPin, PenTool, Edit2, Camera,
  Play, Pause, Volume2, VolumeX, Maximize2, X, RotateCcw, ChevronLeft, Sliders,
  Copy, Edit3, ChevronDown, Sparkle, Settings, Folder, PlusCircle
} from "lucide-react";
import { useGeneratorStore, StoryboardScene } from "../store/useGeneratorStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ExportStoryboardModal } from "./ExportStoryboardModal";

const CINEMATIC_PRESETS = [
  {
    name: "Gordon Willis",
    description: "Amber warm lighting, deep organic shadows, dramatic low-key 1970s film look",
    suffix: "directed by Gordon Willis, dramatic low-key amber lighting, soft falloff, legendary 1970s film organic color palette, rich warm ambient shadows, masterpiece composition",
    color: "from-amber-600/20 to-yellow-950/10 border-amber-500/20 text-yellow-300 hover:border-amber-400/40",
    label: "Understated Warmth"
  },
  {
    name: "Denis Villeneuve",
    description: "Brutalist colossal scales, heavy dust atmosphere, desaturated desert tones",
    suffix: "directed by Denis Villeneuve, shot on Arri Alexa LF, immense dust atmosphere haze, desaturated earth tones, titanic brutalist scale monuments, high dynamic shadows",
    color: "from-orange-600/20 to-amber-950/10 border-orange-500/20 text-orange-350 hover:border-orange-400/40",
    label: "Epic Scale"
  },
  {
    name: "Wes Anderson",
    description: "Perfect grid symmetry, pastel analog palettes, charming flat geometric layout",
    suffix: "directed by Wes Anderson, perfectly centered symmetrical layout, vibrant whimsical pastel colors, high contrast flat camera perspective, nostalgic retro analog film colors",
    color: "from-emerald-600/20 to-teal-950/10 border-emerald-500/20 text-emerald-300 hover:border-emerald-400/40",
    label: "Pastel Symmetry"
  },
  {
    name: "Christopher Nolan",
    description: "Volumetric realism, cool high-contrast tints, 70mm IMAX cinematic grain",
    suffix: "directed by Christopher Nolan, shot on 70mm IMAX camera, pristine optical detail, cool moody color grading, dramatic realistic practical atmosphere, high tension deep focus",
    color: "from-sky-600/20 to-blue-950/10 border-sky-500/20 text-sky-350 hover:border-sky-400/40",
    label: "IMAX Realism"
  },
  {
    name: "Studio Ghibli",
    description: "Hand-painted watercolors, gorgeous organic daylight, soft nostalgic cartoon",
    suffix: "studio ghibli watercolor landscape sketch, hand-painted anime background canvas, soft nostalgic emotional daylight, lush hand drawn greenery, nostalgic masterpiece painting",
    color: "from-pink-600/20 to-purple-950/10 border-pink-500/20 text-pink-300 hover:border-pink-400/40",
    label: "Ghibli Dream"
  }
];

// 300ms local state debouncer to prevent global component/sidebar render-loops while user is actively typing
const DebouncedInput = ({
  value,
  onChange,
  className,
  placeholder,
  ...props
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  [key: string]: any;
}) => {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalVal(val);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(val);
    }, 250);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange(localVal);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <input
      type="text"
      value={localVal}
      onChange={handleLocalChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
};

const DebouncedTextarea = ({
  value,
  onChange,
  className,
  placeholder,
  ...props
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  [key: string]: any;
}) => {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLocalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalVal(val);
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(val);
    }, 250);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange(localVal);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <textarea
      value={localVal}
      onChange={handleLocalChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
};

// ----------------------------------------------------
// SOPHISTICATED COGNITIVE WEB AUDIO CONTROLLER CLASS
// ----------------------------------------------------
class CinemaAudioController {
  private ctx: AudioContext | null = null;

  public init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch((err) => console.log("WebAudio resume blocked:", err));
    }
  }

  public playTransitionChime() {
    try {
      this.init();
      if (!this.ctx) return;
      
      const now = this.ctx.currentTime;
      // Synthesize a beautiful double-frequency warm cinematic slide transition chime
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      // Bandpass/Lowpass dynamic filter for warm movie theater roll-off
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.Q.value = 1.0;
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 1.8);

      // Node structure
      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(filter);
      gain2.connect(filter);
      filter.connect(this.ctx.destination);

      // Low bass hum specs - Warm cinematic 110Hz (A2)
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(110, now);
      osc1.frequency.exponentialRampToValueAtTime(92, now + 1.5);
      
      gain1.gain.setValueAtTime(0.0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.1);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      // Shimmering chime specs - Metallic bell 880Hz (A5) for high fidelity
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(550, now + 1.2);

      gain2.gain.setValueAtTime(0.0, now);
      gain2.gain.linearRampToValueAtTime(0.05, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      // Trigger Nodes
      osc1.start(now);
      osc2.start(now);
      
      osc1.stop(now + 1.8);
      osc2.stop(now + 1.8);
    } catch (e) {
      console.warn("Cinema chime failed to render via Web Audio:", e);
    }
  }
}

const cinemaAudio = new CinemaAudioController();

// Persistent registry to prevent browser garbage collection on SpeechSynthesisUtterance objects
let globalUtteranceRegistry: SpeechSynthesisUtterance[] = [];

const speakNarrationSafely = (
  text: string, 
  voiceName: string, 
  availableVoices: SpeechSynthesisVoice[],
  onEndCallback?: () => void,
  rate: number = 1.05
) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  try {
    // Cancel any active speaker queues immediately and clear the registry
    window.speechSynthesis.cancel();
    globalUtteranceRegistry = [];

    if (!text.trim()) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Small delay allows browser thread to fully release audio hardware buffers safely
    setTimeout(() => {
      try {
        const ut = new SpeechSynthesisUtterance(text);
        
        // Push reference into the registry to immune the object from GC silencing
        globalUtteranceRegistry.push(ut);
        
        const chosenVoice = availableVoices.find(v => v.name === voiceName);
        if (chosenVoice) {
          ut.voice = chosenVoice;
        }

        ut.rate = rate;
        ut.pitch = 1.0;

        ut.onend = () => {
          const idx = globalUtteranceRegistry.indexOf(ut);
          if (idx !== -1) globalUtteranceRegistry.splice(idx, 1);
          if (onEndCallback) onEndCallback();
        };

        ut.onerror = (evt) => {
          console.warn("Speech Synthesis experienced minor interrupt:", evt);
          const idx = globalUtteranceRegistry.indexOf(ut);
          if (idx !== -1) globalUtteranceRegistry.splice(idx, 1);
        };

        window.speechSynthesis.speak(ut);

        // Periodically run resume in the background to bypass Chrome's arbitrary mid-speech automatic silence bug
        const resumeTimer = setInterval(() => {
          if (typeof window !== "undefined" && window.speechSynthesis) {
            if (window.speechSynthesis.speaking) {
              window.speechSynthesis.resume();
            } else {
              clearInterval(resumeTimer);
            }
          }
        }, 6000);

      } catch (err) {
        console.error("Delayed voice synthesis init failed:", err);
      }
    }, 80);

  } catch (err) {
    console.warn("Speech synthesis cancel/queue setup exception:", err);
  }
};

export const StoryboardWorkspace = () => {
  const {
    storyboardScenes: allStoryboardScenes,
    activeSceneId,
    isGenerating,
    aspectRatio,
    setActiveSceneId,
    addStoryboardScene,
    updateStoryboardScene,
    deleteStoryboardScene,
    setStoryboardScenes,
    generateStoryboardOutline,
    generateStoryboardSceneImage,
    setSubjectImage,
    setSceneImage,
    setStyleImage,
    setSubjectText,
    setSceneText,
    setStyleText,
    storyboardStyle,
    setStoryboardStyle,
    subjectImage,
    sceneImage,
    styleImage,
    subjectText,
    sceneText,
    styleText,
    ttsEngine,
    setTtsEngine,
    geminiVoice,
    setGeminiVoice,
    generateGeminiTTS,
    
    // Custom project integrations
    projects,
    activeProjectId,
    ensureProjects,
    addStoryboardProject,
    deleteStoryboardProject,
    renameStoryboardProject,
    setActiveProjectId
  } = useGeneratorStore();

  const storyboardScenes = useMemo(() => {
    return allStoryboardScenes.filter(
      (s) => s.projectId === activeProjectId || (!s.projectId && activeProjectId === null)
    );
  }, [allStoryboardScenes, activeProjectId]);

  // Auto initialize projects if empty and migrate legacy scenes
  useEffect(() => {
    ensureProjects();
  }, [ensureProjects]);

  const [concept, setConcept] = useState("");
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Collapsed secondary sections (progressive disclosure)
  const [showDirectorPresets, setShowDirectorPresets] = useState(false);
  const [showTTSControls, setShowTTSControls] = useState(false);
  const [showContinuityRefs, setShowContinuityRefs] = useState(false);

  // Custom project dialog states to avoid blocked iframe dialogs
  const [isRenaming, setIsRenaming] = useState(false);
  const [editFieldName, setEditFieldName] = useState("");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);

  const handleRenameTrigger = () => {
    const currentProj = projects.find(p => p.id === activeProjectId);
    if (!currentProj) return;
    setEditFieldName(currentProj.name);
    setIsRenaming(true);
  };

  const handleRenameSave = () => {
    if (!activeProjectId) return;
    const trimmed = editFieldName.trim();
    if (!trimmed) {
      toast.error("Project name cannot be empty.");
      return;
    }
    renameStoryboardProject(activeProjectId, trimmed);
    setIsRenaming(false);
    toast.success("Project renamed successfully!");
  };

  const handleCreateNewProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed) {
      toast.error("Project name cannot be empty.");
      return;
    }
    const newId = addStoryboardProject(trimmed);
    setShowNewProjectModal(false);
    setNewProjectName("");
    toast.success(`Project "${trimmed}" initialized! Codec initialized.`);
  };

  const handleConfirmDeleteProjectSubmit = () => {
    if (!activeProjectId) return;
    const currentProj = projects.find(p => p.id === activeProjectId);
    if (!currentProj) return;
    if (projects.length <= 1) {
      toast.error("You must keep at least one active storyboard project.");
      setShowDeleteProjectModal(false);
      return;
    }
    deleteStoryboardProject(activeProjectId);
    setShowDeleteProjectModal(false);
    toast.success(`Project "${currentProj.name}" and all its scenes discarded.`);
  };
  
  // Custom states for Sophisticated cinematic expansion
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null);
  const [playPresentation, setPlayPresentation] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [slideshowDuration, setSlideshowDuration] = useState(6); // seconds per slide
  const [isMuted, setIsMuted] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [previewingSceneId, setPreviewingSceneId] = useState<string | null>(null);
  const [aspectRatioFilter, setAspectRatioFilter] = useState<'anamorphic' | 'cinematic' | 'imax'>('anamorphic');
  const [speechRate, setSpeechRate] = useState<number>(1.05);
  const [isSpeechSpeaking, setIsSpeechSpeaking] = useState<boolean>(false);
  const [isTtsGenerating, setIsTtsGenerating] = useState<boolean>(false);
  const currentGeminiAudioRef = useRef<{ source: AudioBufferSourceNode; audioCtx: AudioContext } | null>(null);

  const playPcmAudio = useCallback((base64Data: string, sampleRate = 24000, onEndCallback?: () => void) => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const buffer = bytes.buffer;
    const int16Array = new Int16Array(buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    const audioBuffer = audioCtx.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.copyToChannel(float32Array, 0);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    
    source.onended = () => {
      if (onEndCallback) onEndCallback();
    };
    
    source.start(0);
    return { source, audioCtx };
  }, []);

  const stopActiveSpeech = useCallback(() => {
    setIsSpeechSpeaking(false);
    setIsTtsGenerating(false);
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (currentGeminiAudioRef.current) {
      try {
        currentGeminiAudioRef.current.source.stop();
        currentGeminiAudioRef.current.audioCtx.close();
      } catch (e) {}
      currentGeminiAudioRef.current = null;
    }
  }, []);

  const speakActiveNarration = useCallback(async (text: string, onEndCallback?: () => void) => {
    stopActiveSpeech();
    
    if (!text.trim()) {
      if (onEndCallback) onEndCallback();
      return;
    }

    if (ttsEngine === "gemini") {
      setIsTtsGenerating(true);
      try {
        const base64Data = await generateGeminiTTS(text);
        setIsTtsGenerating(false);
        setIsSpeechSpeaking(true);
        
        const audioUnit = playPcmAudio(base64Data, 24000, () => {
          setIsSpeechSpeaking(false);
          currentGeminiAudioRef.current = null;
          if (onEndCallback) onEndCallback();
        });
        currentGeminiAudioRef.current = audioUnit;
      } catch (err: any) {
        console.error("Gemini TTS engine failed:", err);
        setIsTtsGenerating(false);
        setIsSpeechSpeaking(false);
        toast.error("Gemini premium TTS failed, falling back to local local voice.");
        
        // Fallback to browser standard
        setIsSpeechSpeaking(true);
        speakNarrationSafely(text, selectedVoiceName, availableVoices, () => {
          setIsSpeechSpeaking(false);
          if (onEndCallback) onEndCallback();
        }, speechRate);
      }
    } else {
      setIsSpeechSpeaking(true);
      speakNarrationSafely(text, selectedVoiceName, availableVoices, () => {
        setIsSpeechSpeaking(false);
        if (onEndCallback) onEndCallback();
      }, speechRate);
    }
  }, [ttsEngine, generateGeminiTTS, selectedVoiceName, availableVoices, speechRate, stopActiveSpeech, playPcmAudio]);

  const activeScene = useMemo(() => {
    return storyboardScenes.find(s => s.id === activeSceneId) || storyboardScenes[0];
  }, [storyboardScenes, activeSceneId]);

  // Load available speech synthesis voices for professional screenplay dictation
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        // Prioritize clear premium and english voices
        const defaultVoice = voices.find(v => v.lang.includes("en-US") && v.name.includes("Natural")) || 
                             voices.find(v => v.lang.startsWith("en")) || 
                             voices[0];
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Classic industrial-grade Web Audio pre-warming upon any early click or touch
    const handleGesture = () => {
      cinemaAudio.init();
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };
    window.addEventListener("click", handleGesture);
    window.addEventListener("touchstart", handleGesture);

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };
  }, []);

  const handleCreateOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) {
      toast.error("Please enter a concept idea first");
      return;
    }
    setIsDrafting(true);
    const toastId = toast.loading("Gemini AI is crafting sequential screenplay scenes...");
    try {
      await generateStoryboardOutline(concept);
      setShowDraftModal(false);
      setConcept("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrafting(false);
      toast.dismiss(toastId);
    }
  };

  const handleGenerateImage = async (sceneId: string) => {
    setActiveSceneId(sceneId);
    toast.info("Queueing storyboard scene render...");
    await generateStoryboardSceneImage(sceneId);
  };

  const handlePresetSelect = (preset: typeof CINEMATIC_PRESETS[0]) => {
    if (selectedPresetName === preset.name) {
      setSelectedPresetName(null);
      // Strip previous preset tag if present
      const cleanPrompt = activeScene.prompt.split(" | [Cinematic:")[0];
      updateStoryboardScene(activeScene.id, { prompt: cleanPrompt });
      toast.success("Auteur camera preset removed from scene.");
    } else {
      setSelectedPresetName(preset.name);
      const cleanPrompt = activeScene.prompt.split(" | [Cinematic:")[0];
      updateStoryboardScene(activeScene.id, {
        prompt: `${cleanPrompt.trim()} | [Cinematic: ${preset.suffix}]`
      });
      toast.success(`Appended ${preset.name} camera rig suffix to prompt.`);
    }
  };

  const syncSceneOrder = (newScenes: StoryboardScene[]) => {
    // Re-adjust numbers neatly
    const sequenced = newScenes.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    setStoryboardScenes(sequenced);
  };

  const exportStoryboardHTML = () => {
    if (storyboardScenes.length === 0) {
      toast.error("No storyboard scenes to export yet");
      return;
    }

    try {
      const titleText = "Storyboard Presentation";
      const scenesHtml = storyboardScenes.map(s => `
        <div class="scene-card" style="margin-bottom: 40px; background: #151515; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column;">
          <div style="padding: 16px; background: rgba(255, 214, 0, 0.1); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #FFD600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">ROUND ${s.sceneNumber} / SCENE ${s.sceneNumber}</span>
            <span style="font-weight: bold; font-size: 16px; color: #ffffff;">${s.title}</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; flex-direction: row; align-items: stretch; max-width: 100%;">
            <div style="flex: 1 1 450px; min-height: 300px; background: #0a0a0a; display: flex; align-items: center; justify-content: center; position: relative;">
               ${s.imageUrl 
                 ? `<img src="${s.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` 
                 : `<div style="color: rgba(255,255,255,0.2); font-size: 14px; padding: 40px; text-align: center;">Frame Image Pending Render</div>`
               }
            </div>
            <div style="flex: 1 1 350px; padding: 24px; display: flex; flex-direction: column; gap: 16px; justify-content: center; border-left: 1px solid rgba(255,255,255,0.05);">
              <div>
                <h4 style="margin: 0 0 6px 0; color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Creative Prompt Trigger</h4>
                <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.8); font-style: italic; line-height: 1.5;">"${s.prompt || "No prompt written yet."}"</p>
              </div>
              <div>
                <h4 style="margin: 0 0 6px 0; color: rgba(255,255,255,0.4); text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">Screenplay Narration & Stage Action</h4>
                <p style="margin: 0; font-size: 14px; color: #ffffff; line-height: 1.6;">${s.narration || "No voiceover written yet."}</p>
              </div>
            </div>
          </div>
        </div>
      `).join("");

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pictora Storyboard Export</title>
  <style>
    body {
      background-color: #0d0d0d;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    header {
      text-align: center;
      margin-bottom: 50px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      padding-bottom: 30px;
    }
    h1 { margin: 0 0 10px 0; color: #FFD600; font-weight: 800; letter-spacing: -0.5px; }
    p.meta { margin: 0; color: rgba(255,255,255,0.4); font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>PICTORA STORYBOARD PORTFOLIO</h1>
      <p class="meta">Exported on ${new Date().toLocaleDateString()} &bull; Total Scenes: ${storyboardScenes.length}</p>
    </header>
    <main>
      ${scenesHtml}
    </main>
  </div>
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `storyboard-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      toast.success("Storyboard HTML Script exported successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export storyboard portfolio file");
    }
  };

  // Autoplay handler and sound manager for Presentations
  useEffect(() => {
    let playInterval: NodeJS.Timeout | null = null;
    if (playPresentation && autoPlay) {
      playInterval = setInterval(() => {
        setCurrentSlideIndex((prev) => {
          if (prev >= storyboardScenes.length - 1) {
            return 0; // loop back
          }
          return prev + 1;
        });
      }, slideshowDuration * 1000);
    }
    return () => {
      if (playInterval) clearInterval(playInterval);
    };
  }, [playPresentation, autoPlay, storyboardScenes.length, slideshowDuration]);

  // Handle speaker audio voiceover synthesis on active slides
  useEffect(() => {
    if (playPresentation && !isMuted && storyboardScenes[currentSlideIndex]) {
      const speechText = storyboardScenes[currentSlideIndex].narration;
      
      // Play high-fidelity Web Audio cinematic slide transition sound
      cinemaAudio.playTransitionChime();

      speakActiveNarration(speechText);
    } else {
      stopActiveSpeech();
    }
    return () => {
      stopActiveSpeech();
    };
  }, [playPresentation, currentSlideIndex, isMuted, speakActiveNarration, stopActiveSpeech]);

  // Keyboard navigation for filmstrip timeline: Left/Right arrow moves between scenes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only navigate when focus is not inside an input/textarea/select
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      if (isInput) return;

      if (e.key === "ArrowLeft" && storyboardScenes.length > 0) {
        e.preventDefault();
        const idx = storyboardScenes.findIndex(s => s.id === activeSceneId);
        const nextIdx = idx <= 0 ? storyboardScenes.length - 1 : idx - 1;
        setActiveSceneId(storyboardScenes[nextIdx].id);
        cinemaAudio.playTransitionChime();
      } else if (e.key === "ArrowRight" && storyboardScenes.length > 0) {
        e.preventDefault();
        const idx = storyboardScenes.findIndex(s => s.id === activeSceneId);
        const nextIdx = idx >= storyboardScenes.length - 1 ? 0 : idx + 1;
        setActiveSceneId(storyboardScenes[nextIdx].id);
        cinemaAudio.playTransitionChime();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [storyboardScenes, activeSceneId, setActiveSceneId]);

  return (
    <div className="flex-1 min-h-0 bg-pictora-bg flex flex-col h-full overflow-hidden select-none">
      
      {/* Active Focus Round Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6" role="main" aria-label="Storyboard Editor">
        
        {activeScene ? (
          <div className="w-full max-w-[1360px] mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
            
            {/* Project Switcher Bar */}
            <div id="storyboard-project-switcher-bar" className="bg-black/35 hover:bg-black/50 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all z-10 shadow-md" role="region" aria-label="Storyboard project switcher">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pictora-yellow/15 border border-pictora-yellow/20 rounded-xl text-pictora-yellow">
                  <Folder className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono font-extrabold text-white/35 uppercase tracking-wider">Active Storyboard Project</span>
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                      {isRenaming ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                          <input
                            type="text"
                            value={editFieldName}
                            onChange={(e) => setEditFieldName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameSave();
                              } else if (e.key === 'Escape') {
                                setIsRenaming(false);
                              }
                            }}
                            className="bg-[#0E0E10] border border-pictora-yellow text-[13px] text-white font-extrabold rounded-xl py-1 px-3 outline-none transition-all w-[180px] sm:w-[220px]"
                            placeholder="Project Name"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleRenameSave}
                            className="p-1 px-2.5 bg-pictora-yellow hover:bg-yellow-400 text-black rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 border border-transparent shadow active:scale-95"
                            title="Save Rename"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsRenaming(false)}
                            className="p-1 px-2.5 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 border border-white/5"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <select
                            id="storyboard-project-select"
                            value={activeProjectId || ""}
                            onChange={(e) => setActiveProjectId(e.target.value)}
                            className="bg-[#0E0E10] border border-white/10 hover:border-pictora-yellow/40 text-sm text-white font-extrabold rounded-xl py-1.5 pl-3 pr-8 outline-none transition-all appearance-none cursor-pointer min-w-[200px]"
                          >
                            {projects.map(proj => (
                              <option key={proj.id} value={proj.id} className="bg-[#111] text-white">
                                {proj.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </>
                      )}
                    </div>
                    
                    {!isRenaming && (
                      <>
                        {/* Edit name inline */}
                        <button
                          id="rename-project-btn"
                          type="button"
                          onClick={handleRenameTrigger}
                          className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-pictora-yellow rounded-xl transition-all cursor-pointer border border-white/5"
                          title="Rename project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Delete active project */}
                        <button
                          id="delete-project-btn"
                          type="button"
                          onClick={() => {
                            if (projects.length <= 1) {
                              toast.error("You must keep at least one active storyboard project.");
                              return;
                            }
                            setShowDeleteProjectModal(true);
                          }}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all cursor-pointer border border-red-500/10"
                          title="Discard project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* New Project Creator Button */}
              <div className="flex items-center gap-2">
                <button
                  id="initialize-new-project-btn"
                  type="button"
                  onClick={() => {
                    setNewProjectName("");
                    setShowNewProjectModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-pictora-yellow to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-extrabold text-[10px] tracking-wider uppercase rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Initialize New Project</span>
                </button>
              </div>
            </div>
            
            {/* Header info bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-pictora-yellow bg-pictora-yellow/15 border border-pictora-yellow/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    ROUND {activeScene.sceneNumber} / SCENE {activeScene.sceneNumber}
                  </span>

                  {/* Style Mode Selector Pill */}
                  <div className="flex items-center gap-1 p-0.5 bg-black/45 border border-white/5 rounded-lg select-none">
                    <button
                      type="button"
                      onClick={() => setStoryboardStyle("realistic")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
                        storyboardStyle === "realistic"
                          ? "bg-pictora-yellow text-black font-extrabold"
                          : "text-white/40 hover:text-white/85"
                      )}
                    >
                      <Camera className="w-2.5 h-2.5" />
                      <span>Realistic</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoryboardStyle("drawing")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
                        storyboardStyle === "drawing"
                          ? "bg-pictora-yellow text-black font-extrabold"
                          : "text-white/40 hover:text-white/85"
                      )}
                    >
                      <PenTool className="w-2.5 h-2.5" />
                      <span>Drawing</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DebouncedInput
                    value={activeScene.title}
                    onChange={(val) => updateStoryboardScene(activeScene.id, { title: val })}
                    className="bg-transparent border-b border-transparent hover:border-white/10 focus:border-pictora-yellow text-white font-bold text-xl md:text-2xl outline-none py-1 focus:ring-0 max-w-lg transition-all"
                    placeholder="Provide a Scene Title..."
                  />
                </div>
              </div>

              {/* Top Action Buttons Group */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSlideIndex(storyboardScenes.indexOf(activeScene));
                    setPlayPresentation(true);
                  }}
                  className="px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/25 text-sky-400 hover:text-sky-300 border border-sky-500/20 rounded-xl font-bold text-sm tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
                  title="Play storyboard presentation reel"
                >
                  <Play className="w-4 h-4 fill-current animate-pulse text-sky-400" />
                  <span>Cinema Reel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white hover:text-pictora-yellow border border-white/10 rounded-xl font-bold text-sm tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
                  title="Export current storyboard layout"
                >
                  <Download className="w-4 h-4 text-pictora-yellow" />
                  <span>Export Deck</span>
                </button>

                <button
                  onClick={() => handleGenerateImage(activeScene.id)}
                  disabled={activeScene.isGenerating || !activeScene.prompt.trim()}
                  className={cn(
                    "px-5 py-3 bg-pictora-yellow disabled:bg-white/5 disabled:text-white/30 text-black hover:bg-yellow-400 rounded-xl font-bold text-sm tracking-wider flex items-center gap-2 shadow-xl shadow-pictora-yellow/20 shrink-0 transition-all cursor-pointer active:scale-95 disabled:scale-100",
                    activeScene.isGenerating && "animate-pulse"
                  )}
                >
                  {activeScene.isGenerating ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Rendering...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Render Frame</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Director Auteur Presets (collapsed by default) */}
            <div className="space-y-2">
              <button
                onClick={() => setShowDirectorPresets(!showDirectorPresets)}
                className="flex items-center gap-2 w-full px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-left transition-all cursor-pointer group"
              >
                <Sliders className="w-4 h-4 text-pictora-yellow shrink-0" />
                <span className="text-sm font-bold text-white tracking-wider">Director Style Presets</span>
                <span className="text-white/40 text-xs font-mono ml-auto">{showDirectorPresets ? "Hide" : "Show"}</span>
                <ChevronDown className={`w-3 h-3 text-white/40 transition-transform duration-200 ${showDirectorPresets ? "rotate-180" : ""}`} />
              </button>

              {showDirectorPresets && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CINEMATIC_PRESETS.map((preset) => {
                    const isActive = selectedPresetName === preset.name || activeScene.prompt.includes(preset.name);
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className={cn(
                          "p-2 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 relative overflow-hidden group cursor-pointer",
                          isActive 
                            ? "bg-gradient-to-br border-pictora-yellow ring-1 ring-pictora-yellow/20" 
                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]",
                          preset.color
                        )}
                        title={preset.description}
                      >
                        <div className="flex items-start justify-between w-full">
                          <span className="text-xs font-extrabold tracking-tight truncate">{preset.name}</span>
                          {isActive && <Check className="w-3 h-3 text-pictora-yellow" />}
                        </div>
                        <span className="text-[9px] text-white/50 group-hover:text-white/70 block mt-1 line-clamp-1 leading-snug">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stage Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" role="grid" aria-label="Storyboard scene layout">
              
              {/* Media viewport (left column) */}
              <div className="lg:col-span-7 flex flex-col justify-center" role="region" aria-label="Scene media viewport">
                <div className="aspect-video w-full border border-white/10 rounded-2xl bg-[#141414] overflow-hidden flex items-center justify-center relative shadow-3xl group">
                  {activeScene.isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 p-[1px]">
                      <div className="absolute inset-[-100%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg_120deg,rgba(255,214,0,0.45)_180deg,transparent_240deg_360deg)]" />
                      <div className="absolute inset-[1px] bg-[#111] flex flex-col items-center justify-center rounded-2xl">
                        <Clapperboard className="w-12 h-12 text-pictora-yellow animate-bounce" />
                        <span className="text-xs uppercase font-bold tracking-[0.15em] text-white/50 mt-4 animate-pulse">Computing Storyboard Round...</span>
                        <span className="text-[10px] text-white/30 font-mono mt-1">Aspect Ratio: {aspectRatio}</span>
                      </div>
                    </div>
                  ) : activeScene.imageUrl ? (
                    <img 
                      src={activeScene.imageUrl} 
                      alt={activeScene.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" 
                    />
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 max-w-md">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                        <Image className="w-6 h-6 text-white/40" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white/70">Frame Image Pending</p>
                        <p className="text-[10.5px] text-white/30 leading-relaxed">No picture renders have been computed for this round. Write a descriptive prompt below and click the Render Scene Frame button.</p>
                      </div>
                    </div>
                  )}

                  {/* Quick-set reference utility deck */}
                  {activeScene.imageUrl && !activeScene.isGenerating && (
                    <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex justify-center">
                      <div className="bg-[#111]/90 backdrop-blur-md border border-white/10 rounded-full p-1.5 flex items-center gap-1.5 shadow-2xl">
                        <span className="text-[8px] font-bold text-white/40 px-2 uppercase tracking-wider border-r border-white/10">Consistent Sequel Keys:</span>
                        <button 
                          onClick={() => {
                            setSubjectImage(activeScene.imageUrl);
                            toast.success("Scene image saved as reference Subject");
                          }}
                          className="px-3 py-1.5 bg-pictora-yellow hover:bg-yellow-400 rounded-full text-black shadow transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
                          title="Save this frame as next references Subject"
                        >
                          <User className="w-3 h-3" />
                          <span className="text-[8.5px] font-bold uppercase tracking-wide">Subject</span>
                        </button>
                        <button 
                          onClick={() => {
                            setSceneImage(activeScene.imageUrl);
                            toast.success("Scene image saved as reference Scene");
                          }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/5 rounded-full text-white shadow transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
                          title="Save this frame as next references Scene"
                        >
                          <MapPin className="w-3 h-3" />
                          <span className="text-[8.5px] font-bold uppercase tracking-wide">Scene</span>
                        </button>
                        <button 
                          onClick={() => {
                            setStyleImage(activeScene.imageUrl);
                            toast.success("Scene image saved as reference Style");
                          }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/5 rounded-full text-white shadow transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
                          title="Save this frame as next references Style"
                        >
                          <PenTool className="w-3 h-3" />
                          <span className="text-[8.5px] font-bold uppercase tracking-wide">Style</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Continuity & Reference Keys (compact row) */}
                <div className="mt-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col gap-2" role="region" aria-label="Continuity references">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-pictora-yellow bg-pictora-yellow/5 px-2 py-0.5 rounded uppercase tracking-widest">
                      <BrainCircuit className="w-3 h-3" />
                      <span>Reference Keys</span>
                    </div>
                    <button
                      onClick={() => setShowContinuityRefs(!showContinuityRefs)}
                      className="text-xs text-white/40 hover:text-white transition-colors"
                    >
                      {showContinuityRefs ? "Collapse" : "Expand"}
                    </button>
                  </div>

                  {showContinuityRefs && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        {
                          key: "subject",
                          label: "Subject (Actor)",
                          icon: User,
                          image: activeScene.subjectImage || subjectImage,
                          text: activeScene.subjectText || subjectText,
                          setImage: setSubjectImage,
                          setText: setSubjectText,
                          placeholder: "e.g., detective in trench coat",
                        },
                        {
                          key: "scene",
                          label: "Scene (Scenery)",
                          icon: MapPin,
                          image: activeScene.sceneImage || sceneImage,
                          text: activeScene.sceneText || sceneText,
                          setImage: setSceneImage,
                          setText: setSceneText,
                          placeholder: "e.g., rainy cyberpunk alley",
                        },
                        {
                          key: "style",
                          label: "Style (Aesthetic)",
                          icon: PenTool,
                          image: activeScene.styleImage || styleImage,
                          text: activeScene.styleText || styleText,
                          setImage: setStyleImage,
                          setText: setStyleText,
                          placeholder: "e.g., neon noir photography",
                        },
                      ].map((ref) => (
                        <div
                          key={ref.key}
                          className="bg-black/40 rounded-xl p-2 border border-white/5 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between border-b border-white/5 pb-0.5 mb-0.5 gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <ref.icon className="w-2.5 h-2.5 text-white/50 shrink-0" />
                              <span className="text-[9px] font-bold text-white/60 uppercase truncate">{ref.label}</span>
                            </div>
                            {ref.image ? (
                              <span className="text-[7px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-1 py-0.5 rounded font-sans uppercase shrink-0">Active</span>
                            ) : (
                              <span className="text-[7px] text-white/30 uppercase shrink-0">None</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-7 h-7 rounded bg-[#151515] overflow-hidden border border-white/5 shrink-0 flex items-center justify-center">
                              {ref.image ? (
                                <img src={ref.image} className="w-full h-full object-cover" />
                              ) : (
                                <ref.icon className="w-2.5 h-2.5 text-white/20" />
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                              <span className="text-[8px] text-white/40 leading-tight truncate">{ref.placeholder}</span>
                              <div className="flex items-center gap-0.5">
                                {ref.image && (
                                  <button
                                    onClick={() => {
                                      ref.setImage(activeScene.imageUrl);
                                      toast.success(`${ref.label} set from current frame`);
                                    }}
                                    className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[7px] font-bold text-white transition-all cursor-pointer"
                                  >
                                    Use Frame
                                  </button>
                                )}
                                {ref.image && (
                                  <button
                                    onClick={() => {
                                      ref.setImage(null);
                                      toast.info(`${ref.label} cleared`);
                                    }}
                                    className="px-1.5 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded text-[7px] font-bold transition-all cursor-pointer"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={ref.text}
                            onChange={(e) => ref.setText(e.target.value)}
                            placeholder={ref.placeholder}
                            className="w-full bg-[#101012] text-white/80 text-[9px] px-1.5 py-1 rounded border border-white/5 hover:border-white/10 focus:border-pictora-yellow focus:outline-none transition-all placeholder:text-white/20 font-sans"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Text settings content panels (right column) */}
              <div className="lg:col-span-5 flex flex-col space-y-4" role="region" aria-label="Scene text and narration settings">
                
                {/* Image prompt trigger textarea */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-pictora-yellow bg-pictora-yellow/10 px-1 rounded uppercase tracking-wider">Dynamic Visual Prompt</span>
                    <span className="text-[9.5px] text-white/30 uppercase font-mono">Input</span>
                  </div>
                  <DebouncedTextarea
                    value={activeScene.prompt}
                    onChange={(val) => updateStoryboardScene(activeScene.id, { prompt: val })}
                    className="w-full bg-black/25 text-white placeholder:text-white/20 text-xs border border-white/5 focus:border-pictora-yellow rounded-xl p-3 outline-none resize-none h-28 focus:ring-1 focus:ring-pictora-yellow/20"
                    placeholder="Describe the photographic scene details here (elements, shot sizes, angle, lighting, visual themes)..."
                  />
                </div>

                {/* Director voiceover script dialogue */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-2.5 flex-1 min-h-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Soundtrack & Script Actions</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          cinemaAudio.init();
                          if (previewingSceneId === activeScene.id) {
                            stopActiveSpeech();
                            setPreviewingSceneId(null);
                          } else {
                            cinemaAudio.playTransitionChime();
                            const speechText = activeScene.narration;
                            setPreviewingSceneId(activeScene.id);
                            speakActiveNarration(speechText, () => {
                              setPreviewingSceneId(null);
                            });
                          }
                        }}
                        className={cn(
                          "px-2 px-2.5 py-1 rounded text-[8.5px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border",
                          previewingSceneId === activeScene.id
                            ? "bg-sky-400 text-black border-transparent animate-pulse"
                            : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10"
                        )}
                        title="Preview narrative audio voiceover"
                      >
                        {previewingSceneId === activeScene.id ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                        <span>{previewingSceneId === activeScene.id ? "Pause" : "Listen"}</span>
                      </button>
                      <span className="text-[9.5px] text-white/30 uppercase font-mono">Narrative</span>
                    </div>
                  </div>
                  
                  <DebouncedTextarea
                    value={activeScene.narration}
                    onChange={(val) => updateStoryboardScene(activeScene.id, { narration: val })}
                    className="w-full bg-black/25 text-white placeholder:text-white/20 text-xs border border-white/5 focus:border-sky-400 rounded-xl p-3 outline-none resize-none flex-1 focus:ring-1 focus:ring-sky-400/20 leading-relaxed"
                    placeholder="Specify target script actions, storyboard voiceovers, spoken text, atmospheric music cues or stage notes..."
                  />

                  {/* Audio Controls (collapsed) */}
                  <button
                    onClick={() => setShowTTSControls(!showTTSControls)}
                    className="flex items-center gap-2 w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-left transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3 text-white/40 shrink-0" />
                    <span className="text-sm font-bold text-white tracking-wider">Audio Controls</span>
                    <span className="text-white/40 text-xs font-mono ml-auto">{showTTSControls ? "Hide" : "Show"}</span>
                    <ChevronDown className={`w-3 h-3 text-white/40 transition-transform duration-200 ${showTTSControls ? "rotate-180" : ""}`} />
                  </button>

                  {showTTSControls && availableVoices.length > 0 && (
                    <div className="mt-3 p-3 bg-white/[0.03] border border-white/5 rounded-lg space-y-2">
                      <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[9px]">
                        <span className="text-white/40 font-bold uppercase tracking-wider">Cast Narrator:</span>
                        <select
                          value={selectedVoiceName}
                          onChange={(e) => setSelectedVoiceName(e.target.value)}
                          className="bg-black/40 text-[9px] text-white/80 border border-white/5 rounded-md py-0.5 px-2 outline-none focus:ring-1 focus:ring-sky-500/30 max-w-[160px] font-sans"
                        >
                          {availableVoices.map(vo => (
                            <option key={vo.name} value={vo.name} className="bg-[#111] text-white">
                              {vo.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {ttsEngine === "gemini" && (
                        <div className="space-y-1.5">
                          <span className="text-[8.5px] font-extrabold text-white/35 uppercase tracking-wider">Gemini Premium AI Voice</span>
                          <div className="relative">
                            <select
                              value={geminiVoice}
                              onChange={(e) => setGeminiVoice(e.target.value)}
                              className="w-full bg-[#0E0E10] border border-white/5 text-[10px] text-white/80 rounded-xl px-3 py-2 pr-8 outline-none focus:border-pictora-yellow transition-all appearance-none cursor-pointer"
                            >
                              <option value="Kore">Kore (Soothing Female)</option>
                              <option value="Zephyr">Zephyr (Gentle Female)</option>
                              <option value="Puck">Puck (Warm Male)</option>
                              <option value="Charon">Charon (Narrative Male)</option>
                              <option value="Fenrir">Fenrir (Deep Resonant Male)</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 font-sans">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      )}
                      {ttsEngine === "browser" && (
                        <div className="space-y-1.5">
                          <span className="text-[8.5px] font-extrabold text-white/35 uppercase tracking-wider">Dictation Rate Speed</span>
                          <div className="flex items-center gap-3">
                            <input 
                              type="range"
                              min="0.7"
                              max="1.6"
                              step="0.05"
                              value={speechRate}
                              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                              className="flex-1 accent-pictora-yellow h-1 bg-white/10 rounded-lg cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-pictora-yellow font-bold shrink-0 min-w-[28px]">{speechRate.toFixed(2)}x</span>
                          </div>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <span className="text-[8.5px] font-extrabold text-white/35 uppercase tracking-wider">Dictation Audio Node Engine</span>
                        <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-black/60 border border-white/5 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setTtsEngine("browser")}
                            className={cn(
                              "py-1 rounded-lg text-[9.5px] font-extrabold uppercase transition-all cursor-pointer text-center",
                              ttsEngine === "browser"
                                ? "bg-white/[0.08] text-white border border-white/10"
                                : "text-white/40 hover:text-white/75 border border-transparent"
                            )}
                          >
                            🌐 Browser
                          </button>
                          <button
                            type="button"
                            onClick={() => setTtsEngine("gemini")}
                            className={cn(
                              "py-1 rounded-lg text-[9.5px] font-extrabold uppercase transition-all cursor-pointer text-center",
                              ttsEngine === "gemini"
                                ? "bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/25"
                                : "text-white/40 hover:text-white/75 border border-transparent"
                            )}
                          >
                            ✨ Gemini AI
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sophisticated Feature: Production Reel Filmstrip Navigation timeline */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3.5 shadow-xl transition-all" role="region" aria-label="Filmstrip production reel timeline" aria-roledescription="scene timeline">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-pictora-yellow animate-[pulse_2s_infinite]" />
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-white text-opacity-80">FILMSTRIP PRODUCTION REEL</span>
                  <span className="text-[9px] text-white/35">({storyboardScenes.length} frames)</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      addStoryboardScene();
                      toast.success("Blank storyboard frame appended!");
                    }}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 hover:text-pictora-yellow text-[9px] text-white/80 border border-white/10 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3 h-3 text-pictora-yellow" />
                    <span>Insert Frame</span>
                  </button>
                </div>
              </div>

              {/* Horizontal list of scene previews */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {storyboardScenes.map((scene, idx) => {
                  const isActive = scene.id === activeScene.id;
                  return (
                    <div
                      key={scene.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Scene ${scene.sceneNumber}: ${scene.title || "Untitled"}`}
                      aria-selected={isActive}
                      onClick={() => setActiveSceneId(scene.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveSceneId(scene.id);
                        }
                      }}
                      className={cn(
                        "flex-shrink-0 w-32 aspect-video rounded-xl border overflow-hidden relative cursor-pointer group/timeline transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pictora-yellow rounded-xl",
                        isActive
                          ? "border-pictora-yellow ring-2 ring-pictora-yellow/20 scale-[1.03] shadow-lg"
                          : "border-white/5 hover:border-white/20 hover:scale-[1.01]"
                      )}
                    >
                      {scene.imageUrl ? (
                        <img
                          src={scene.imageUrl}
                          alt={scene.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center text-[8.5px] text-white/30 text-center p-1.5">
                          <Image className="w-4 h-4 text-white/10 mb-1" />
                          <span className="truncate max-w-[90px] font-mono text-[8px]" title="No picture computed">No Render</span>
                        </div>
                      )}

                      {/* Timeline Overlay Info */}
                      <div className="absolute top-1 left-1.5 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-white tracking-widest uppercase">
                        SCENE {scene.sceneNumber}
                      </div>

                      {/* Active high-contrast glow border */}
                      {isActive && (
                        <div className="absolute inset-0 border-2 border-pictora-yellow rounded-xl pointer-events-none" />
                      )}

                      {/* Action buttons inside timeline keyframe */}
                      <div className="absolute inset-0 bg-black/85 opacity-0 group-hover/timeline:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                        {/* Move Left */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const newScenes = [...storyboardScenes];
                            const temp = newScenes[idx];
                            newScenes[idx] = newScenes[idx - 1];
                            newScenes[idx - 1] = temp;
                            syncSceneOrder(newScenes);
                            toast.success(`Moved Frame ${idx + 1} to position ${idx}`);
                          }}
                          className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/80 disabled:opacity-30 cursor-pointer"
                          title="Move Left"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        
                        {/* Delete Frame */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (storyboardScenes.length <= 1) {
                              toast.error("At least one scene frame is required in the timeline.");
                              return;
                            }
                            deleteStoryboardScene(scene.id);
                            toast.success(`Scene ${scene.sceneNumber} discarded.`);
                          }}
                          className="p-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 cursor-pointer"
                          title="Delete Frame"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        {/* Move Right */}
                        <button
                          type="button"
                          disabled={idx === storyboardScenes.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            const newScenes = [...storyboardScenes];
                            const temp = newScenes[idx];
                            newScenes[idx] = newScenes[idx + 1];
                            newScenes[idx + 1] = temp;
                            syncSceneOrder(newScenes);
                            toast.success(`Moved Frame ${idx + 1} to position ${idx + 2}`);
                          }}
                          className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/80 disabled:opacity-30 cursor-pointer"
                          title="Move Right"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Frame Aspect hint warning */}
            <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-between text-white/40 text-[9.5px]">
              <span className="flex items-center gap-1.5 font-sans font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                Render Settings &bull; Aspect Ratio is locked to <b className="text-[#FFD600] font-sans font-extrabold">{aspectRatio}</b>. You can customize this in standard mode anytime!
              </span>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full min-h-[500px]">
            <div className="w-20 h-20 bg-[#FFD600]/10 rounded-full flex items-center justify-center mb-6 border border-[#FFD600]/20 animate-pulse">
              <Clapperboard className="w-10 h-10 text-[#FFD600]" />
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight mb-2">Initiate Your Storyboard Concept</h3>
            <p className="text-white/50 mt-1 max-w-[380px] leading-relaxed">
              Create complete sequential scripts and generate scene frames in rounds. Start by drafting with Gemini AI or add frames manually.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 w-full max-w-md">
              <button
                onClick={() => setShowDraftModal(true)}
                className="w-full sm:w-auto py-3.5 px-6 bg-[#FFD600] text-black hover:bg-yellow-400 font-extrabold uppercase text-[10px] tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,214,0,0.25)] active:scale-95"
              >
                <BrainCircuit className="w-4.5 h-4.5 fill-current" />
                <span>Draft with Gen AI</span>
              </button>
              <button
                onClick={addStoryboardScene}
                className="w-full sm:w-auto py-3.5 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase text-[10px] tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Scene Manually</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: AI Outline Generator Prompt Input */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151515] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pictora-yellow fill-current" />
              AI Storyboard Designer
            </h3>
            <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
              Describe your project concept or film summary. Gemini AI will automatically generate 4 sequential screenplay rounds with detailed descriptive prompt cues and action scripts.
            </p>

            <form onSubmit={handleCreateOutline} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Concept Idea</label>
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 focus:border-pictora-yellow text-[13px] rounded-xl px-4 py-3 text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-pictora-yellow/20"
                  placeholder="e.g. A cyber pirate looking for gold inside ancient asteroid docks..."
                  disabled={isDrafting}
                  autoFocus
                />
              </div>

              {/* Style selection */}
              <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <label className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Aesthetic Canvas Style</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStoryboardStyle("realistic")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]",
                      storyboardStyle === "realistic" 
                        ? "bg-pictora-yellow/10 border-pictora-yellow text-[#FFD600]" 
                        : "bg-black/25 border-white/5 text-white/50 hover:border-white/10"
                    )}
                  >
                    <Camera className="w-3.5 h-3.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold uppercase tracking-wider">Realistic</p>
                      <p className="text-[7.5px] text-white/30 truncate mt-0.5">Photographic film Renders</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoryboardStyle("drawing")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]",
                      storyboardStyle === "drawing" 
                        ? "bg-pictora-yellow/10 border-pictora-yellow text-[#FFD600]" 
                        : "bg-black/25 border-white/5 text-white/50 hover:border-white/10"
                    )}
                  >
                    <PenTool className="w-3.5 h-3.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold uppercase tracking-wider">Drawing</p>
                      <p className="text-[7.5px] text-white/30 truncate mt-0.5">Ink and pencil sketches</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 text-[10px] font-bold uppercase tracking-wider cursor-pointer font-sans"
                  disabled={isDrafting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-pictora-yellow hover:bg-yellow-400 text-black rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow active:scale-95 font-sans"
                  disabled={isDrafting}
                >
                  {isDrafting ? "Drafting..." : "Draft Full Story"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Export Storyboard Options Overlay Modal */}
      <ExportStoryboardModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportHtmlFn={exportStoryboardHTML}
      />

      {/* MODAL: Initialize New Project */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151515] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-pictora-yellow" />
              Initialize New Project
            </h3>
            <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
              Create a new standalone storyboard project. This will transition your workspace camera to a completely empty slate scene.
            </p>

            <form onSubmit={handleCreateNewProjectSubmit} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 focus:border-pictora-yellow text-[13px] rounded-xl px-4 py-3 text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-pictora-yellow/20"
                  placeholder="e.g. Neo Tokyo Chronicles..."
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 text-[10px] font-bold uppercase tracking-wider cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-pictora-yellow hover:bg-yellow-400 text-black font-extrabold rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow active:scale-95 font-sans"
                >
                  Create Project
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Discard Project Confirmation */}
      {showDeleteProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#151515] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
          >
            <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Discard Storyboard Project?
            </h3>
            <p className="text-[11px] text-white/50 mt-2 leading-relaxed">
              Are you sure you want to discard this storyboard project and all its associated scene sequences?
            </p>
            <p className="text-[10px] text-red-400/80 bg-red-500/10 border border-red-500/25 rounded-md p-3 mt-3 leading-snug font-sans">
              ⚠️ Warning: This action is completely permanent and cannot be undone. All scene prompts, frames, and audio renders within this project will be deleted.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteProjectModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 text-[10px] font-bold uppercase tracking-wider cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProjectSubmit}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider cursor-pointer shadow active:scale-95 font-sans"
              >
                Discard Project
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DETAILED SOPHISTICATED PRESENTATION MODAL: Immersive "Director's Cut" Playback */}
      <AnimatePresence>
        {playPresentation && (
          <div className="fixed inset-0 z-[100] bg-[#070707] flex flex-col justify-between overflow-hidden select-none">
            
            {/* Matte shadow/glow backdrops simulation */}
            <div className="absolute inset-0 bg-radial-gradient from-sky-950/20 via-transparent to-transparent pointer-events-none z-0" />

            {/* Theatre Top Control Bar */}
            <div className="relative z-10 px-6 py-4 bg-black/75 border-b border-white/5 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <div className="font-mono text-xs text-white/90 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span>Cinematic Playback</span>
                  <span className="text-white/40">&bull;</span>
                  <span className="text-pictora-yellow font-bold">Scene {currentSlideIndex + 1} of {storyboardScenes.length}</span>
                </div>
              </div>

              {/* Framer Layout Controls */}
              <div className="hidden lg:flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl p-0.5">
                {[
                  { key: "anamorphic", text: "2.39:1 Anamorphic" },
                  { key: "cinematic", text: "16:9 Cinema" },
                  { key: "imax", text: "1.43:1 IMAX" }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setAspectRatioFilter(item.key as any);
                      toast.info(`Cinema aspect ratio framing adjusted to ${item.text}`);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer",
                      aspectRatioFilter === item.key
                        ? "bg-[#FFD600] text-black shadow-lg"
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    {item.key.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {/* Auto Play Setup */}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => {
                      setAutoPlay(!autoPlay);
                      toast.info(autoPlay ? "Autoplay Disabled" : "Autoplay Enabled (" + slideshowDuration + "s)");
                    }}
                    className={cn(
                      "px-2.5 py-1 text-[8.5px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer",
                      autoPlay ? "bg-[#FFD600] text-black" : "text-white/50 hover:text-white"
                    )}
                  >
                    Auto Loop
                  </button>
                  {autoPlay && (
                    <div className="flex items-center gap-1 px-1 text-white/60 text-[9.5px]">
                      <input 
                        type="number"
                        min="3"
                        max="20"
                        value={slideshowDuration}
                        onChange={(e) => setSlideshowDuration(parseInt(e.target.value) || 5)}
                        className="w-8 bg-transparent text-center border-none text-pictora-yellow font-bold focus:ring-0 p-0 text-[10px]"
                      />
                      <span>s</span>
                    </div>
                  )}
                </div>

                {/* Voice audio narration controls */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (typeof window !== "undefined" && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className={cn(
                    "p-2 rounded-lg border transition-all cursor-pointer",
                    isMuted 
                      ? "bg-red-500/10 border-red-500/20 text-red-400" 
                      : "bg-[#FFD600]/10 border-[#FFD600]/20 text-pictora-yellow"
                  )}
                  title={isMuted ? "Unmute synthetic voice" : "Mute narration track"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Exit Theatre Button */}
                <button
                  type="button"
                  onClick={() => {
                    setPlayPresentation(false);
                    if (typeof window !== "undefined" && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className="p-2 bg-white/5 hover:bg-[#FFD600] text-white hover:text-black border border-white/10 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Immersive Cinematic Split Screen HUD */}
            <div className="flex-1 overflow-hidden p-6 gap-6 grid grid-cols-1 lg:grid-cols-12 items-stretch h-full min-h-0 relative z-10 select-none">
              
              {/* Left Column: Big Screen Canvas Viewer */}
              <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-center items-center relative overflow-hidden bg-black/40 rounded-3xl border border-white/5 p-4 md:p-8">
                
                {/* Cinematic viewport bounding box */}
                <div className={cn(
                  "w-full bg-black/90 rounded-2xl overflow-hidden border border-white/10 shadow-3xl relative transition-all duration-500 ease-in-out select-none",
                  aspectRatioFilter === "anamorphic" && "max-w-5xl aspect-[2.39/1]",
                  aspectRatioFilter === "cinematic" && "max-w-4xl aspect-[16/9]",
                  aspectRatioFilter === "imax" && "max-w-3xl aspect-[1.43/1]"
                )}>
                  {/* Letterbox matte bars */}
                  <div className="absolute top-0 inset-x-0 h-[6.5%] bg-black/95 border-b border-white/5 z-20 flex items-center justify-between px-6">
                    <span className="text-[7.5px] font-mono tracking-widest text-white/35 font-bold">PICTORA AUTEUR STUDIO REEL</span>
                    <span className="text-[7.5px] font-mono tracking-widest text-white/35 font-bold flex items-center gap-1.5 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      {aspectRatioFilter === "anamorphic" && "2.39:1 Anamorphic Cut"}
                      {aspectRatioFilter === "cinematic" && "16:9 standard cinematic Cut"}
                      {aspectRatioFilter === "imax" && "1.43:1 grand imax film framing"}
                    </span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-[6.5%] bg-black/95 border-t border-white/5 z-20" />

                  {/* Camera framing Matte Overlay grids */}
                  <div className="absolute inset-0 border border-white/5 pointer-events-none z-10">
                    <div className="absolute top-1/2 inset-x-0 h-px bg-white/5 border-dashed" />
                    <div className="absolute left-1/2 inset-y-0 w-px bg-white/5 border-dashed" />
                    {/* Corner Framing Marks */}
                    <div className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-white/15" />
                    <div className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-white/15" />
                    <div className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-white/15" />
                    <div className="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-white/15" />
                  </div>

                  {/* Main current slide layout render */}
                  <div className="absolute inset-x-0 top-[6.5%] bottom-[6.5%] bg-[#08080a] flex items-center justify-center overflow-hidden">
                    {storyboardScenes[currentSlideIndex] ? (
                      (() => {
                        const slide = storyboardScenes[currentSlideIndex];
                        return (
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={slide.id}
                              initial={{ opacity: 0, scale: 1.05 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.65, ease: "easeOut" }}
                              className="w-full h-full relative"
                            >
                              {slide.imageUrl ? (
                                <img
                                  src={slide.imageUrl}
                                  alt={slide.title}
                                  className="w-full h-full object-cover select-none pointer-events-none"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-[#111]/70 p-6">
                                  <Clapperboard className="w-12 h-12 text-[#FFD600]/80 animate-pulse mb-3" />
                                  <span className="text-[10px] uppercase font-mono font-black tracking-widest text-white/30">Scene Render Pending</span>
                                </div>
                              )}

                              {/* On-Screen Screenplay Overlay */}
                              <div className="absolute bottom-6 inset-x-0 px-8 text-center z-30">
                                <div className="max-w-2xl mx-auto bg-black/85 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl shadow-3xl space-y-1">
                                  <h4 className="text-[10px] text-pictora-yellow font-extrabold uppercase tracking-[0.18em]">
                                    SCENE {slide.sceneNumber} &bull; {slide.title || "Untitled Scene"}
                                  </h4>
                                  <p className="text-white text-xs font-sans tracking-wide leading-relaxed line-clamp-2">
                                    {slide.narration || "Narrative dialogue screenplay is blank..."}
                                  </p>
                                </div>
                              </div>

                              {/* Bioluminescent reactive speaking visualizer */}
                              {isTtsGenerating && (
                                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-pictora-yellow/20 text-[9px] text-[#FFD600] font-mono tracking-wider z-40 shadow-xl">
                                  <Sparkle className="w-3.5 h-3.5 text-pictora-yellow animate-spin" />
                                  <span className="font-extrabold uppercase animate-pulse">Processing Neural Speech...</span>
                                </div>
                              )}
                              {isSpeechSpeaking && !isTtsGenerating && (
                                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/20 text-[9px] text-emerald-400 font-mono tracking-wider z-40 shadow-xl">
                                  <div className="flex gap-1 items-end h-3 w-5">
                                    {[1, 2, 3, 4].map((i) => (
                                      <motion.span
                                        key={i}
                                        animate={{ height: ["3px", "11px", "3px"] }}
                                        transition={{
                                          duration: 0.5,
                                          repeat: Infinity,
                                          delay: i * 0.12,
                                          ease: "easeInOut"
                                        }}
                                        className="w-0.5 bg-emerald-400 rounded-full"
                                      />
                                    ))}
                                  </div>
                                  <span className="font-extrabold">DICTATION ACTIVE</span>
                                </div>
                              )}

                            </motion.div>
                          </AnimatePresence>
                        );
                      })()
                    ) : (
                      <div className="text-white/20 text-xs font-mono">No active scene reel loaded.</div>
                    )}
                  </div>

                  {/* Left/Right Action Arrows Overlay */}
                  <button
                    type="button"
                    onClick={() => {
                      cinemaAudio.playTransitionChime();
                      setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : storyboardScenes.length - 1));
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/75 border border-white/10 text-white/70 hover:text-white hover:bg-black/90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-25 cursor-pointer shadow-xl group"
                  >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      cinemaAudio.playTransitionChime();
                      setCurrentSlideIndex((prev) => (prev < storyboardScenes.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/75 border border-white/10 text-white/70 hover:text-white hover:bg-black/90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-25 cursor-pointer shadow-xl group"
                  >
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Central playback widgets under viewport */}
                <div className="mt-4 flex items-center gap-4 bg-black/40 backdrop-blur-sm border border-white/5 py-2 px-6 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      cinemaAudio.playTransitionChime();
                      setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : storyboardScenes.length - 1));
                    }}
                    className="text-white/50 hover:text-white transition-colors cursor-pointer"
                    title="Previous Scene"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setAutoPlay(!autoPlay);
                    }}
                    className="w-10 h-10 rounded-full bg-[#FFD600] border border-[#FFD600]/25 text-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-lg"
                    title={autoPlay ? "Pause Autoplay" : "Play Autoplay"}
                  >
                    {autoPlay ? <Pause className="w-4 h-4 fill-current text-black" /> : <Play className="w-4 h-4 fill-current text-black ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      cinemaAudio.playTransitionChime();
                      setCurrentSlideIndex((prev) => (prev < storyboardScenes.length - 1 ? prev + 1 : 0));
                    }}
                    className="text-white/50 hover:text-white transition-colors cursor-pointer"
                    title="Next Scene"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

              </div>

              {/* Right Column: Interactive Director's Script Hub */}
              {(() => {
                const slide = storyboardScenes[currentSlideIndex];
                if (!slide) return null;
                return (
                  <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full bg-[#111114] border border-white/5 rounded-2xl p-5 overflow-y-auto space-y-4 shadow-xl text-left relative z-10">
                    
                    {/* Header Info */}
                    <div className="border-b border-white/5 pb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkle className="w-3.5 h-3.5 text-pictora-yellow fill-current" />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Auteur Scene Guide</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-tight">Active Frame Director Ledger</h3>
                    </div>

                    {/* Live Input for Slide Title */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold text-white/30 uppercase tracking-widest pl-0.5">Scene Label</label>
                      <DebouncedInput
                        value={slide.title || ""}
                        onChange={(val) => updateStoryboardScene(slide.id, { title: val })}
                        placeholder="e.g. Cinematic Establishing Shot"
                        className="w-full bg-black/40 border border-white/5 hover:border-white/10 focus:border-pictora-yellow rounded-xl px-3 py-2 text-xs text-white outline-none transition-all font-sans"
                      />
                    </div>

                    {/* Voice Synthesizer Dictation controls */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-0.5">
                        <label className="text-[9px] font-extrabold text-white/30 uppercase tracking-widest">Dialogue & Action Script</label>
                        <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-400 border border-emerald-500/10">
                          Voice Dictation Ready
                        </div>
                      </div>
                      <DebouncedTextarea
                        value={slide.narration || ""}
                        onChange={(val) => updateStoryboardScene(slide.id, { narration: val })}
                        placeholder="Type voice monologue, dialogue lines, or scenic descriptions here..."
                        className="w-full h-28 bg-black/40 border border-white/5 hover:border-white/10 focus:border-pictora-yellow rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/20 outline-none transition-all resize-none font-sans leading-relaxed"
                      />
                      <div className="flex items-center justify-between text-[10px] text-white/40 border-t border-white/5 pt-1.5 px-0.5">
                        <span>Edits save in real-time</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(slide.narration || "");
                            toast.success("Scene script copied!");
                          }}
                          className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-pictora-yellow/70 hover:text-pictora-yellow cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copy Script
                        </button>
                      </div>
                    </div>

                    {/* Prompt Blueprint details */}
                    <div className="bg-[#0B0B0D] border border-white/5 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8.5px] font-extrabold text-white/30 uppercase tracking-wider">Rendering Prompt Recipe</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(slide.prompt || "");
                            toast.success("Render prompt copied!");
                          }}
                          className="text-[8px] font-bold uppercase tracking-wide text-pictora-yellow/70 hover:text-pictora-yellow flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-2.5 h-2.5" /> Copy Prompt
                        </button>
                      </div>
                      <p className="text-[10px] text-white/50 leading-relaxed max-h-20 overflow-y-auto pr-1">
                        {slide.prompt || "Standard setup prompt."}
                      </p>
                    </div>

                    {/* Speech Synthesis parameters selector */}
                    <div className="pt-2 space-y-3 border-t border-white/5 mt-auto">
                      {ttsEngine === "browser" && (
                        <div className="space-y-1.5">
                          <span className="text-[8.5px] font-extrabold text-white/35 uppercase tracking-wider">Dictation Rate Speed</span>
                          <div className="flex items-center gap-3">
                            <input 
                              type="range"
                              min="0.7"
                              max="1.6"
                              step="0.05"
                              value={speechRate}
                              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                              className="flex-1 accent-pictora-yellow h-1 bg-white/10 rounded-lg cursor-pointer"
                            />
                            <span className="text-[10px] font-mono text-pictora-yellow font-bold shrink-0 min-w-[28px]">{speechRate.toFixed(2)}x</span>
                          </div>
                        </div>
                      )}

                      {/* Voice Engine Toggle */}
                      <div className="space-y-1.5">
                        <span className="text-[8.5px] font-extrabold text-white/35 uppercase tracking-wider">Dictation Audio Node Engine</span>
                        <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-black/60 border border-white/5 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setTtsEngine("browser")}
                            className={cn(
                              "py-1 rounded-lg text-[9.5px] font-extrabold uppercase transition-all cursor-pointer text-center",
                              ttsEngine === "browser"
                                ? "bg-white/[0.08] text-white border border-white/10"
                                : "text-white/40 hover:text-white/75 border border-transparent"
                            )}
                          >
                            🌐 Browser
                          </button>
                          <button
                            type="button"
                            onClick={() => setTtsEngine("gemini")}
                            className={cn(
                              "py-1 rounded-lg text-[9.5px] font-extrabold uppercase transition-all cursor-pointer text-center",
                              ttsEngine === "gemini"
                                ? "bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/25"
                                : "text-white/40 hover:text-white/75 border border-transparent"
                            )}
                          >
                            ✨ Gemini AI
                          </button>
                        </div>
                      </div>

                      {/* Engine Selection Option */}
                      {ttsEngine === "gemini" ? (
                        <div className="space-y-1.5">
                          <span className="text-[8.5px] font-extrabold text-white/35 uppercase tracking-wider">Gemini Premium AI Voice</span>
                          <div className="relative">
                            <select
                              value={geminiVoice}
                              onChange={(e) => setGeminiVoice(e.target.value)}
                              className="w-full bg-[#0E0E10] border border-white/5 text-[10px] text-white/80 rounded-xl px-3 py-2 pr-8 outline-none focus:border-pictora-yellow transition-all appearance-none cursor-pointer"
                            >
                              <option value="Kore">Kore (Soothing Female)</option>
                              <option value="Zephyr">Zephyr (Gentle Female)</option>
                              <option value="Puck">Puck (Warm Male)</option>
                              <option value="Charon">Charon (Narrative Male)</option>
                              <option value="Fenrir">Fenrir (Deep Resonant Male)</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 font-sans">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="text-[8.5px] font-extrabold text-white/35 uppercase tracking-wider">Browser System Voice</span>
                          <div className="relative">
                            <select
                              value={selectedVoiceName}
                              onChange={(e) => setSelectedVoiceName(e.target.value)}
                              className="w-full bg-[#0E0E10] border border-white/5 text-[10px] text-white/80 rounded-xl px-3 py-2 pr-8 outline-none focus:border-pictora-yellow transition-all appearance-none cursor-pointer"
                            >
                              {availableVoices.map(vo => (
                                <option key={vo.name} value={vo.name} className="bg-[#111] text-white text-xs">
                                  {vo.name}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 font-sans">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}

            </div>

            {/* Celluloid negative filmstrip timeline foottrack */}
            <div className="relative z-10 px-6 py-4 bg-black/95 border-t border-white/5 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    cinemaAudio.init(); // Warm up Web Audio context upon explicit user active gesture
                    const activeSlide = storyboardScenes[currentSlideIndex];
                    if (activeSlide && activeSlide.narration) {
                      speakActiveNarration(activeSlide.narration);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-[9.5px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Dictate Current Slide</span>
                </button>

                <div className="text-[10px] text-white/45 hidden md:block">
                  Click any frame negative slide to jump compositions instantly with transition chime.
                </div>
              </div>

              {/* Cellulose negative film sprocket timeline indicator list */}
              <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-1 scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent">
                {storyboardScenes.map((sz, idx) => {
                  const isActive = idx === currentSlideIndex;
                  return (
                    <button
                      key={sz.id}
                      onClick={() => {
                        cinemaAudio.playTransitionChime();
                        setCurrentSlideIndex(idx);
                      }}
                      className={cn(
                        "relative shrink-0 rounded-xl overflow-hidden border transition-all duration-300 group cursor-pointer",
                        isActive 
                          ? "border-pictora-yellow shadow-[0_0_15px_rgba(255,214,0,0.25)] scale-105" 
                          : "border-white/5 opacity-50 hover:opacity-100"
                      )}
                    >
                      {/* Film negative sprockets look */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-[repeating-linear-gradient(90deg,#000,0px,#000_3px,transparent_3px,transparent_6px)] z-10" />
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-[repeating-linear-gradient(90deg,#000,0px,#000_3px,transparent_3px,transparent_6px)] z-10" />
                      
                      <div className="w-24 h-12 bg-[#09090b] relative flex items-center justify-center">
                        {sz.imageUrl ? (
                          <img 
                            src={sz.imageUrl} 
                            alt={sz.title} 
                            className="w-full h-full object-cover select-none pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Clapperboard className="w-5 h-5 text-white/10" />
                          </div>
                        )}
                        {/* Slide badge index */}
                        <div className="absolute top-1.5 left-1.5 bg-black/85 border border-white/5 px-1 rounded text-[8px] font-mono font-bold text-pictora-yellow">
                          S.{sz.sceneNumber}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
