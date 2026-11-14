import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { get, set as idbSet, del } from 'idb-keyval';

// Agnes AI Hub — OpenAI-compatible API gateway
const AGNES_BASE_URL = 'https://apihub.agnes-ai.com/v1';

/**
 * Thin wrapper around fetch for Agnes API calls.
 * Handles auth, JSON body, and response parsing.
 */
export async function agnesFetch<T = any>(
  path: string,
  body: any,
  apiKey: string,
  baseUrl: string = AGNES_BASE_URL
): Promise<T> {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  try {
    const res = await fetch(`${cleanBase}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Agnes API Error: ${res.status} ${errText}`);
    }
    return res.json();
  } catch (err: any) {
    // Network-level errors (CORS, DNS, connection refused, etc.)
    if (err.name === "TypeError" && err.message.includes("Failed to fetch")) {
      throw new Error(
        `Failed to connect to Agnes API at ${cleanBase}. ` +
        `This is usually a CORS or network issue. Make sure the Agnes API endpoint is reachable and allows requests from this origin.`
      );
    }
    throw err;
  }
}

/**
 * Map Agnes API errors into user-friendly messages (replaces parseGeminiError).
 */
export function parseAgnesError(error: any): string {
  if (!error) return "An unexpected empty error was encountered.";
  const errorText = error.message || String(error);

  // Network-level errors (CORS, DNS, connection refused, etc.)
  if (
    errorText.includes("Failed to fetch") ||
    errorText.includes("NetworkError") ||
    errorText.includes("net::ERR") ||
    error.name === "TypeError"
  ) {
    return `Network error connecting to Agnes API: ${errorText}. ` +
      `Check your Agnes API URL in Settings and ensure the endpoint allows cross-origin requests from this browser.`;
  }

  const isQuota =
    errorText.includes("RESOURCE_EXHAUSTED") ||
    errorText.includes("quota") ||
    errorText.includes("429") ||
    String(error.status) === "429";
  if (isQuota) {
    return "Agnes API quota limit exceeded (429). You can bypass this by pasting your own API key in the Prompt config panel!";
  }
  const isPermission =
    errorText.includes("API_KEY_INVALID") ||
    errorText.includes("API key not valid") ||
    errorText.includes("403") ||
    errorText.includes("permission");
  if (isPermission) {
    return "Agnes API Key access denied (403). Please verify your API key in the Prompt settings bar.";
  }
  const isSafety =
    errorText.includes("SAFETY") ||
    errorText.includes("blocked by safety") ||
    errorText.includes("PROHIBITED_CONTENT");
  if (isSafety) {
    return "The model flagged or blocked this generation due to content safety parameters. Please modify your creative descriptions.";
  }
  return errorText;
}

// Custom storage for IndexedDB with debounced writes to eliminate input lag.
// With large payloads (base64 image URLs and multiple scene objects), saving to
// IndexedDB on every store change blocks the main thread thread and generates lag.
// Delaying the write while providing instantaneous in-memory retrieval keeps typing smooth.
let timeoutId: NodeJS.Timeout | null = null;
const pendingWrites = new Map<string, string>();

const debouncedIdbSet = (name: string, delay = 500) => {
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(async () => {
    const value = pendingWrites.get(name);
    if (value !== undefined) {
      pendingWrites.delete(name);
      try {
        await idbSet(name, value);
      } catch (e) {
        console.error("Failed to persist Pictora state to IndexedDB:", e);
      }
    }
  }, delay);
};

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (pendingWrites.has(name)) {
      return pendingWrites.get(name) || null;
    }
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    pendingWrites.set(name, value);
    debouncedIdbSet(name);
  },
  removeItem: async (name: string): Promise<void> => {
    pendingWrites.delete(name);
    if (timeoutId) clearTimeout(timeoutId);
    await del(name);
  },
};

interface GeneratedImage {
  id: string;
  url: string;
  upscaledUrl?: string;
  prompt: string;
  aspectRatio: AspectRatio;
  isFavorite?: boolean;
  generationTime?: number; // in milliseconds
}

export interface StoryboardProject {
  id: string;
  name: string;
  createdAt: string;
}

export interface StoryboardScene {
  id: string;
  projectId?: string;
  sceneNumber: number;
  title: string;
  prompt: string;
  imageUrl: string | null;
  narration: string;
  isGenerating?: boolean;
  subjectImage?: string | null;
  sceneImage?: string | null;
  styleImage?: string | null;
  subjectText?: string;
  sceneText?: string;
  styleText?: string;
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "16:10" | "2:3" | "3:2" | "4:5";
export type Provider = "gemini" | "comfyui" | "agnes";

interface GeneratorState {
  prompt: string;
  isGenerating: boolean;
  images: GeneratedImage[];
  aspectRatio: AspectRatio;
  subjectImage: string | null;
  sceneImage: string | null;
  styleImage: string | null;
  subjectText: string;
  sceneText: string;
  styleText: string;
  showVariations: boolean;
  provider: Provider;
  comfyUiUrl: string;
  geminiApiKey: string;
  agnesApiUrl: string;
  agnesApiKey: string;
  agnesImageModel: string;
  geminiModel: string;
  recentGenerations: number[];

  // Storyboard Mode State
  viewMode: "canvas" | "storyboard";
  storyboardScenes: StoryboardScene[];
  activeSceneId: string | null;
  storyboardStyle: "realistic" | "drawing";
  ttsEngine: "browser" | "gemini";
  geminiVoice: string;
  
  // Custom Project Groupings
  projects: StoryboardProject[];
  activeProjectId: string | null;
  
  // ComfyUI Advanced Settings
  comfyUiCheckpoint: string;
  comfyUiSteps: number;
  comfyUiCfg: number;
  comfyUiSampler: string;
  comfyUiScheduler: string;
  comfyUiDenoise: number;
  
  setPrompt: (prompt: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setSubjectImage: (url: string | null) => void;
  setSceneImage: (url: string | null) => void;
  setStyleImage: (url: string | null) => void;
  setSubjectText: (text: string) => void;
  setSceneText: (text: string) => void;
  setStyleText: (text: string) => void;
  setProvider: (provider: Provider) => void;
  setComfyUiUrl: (url: string) => void;
  setGeminiApiKey: (key: string) => void;
  setAgnesApiUrl: (url: string) => void;
  setAgnesApiKey: (key: string) => void;
  setAgnesImageModel: (model: string) => void;
  setGeminiModel: (model: string) => void;
  toggleShowVariations: () => void;
  generateImages: () => Promise<void>;
  randomizePrompt: () => Promise<void>;
  describeImage: (imageUrl: string) => Promise<string | null>;
  deleteImage: (id: string) => void;
  clearImages: () => void;
  updateImage: (id: string, updates: Partial<GeneratedImage>) => void;
  toggleFavorite: (id: string) => void;

  // Storyboard Actions
  setViewMode: (mode: "canvas" | "storyboard") => void;
  setStoryboardScenes: (scenes: StoryboardScene[]) => void;
  setActiveSceneId: (id: string | null) => void;
  setStoryboardStyle: (style: "realistic" | "drawing") => void;
  addStoryboardScene: () => void;
  updateStoryboardScene: (id: string, updates: Partial<StoryboardScene>) => void;
  deleteStoryboardScene: (id: string) => void;
  generateStoryboardOutline: (concept: string) => Promise<void>;
  generateStoryboardSceneImage: (sceneId: string) => Promise<void>;
  setTtsEngine: (engine: "browser" | "gemini") => void;
  setGeminiVoice: (voice: string) => void;
  generateGeminiTTS: (text: string) => Promise<string>;

  // Project Actions
  ensureProjects: () => void;
  addStoryboardProject: (name: string) => string;
  deleteStoryboardProject: (id: string) => void;
  renameStoryboardProject: (id: string, name: string) => void;
  setActiveProjectId: (id: string | null) => void;
  
  setComfyUiCheckpoint: (checkpoint: string) => void;
  setComfyUiSteps: (steps: number) => void;
  setComfyUiCfg: (cfg: number) => void;
  setComfyUiSampler: (sampler: string) => void;
  setComfyUiScheduler: (scheduler: string) => void;
  setComfyUiDenoise: (denoise: number) => void;

  // Auth State & Actions
  userEmail: string | null;
  isAuthenticated: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
}

export const useGeneratorStore = create<GeneratorState>()(
  persist(
    (set, get) => ({
      prompt: '',
      isGenerating: false,
      images: [],
      aspectRatio: '1:1',
      subjectImage: null,
      sceneImage: null,
      styleImage: null,
      subjectText: '',
      sceneText: '',
      styleText: '',
      showVariations: true,
      provider: 'gemini',
      comfyUiUrl: 'http://127.0.0.1:8188',
      geminiApiKey: '',
      agnesApiUrl: 'https://apihub.agnes-ai.com/v1',
      agnesApiKey: '',
      agnesImageModel: 'agnes-image-2.5-flash',
      geminiModel: 'agnes-3.0-flash',
      recentGenerations: [],

      // Storyboard initial state
      viewMode: 'canvas',
      storyboardScenes: [],
      activeSceneId: null,
      storyboardStyle: 'realistic',
      ttsEngine: 'browser',
      geminiVoice: 'Kore',
      projects: [],
      activeProjectId: null,
      
      // ComfyUI default advanced settings
      comfyUiCheckpoint: 'sd_xl_base_1.0.safetensors',
      comfyUiSteps: 25,
      comfyUiCfg: 7.0,
      comfyUiSampler: 'dpmpp_2m',
      comfyUiScheduler: 'karras',
      comfyUiDenoise: 0.70,

      // Auth Default State
      userEmail: 'dimona.patrick@gmail.com',
      isAuthenticated: true,

      setPrompt: (prompt) => set({ prompt }),
      setAspectRatio: (aspectRatio) => set({ aspectRatio }),
      setSubjectImage: (subjectImage) => set({ subjectImage }),
      setSceneImage: (sceneImage) => set({ sceneImage }),
      setStyleImage: (styleImage) => set({ styleImage }),
      setSubjectText: (subjectText) => set({ subjectText }),
      setSceneText: (sceneText) => set({ sceneText }),
      setStyleText: (styleText) => set({ styleText }),
      setProvider: (provider) => set({ provider }),
      setComfyUiUrl: (comfyUiUrl) => set({ comfyUiUrl }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setAgnesApiUrl: (agnesApiUrl) => set({ agnesApiUrl }),
      setAgnesApiKey: (agnesApiKey) => set({ agnesApiKey }),
      setAgnesImageModel: (agnesImageModel) => set({ agnesImageModel }),
      setGeminiModel: (geminiModel) => set({ geminiModel }),
      setTtsEngine: (ttsEngine) => set({ ttsEngine }),
      setGeminiVoice: (geminiVoice) => set({ geminiVoice }),
      generateGeminiTTS: async (text: string) => {
        // Agnes AI Hub does not expose a TTS endpoint per the API spec.
        // Fall back to browser SpeechSynthesis for voiceover.
        if (typeof window === "undefined" || !window.speechSynthesis) {
          throw new Error("Browser speech synthesis is not available in this environment.");
        }
        return new Promise<string>((resolve, reject) => {
          window.speechSynthesis.cancel();
          const ut = new SpeechSynthesisUtterance(text);
          ut.rate = 1.05;
          ut.pitch = 1.0;
          ut.onend = () => resolve("");
          ut.onerror = (evt) => reject(new Error("Speech synthesis failed: " + evt.error));
          window.speechSynthesis.speak(ut);
        });
      },
      toggleShowVariations: () => set((state) => ({ showVariations: !state.showVariations })),
      deleteImage: (id) => set((state) => ({ images: state.images.filter(img => img.id !== id) })),
      clearImages: () => set({ images: [] }),
      updateImage: (id, updates) => set((state) => ({ images: state.images.map(img => img.id === id ? { ...img, ...updates } : img) })),
      toggleFavorite: (id) => set((state) => ({ images: state.images.map(img => img.id === id ? { ...img, isFavorite: !img.isFavorite } : img) })),

      // Storyboard actions implementation
      setViewMode: (viewMode) => set({ viewMode }),
      
      setStoryboardScenes: (scenes) => set((state) => {
        const activeProjectId = state.activeProjectId;
        const otherProjectsScenes = state.storyboardScenes.filter(s => s.projectId !== activeProjectId);
        const updatedScenes = scenes.map(s => ({ ...s, projectId: activeProjectId || undefined }));
        return {
          storyboardScenes: [...otherProjectsScenes, ...updatedScenes]
        };
      }),
      
      setActiveSceneId: (activeSceneId) => set({ activeSceneId }),
      setStoryboardStyle: (storyboardStyle) => set({ storyboardStyle }),
      
      // Auth implementation
      signIn: (email) => set({ userEmail: email, isAuthenticated: true }),
      signOut: () => set({ userEmail: null, isAuthenticated: false }),
      
      // Projects implementation
      ensureProjects: () => {
        const { projects, storyboardScenes } = get();
        if (projects.length === 0) {
          const defaultProjectId = crypto.randomUUID();
          const defaultProject = {
            id: defaultProjectId,
            name: "Default Project",
            createdAt: new Date().toISOString(),
          };
          
          // Migrate any existing scenes to the default project
          const migratedScenes = storyboardScenes.map(scene => ({
            ...scene,
            projectId: scene.projectId || defaultProjectId
          }));

          const activeSceneId = migratedScenes.length > 0 ? migratedScenes[0].id : null;

          set({
            projects: [defaultProject],
            activeProjectId: defaultProjectId,
            storyboardScenes: migratedScenes,
            activeSceneId: activeSceneId
          });
        }
      },

      addStoryboardProject: (name) => {
        const id = crypto.randomUUID();
        const newProject = {
          id,
          name: name.trim() || `Project-${new Date().toLocaleDateString()}`,
          createdAt: new Date().toISOString(),
        };
        
        // Let's create an initial dummy scene inside the new project so it doesn't start completely blank!
        const initialSceneId = crypto.randomUUID();
        const initialScene: StoryboardScene = {
          id: initialSceneId,
          projectId: id,
          sceneNumber: 1,
          title: "Introduction Scene",
          prompt: "",
          imageUrl: null,
          narration: ""
        };

        set((state) => ({
          projects: [...state.projects, newProject],
          storyboardScenes: [...state.storyboardScenes, initialScene],
          activeProjectId: id,
          activeSceneId: initialSceneId
        }));
        return id;
      },

      deleteStoryboardProject: (id) => set((state) => {
        const remainingProjects = state.projects.filter(p => p.id !== id);
        const remainingScenes = state.storyboardScenes.filter(s => s.projectId !== id);
        
        let nextActiveProjectId = state.activeProjectId;
        if (nextActiveProjectId === id) {
          nextActiveProjectId = remainingProjects.length > 0 ? remainingProjects[0].id : null;
        }

        const nextActiveProjectScenes = remainingScenes.filter(s => s.projectId === nextActiveProjectId);
        const nextActiveSceneId = nextActiveProjectScenes.length > 0 ? nextActiveProjectScenes[0].id : null;

        return {
          projects: remainingProjects,
          storyboardScenes: remainingScenes,
          activeProjectId: nextActiveProjectId,
          activeSceneId: nextActiveSceneId
        };
      }),

      renameStoryboardProject: (id, name) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, name: name.trim() || p.name } : p)
      })),

      setActiveProjectId: (activeProjectId) => set((state) => {
        const projectScenes = state.storyboardScenes.filter(s => s.projectId === activeProjectId);
        const activeSceneId = projectScenes.length > 0 ? projectScenes[0].id : null;
        return {
          activeProjectId,
          activeSceneId
        };
      }),

      addStoryboardScene: () => set((state) => {
        const activeProjectId = state.activeProjectId;
        const projectScenes = state.storyboardScenes.filter(s => s.projectId === activeProjectId);
        const nextNum = projectScenes.length > 0 
          ? Math.max(...projectScenes.map(s => s.sceneNumber)) + 1 
          : 1;
        const newSceneId = crypto.randomUUID();
        const newScene: StoryboardScene = {
          id: newSceneId,
          projectId: activeProjectId || undefined,
          sceneNumber: nextNum,
          title: `Scene ${nextNum}`,
          prompt: "",
          imageUrl: null,
          narration: "",
        };
        return {
          storyboardScenes: [...state.storyboardScenes, newScene],
          activeSceneId: state.activeSceneId || newSceneId
        };
      }),

      updateStoryboardScene: (id, updates) => set((state) => ({
        storyboardScenes: state.storyboardScenes.map(s => s.id === id ? { ...s, ...updates } : s)
      })),

      deleteStoryboardScene: (id) => set((state) => {
        const targetScene = state.storyboardScenes.find(s => s.id === id);
        const pId = targetScene?.projectId;
        
        const otherScenes = state.storyboardScenes.filter(s => s.id !== id);
        
        const projectScenes = otherScenes.filter(s => s.projectId === pId);
        const reindexedProjectScenes = projectScenes.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
        
        const finalScenes = [
          ...otherScenes.filter(s => s.projectId !== pId),
          ...reindexedProjectScenes
        ];
        
        let activeId = state.activeSceneId;
        if (activeId === id) {
          activeId = reindexedProjectScenes.length > 0 ? reindexedProjectScenes[0].id : null;
        }
        return {
          storyboardScenes: finalScenes,
          activeSceneId: activeId
        };
      }),
      
      setComfyUiCheckpoint: (comfyUiCheckpoint) => set({ comfyUiCheckpoint }),
      setComfyUiSteps: (comfyUiSteps) => set({ comfyUiSteps }),
      setComfyUiCfg: (comfyUiCfg) => set({ comfyUiCfg }),
      setComfyUiSampler: (comfyUiSampler) => set({ comfyUiSampler }),
      setComfyUiScheduler: (comfyUiScheduler) => set({ comfyUiScheduler }),
      setComfyUiDenoise: (comfyUiDenoise) => set({ comfyUiDenoise }),

      randomizePrompt: async () => {
        const { agnesApiKey, agnesApiUrl, geminiModel } = get();
        try {
          const agnesBaseUrl = agnesApiUrl.replace(/\/+$/, "");
          const data = await agnesFetch(
            "/chat/completions",
            {
              model: geminiModel,
              messages: [
                {
                  role: "user",
                  content: "Generate a short, creative, and highly descriptive image generation prompt (max 20 words). Response should be ONLY the prompt text.",
                },
              ],
            },
            agnesApiKey,
            agnesBaseUrl
          );
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) set({ prompt: text });
        } catch (e) {
          console.error("Failed to randomize prompt:", e);
          const fallbacks = ["Cyberpunk city at night", "Misty forest in autumn", "A futuristic robot gardener"];
          set({ prompt: fallbacks[Math.floor(Math.random() * fallbacks.length)] });
        }
      },

      describeImage: async (imageUrl: string) => {
        const { agnesApiKey, agnesApiUrl, geminiModel } = get();
        try {
          let base64Data = imageUrl;
          let mimeType = 'image/png';

          if (imageUrl.startsWith('data:')) {
            const parts = imageUrl.split(';base64,');
            mimeType = parts[0].split(':')[1];
            base64Data = parts[1];
          }

          const agnesBaseUrl = agnesApiUrl.replace(/\/+$/, "");
          const data = await agnesFetch(
            "/chat/completions",
            {
              model: geminiModel,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: "Describe this image in detailed visual terms suitable for an AI image generator prompt. Output ONLY the raw descriptive prompt string with no meta intro/outro or quotes. Max 45 words." },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
                  ],
                },
              ],
              extra_body: { response_format: "text" },
            },
            agnesApiKey,
            agnesBaseUrl
          );
          const text = data.choices?.[0]?.message?.content?.trim();
          return text || null;
        } catch (e) {
          console.error("Failed to describe image:", e);
          return null;
        }
      },

      generateImages: async () => {
        const { 
          prompt, images, aspectRatio, subjectImage, sceneImage, styleImage, subjectText, sceneText, styleText, provider, comfyUiUrl, 
          geminiApiKey, agnesApiUrl, agnesApiKey, agnesImageModel, geminiModel, comfyUiCheckpoint, comfyUiSteps, comfyUiCfg, comfyUiSampler, comfyUiScheduler, comfyUiDenoise 
        } = get();
        if (!prompt.trim()) {
          toast.error("Please enter a prompt first!");
          return;
        }

        set({ isGenerating: true, showVariations: true });
        const startTime = Date.now();

        try {
          if (provider === 'agnes') {
            // --- Agnes AI Hub Integration (OpenAI-compatible) ---
            const agnesKey = agnesApiKey || process.env.AGNES_API_KEY || '';
            const agnesBaseUrl = agnesApiUrl.replace(/\/+$/, "");

            if (!agnesKey) {
              throw new Error("Agnes API Key is required. Please configure it in the Generator settings tab.");
            }

            if (!agnesBaseUrl) {
              throw new Error("Agnes API URL is required. Please configure it in the Generator settings tab.");
            }

            // Agnes size tiers: 1K, 2K, 3K, 4K
            const sizeMap: Record<string, string> = {
              "1:1": "1K", "16:9": "2K", "9:16": "2K", "4:3": "2K", "3:4": "2K",
              "16:10": "2K", "2:3": "2K", "3:2": "2K", "4:5": "2K",
            };
            const ratioMap: Record<string, string> = {
              "1:1": "1:1", "16:9": "16:9", "9:16": "9:16", "4:3": "4:3", "3:4": "3:4",
              "16:10": "16:10", "2:3": "2:3", "3:2": "3:2", "4:5": "4:5",
            };

            const size = sizeMap[aspectRatio] || "2K";
            const ratio = ratioMap[aspectRatio] || "1:1";

            // Build extra_body per Agnes convention (response_format + image refs go here)
            const extra_body: any = {
              response_format: "b64_json",
              ratio,
            };

            // Image-to-image / multi-image references go in extra_body.image as array of public URLs or data URIs
            const imageRefs: string[] = [];
            if (subjectImage) imageRefs.push(subjectImage);
            if (sceneImage) imageRefs.push(sceneImage);
            if (styleImage) imageRefs.push(styleImage);
            if (imageRefs.length > 0) {
              extra_body.image = imageRefs;
            }

            const body: any = {
              model: agnesImageModel || "agnes-image-2.5-flash",
              prompt,
              n: 1,
              size,
              extra_body,
            };

            const response = await fetch(`${agnesBaseUrl}/images/generations`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${agnesKey}`,
              },
              body: JSON.stringify(body),
            });

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(`Agnes API Error: ${response.status} ${errText}`);
            }

            const data = await response.json();
            const b64 = data.data?.[0]?.b64_json || data.data?.[0]?.url;

            if (!b64) {
              throw new Error("Agnes API returned no image data.");
            }

            const url = b64.startsWith('http') ? b64 : `data:image/png;base64,${b64}`;
            const generationTime = Date.now() - startTime;
            const newImage = { id: crypto.randomUUID(), url, prompt, aspectRatio, generationTime };

            const now = Date.now();
            const recentGenerations = get().recentGenerations.filter(t => now - t < 60000);
            set({
              images: [newImage, ...images].slice(0, 100),
              recentGenerations: [...recentGenerations, now],
            });

            if (!get().subjectImage) set({ subjectImage: url });
            return;
          } else {
            // --- Solid ComfyUI Integration ---
            const clientId = crypto.randomUUID();
            const { width, height } = (() => {
              const base = 1024;
              switch(aspectRatio) {
                case "1:1": return { width: 1024, height: 1024 };
                case "16:9": return { width: 1344, height: 768 };
                case "9:16": return { width: 768, height: 1344 };
                case "4:3": return { width: 1152, height: 896 };
                case "3:4": return { width: 896, height: 1152 };
                case "2:3": return { width: 832, height: 1216 };
                case "3:2": return { width: 1216, height: 832 };
                default: return { width: 1024, height: 1024 };
              }
            })();

            // Helper to upload images to ComfyUI
            const uploadImage = async (dataUrl: string, name: string) => {
              const [header, data] = dataUrl.split(',');
              const mime = header.split(':')[1].split(';')[0];
              const binary = atob(data);
              const array = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
              const blob = new Blob([array], { type: mime });
              
              const formData = new FormData();
              formData.append('image', blob, `${name}.png`);
              formData.append('overwrite', 'true');
              
              const res = await fetch(`${comfyUiUrl}/upload/image`, {
                method: 'POST',
                body: formData
              });
              if (!res.ok) throw new Error(`Failed to upload ${name} to ComfyUI`);
              return await res.json();
            };

            // Prepare workflow dynamically
            // Note: This matches standard SDXL based workflows, supporting img2img if subject image is supplied!
            const positivePrompt = prompt;
            const negativePrompt = "lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, watermark, signature";

            const promptJson: any = {
              "3": { 
                "class_type": "KSampler", 
                "inputs": { 
                  "seed": Math.floor(Math.random() * 999999999), 
                  "steps": comfyUiSteps, 
                  "cfg": comfyUiCfg, 
                  "sampler_name": comfyUiSampler, 
                  "scheduler": comfyUiScheduler, 
                  "denoise": subjectImage ? comfyUiDenoise : 1.0, 
                  "model": ["4", 0], 
                  "positive": ["6", 0], 
                  "negative": ["7", 0], 
                  "latent_image": subjectImage ? ["11", 0] : ["5", 0] 
                } 
              },
              "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": comfyUiCheckpoint } },
              "5": { "class_type": "EmptyLatentImage", "inputs": { "width": width, "height": height, "batch_size": 1 } },
              "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positivePrompt, "clip": ["4", 1] } },
              "7": { "class_type": "CLIPTextEncode", "inputs": { "text": negativePrompt, "clip": ["4", 1] } },
              "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
              "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": "Pictora", "images": ["8", 0] } }
            };

            // Handle Image Inputs & conditional workflows
            if (subjectImage) {
              await uploadImage(subjectImage, "subject");
              // Chain VAE Encode for img2img using loaded image instead of empty latent
              promptJson["10"] = { "class_type": "LoadImage", "inputs": { "image": "subject.png" } };
              promptJson["11"] = { "class_type": "VAEEncode", "inputs": { "pixels": ["10", 0], "vae": ["4", 2] } };
            }
            if (sceneImage) await uploadImage(sceneImage, "scene");
            if (styleImage) await uploadImage(styleImage, "style");

            const queueResponse = await fetch(`${comfyUiUrl}/prompt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: promptJson, client_id: clientId })
            });
            
            if (!queueResponse.ok) {
              const errText = await queueResponse.text();
              throw new Error(`ComfyUI Error: ${errText || queueResponse.statusText}`);
            }
            
            const { prompt_id } = await queueResponse.json();

            // Polling with status updates
            let imageUrl = null;
            let statusMessage = "In Queue...";
            
            for (let i = 0; i < 120; i++) { // 2 minute timeout
              const historyResponse = await fetch(`${comfyUiUrl}/history/${prompt_id}`);
              if (!historyResponse.ok) continue;
              
              const history = await historyResponse.json();
              if (history[prompt_id]) {
                const outputs = history[prompt_id].outputs;
                // Find any output that has images
                const anyOutput: any = Object.values(outputs).find((val: any) => val.images);
                if (anyOutput && anyOutput.images && anyOutput.images.length > 0) {
                  const img = anyOutput.images[0];
                  imageUrl = `${comfyUiUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
                  break;
                }
              }
              await new Promise(r => setTimeout(r, 1000));
            }

            if (imageUrl) {
              const generationTime = Date.now() - startTime;
              const newImage = { id: crypto.randomUUID(), url: imageUrl, prompt, aspectRatio, generationTime };
              
              const now = Date.now();
              const recentGenerations = get().recentGenerations.filter(t => now - t < 60000);
              set({ 
                images: [newImage, ...images].slice(0, 100),
                recentGenerations: [...recentGenerations, now]
              });
            } else {
              throw new Error("ComfyUI generation timed out or the workflow failed to produce an image.");
            }
          }
        } catch (error: any) {
          console.error("Generation failed:", error);
          const errorMessage = parseAgnesError(error);
          toast.error(errorMessage);
        } finally {
          set({ isGenerating: false });
        }
      },

      generateStoryboardOutline: async (concept: string) => {
        const { agnesApiKey, agnesApiUrl, geminiModel, storyboardStyle } = get();
        try {
          const agnesBaseUrl = agnesApiUrl.replace(/\/+$/, "");
          const stylePromptDesc = storyboardStyle === 'drawing'
            ? "Hand-drawn sketch illustration style image prompt (gorgeous concept sketch, pencil and black ink line drawing style, comic book outline, colored sketch, max 20 words)"
            : "Photographic realistic style image prompt (stunning film camera work, natural highlights, movie still raw realistic aesthetic, cinematic, max 20 words)";

          const data = await agnesFetch(
            "/chat/completions",
            {
              model: geminiModel,
              messages: [
                {
                  role: "user",
                  content: `You are an expert movie and presentation storyboard writer. Given this concept: "${concept}", write a cohesive, sequential 4-scene storyboard matching the aesthetic of: ${storyboardStyle.toUpperCase()}. 
For each scene, provide:
1. Title
2. ${stylePromptDesc}
3. Voiceover narration / action description.

Your response MUST be a valid JSON array matching the structure:
[
  {
    "sceneNumber": 1,
    "title": "Scene Title",
    "prompt": "An image generation prompt aligning with the requested visual style",
    "narration": "What is happening / voiceover description"
  },
  ...
]
Return ONLY raw JSON. No markdown backticks, no comments, no intro or outro text.`,
                },
              ],
            },
            agnesApiKey,
            agnesBaseUrl
          );
          const text = data.choices?.[0]?.message?.content?.trim() || "[]";
          const cleanText = text.replace(/^```json\s*/i, '').replace(/```\s*$/g, '').trim();
          const parsed = JSON.parse(cleanText);
          const activeProjectId = get().activeProjectId;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const scenesWithIds = parsed.map((item, idx) => ({
              id: crypto.randomUUID(),
              projectId: activeProjectId || undefined,
              sceneNumber: item.sceneNumber || (idx + 1),
              title: item.title || `Scene ${idx + 1}`,
              prompt: item.prompt || "",
              imageUrl: null,
              narration: item.narration || "",
            }));
            
            const otherProjectsScenes = get().storyboardScenes.filter(s => s.projectId !== activeProjectId);
            const finalScenes = [...otherProjectsScenes, ...scenesWithIds];
            
            set({ storyboardScenes: finalScenes, activeSceneId: scenesWithIds[0].id });
            toast.success("Drafted 4 sequential scenes for your concept!");
          } else {
            throw new Error("Invalid output format");
          }
        } catch (e: any) {
          console.error("Failed to generate outline:", e);
          const parsedMessage = parseAgnesError(e);
          toast.warning(`Note: Offline fallback templates activated. ${parsedMessage}`, { duration: 8000 });
          const activeProjectId = get().activeProjectId;
          const fallback = [
            {
              id: crypto.randomUUID(),
              projectId: activeProjectId || undefined,
              sceneNumber: 1,
              title: "The Awakening",
              prompt: `Cinematic shot, futuristic cyborg opening its glowing blue eyes in a sleek white lab, tech aesthetic`,
              imageUrl: null,
              narration: "A spark of light ignites in the dark as the prototype system goes online for the very first time.",
            },
            {
              id: crypto.randomUUID(),
              projectId: activeProjectId || undefined,
              sceneNumber: 2,
              title: "Discovery",
              prompt: `Cinematic wide shot of the cyborg looking out from a high balcony at a towering neon cyberpunk skyline, raining`,
              imageUrl: null,
              narration: "Stepping outside, it witnesses the complex, beautiful, and chaotic city it is designed to protect.",
            },
            {
              id: crypto.randomUUID(),
              projectId: activeProjectId || undefined,
              sceneNumber: 3,
              title: "The Flight",
              prompt: `Dynamic high angle shot of a hovercar racing through narrow orange energy streams between skyscrapers, motion blur`,
              imageUrl: null,
              narration: "With sirens wailing behind, the prototype races through the cyber corridors to escape its pursuers.",
            },
            {
              id: crypto.randomUUID(),
              projectId: activeProjectId || undefined,
              sceneNumber: 4,
              title: "A New Hope",
              prompt: `Close-up of cyborg holding a small vibrant glowing organic green plant inside the sterile steel city, soft lighting`,
              imageUrl: null,
              narration: "Amongst the cold circuits and neon beams, a delicate hope emerges, marking a fresh beginning for tomorrow.",
            }
          ];
          
          const otherProjectsScenes = get().storyboardScenes.filter(s => s.projectId !== activeProjectId);
          const finalScenes = [...otherProjectsScenes, ...fallback];
          
          set({ storyboardScenes: finalScenes, activeSceneId: fallback[0].id });
          toast.warning("Drafted storyboard using creative sci-fi fallback template");
        }
      },

      generateStoryboardSceneImage: async (sceneId: string) => {
        const { 
          storyboardScenes, provider, comfyUiUrl, agnesApiUrl, aspectRatio,
          agnesApiKey, agnesImageModel,
          comfyUiCheckpoint, comfyUiSteps, comfyUiCfg, comfyUiSampler, comfyUiScheduler, comfyUiDenoise,
          storyboardStyle, subjectImage, sceneImage, styleImage, subjectText, sceneText, styleText
        } = get();
        const scene = storyboardScenes.find(s => s.id === sceneId);
        if (!scene || !scene.prompt.trim()) {
          toast.error("Scene has no prompt!");
          return;
        }

        // Resolve active references (Scene-specific first, falling back to global)
        const targetSubjectImg = scene.subjectImage !== undefined && scene.subjectImage !== null ? scene.subjectImage : subjectImage;
        const targetSceneImg = scene.sceneImage !== undefined && scene.sceneImage !== null ? scene.sceneImage : sceneImage;
        const targetStyleImg = scene.styleImage !== undefined && scene.styleImage !== null ? scene.styleImage : styleImage;

        const targetSubjectText = scene.subjectText !== undefined && scene.subjectText !== null ? scene.subjectText : subjectText;
        const targetSceneText = scene.sceneText !== undefined && scene.sceneText !== null ? scene.sceneText : sceneText;
        const targetStyleText = scene.styleText !== undefined && scene.styleText !== null ? scene.styleText : styleText;

        // Set isGenerating for the scene
        set((state) => ({
          storyboardScenes: state.storyboardScenes.map(s => s.id === sceneId ? { ...s, isGenerating: true } : s)
        }));

        const startTime = Date.now();

        try {
          if (provider === 'agnes') {
            // --- Agnes AI Hub Integration (OpenAI-compatible) ---
            const agnesKey = agnesApiKey || process.env.AGNES_API_KEY || '';
            const agnesBaseUrl = agnesApiUrl.replace(/\/+$/, "");

            if (!agnesKey) {
              toast.error("Agnes API Key is required. Please configure it in the Generator settings tab.");
              set((state) => ({
                storyboardScenes: state.storyboardScenes.map(s => s.id === sceneId ? { ...s, isGenerating: false } : s)
              }));
              return;
            }

            if (!agnesBaseUrl) {
              toast.error("Agnes API URL is required. Please configure it in the Generator settings tab.");
              set((state) => ({
                storyboardScenes: state.storyboardScenes.map(s => s.id === sceneId ? { ...s, isGenerating: false } : s)
              }));
              return;
            }

            // Agnes size tiers: 1K, 2K, 3K, 4K
            const sizeMap: Record<string, string> = {
              "1:1": "1K", "16:9": "2K", "9:16": "2K", "4:3": "2K", "3:4": "2K",
              "16:10": "2K", "2:3": "2K", "3:2": "2K", "4:5": "2K",
            };
            const ratioMap: Record<string, string> = {
              "1:1": "1:1", "16:9": "16:9", "9:16": "9:16", "4:3": "4:3", "3:4": "3:4",
              "16:10": "16:10", "2:3": "2:3", "3:2": "3:2", "4:5": "4:5",
            };

            const size = sizeMap[aspectRatio] || "2K";
            const ratio = ratioMap[aspectRatio] || "1:1";

            // Build extra_body per Agnes convention
            const extra_body: any = {
              response_format: "b64_json",
              ratio,
            };

            // Image-to-image / multi-image references go in extra_body.image
            const imageRefs: string[] = [];
            if (targetSubjectImg) imageRefs.push(targetSubjectImg);
            if (targetSceneImg) imageRefs.push(targetSceneImg);
            if (targetStyleImg) imageRefs.push(targetStyleImg);
            if (imageRefs.length > 0) {
              extra_body.image = imageRefs;
            }

            // Build adjusted prompt with style suffix
            const styleSuffix = storyboardStyle === 'drawing'
              ? ", hand-drawn concept sketch, ink pen and pencil line drawing style, clean comic artwork, textured draft lines"
              : ", cinematic realistic photography, raw hyperrealistic photo, film still, highly detailed natural soft lighting";

            const adjustedPrompt = `${scene.prompt}${styleSuffix}`;

            try {
              const data = await agnesFetch(
                "/images/generations",
                {
                  model: agnesImageModel || "agnes-image-2.5-flash",
                  prompt: adjustedPrompt,
                  n: 1,
                  size,
                  extra_body,
                },
                agnesKey,
                agnesBaseUrl
              );

              const b64 = data.data?.[0]?.b64_json || data.data?.[0]?.url;
              if (!b64) {
                throw new Error("Agnes API returned no image data.");
              }

              const url = b64.startsWith('http') ? b64 : `data:image/png;base64,${b64}`;
              const newImage = {
                id: crypto.randomUUID(),
                url,
                prompt: scene.prompt,
                aspectRatio,
                generationTime: Date.now() - startTime,
              };

              set((state) => ({
                images: [newImage, ...state.images].slice(0, 100),
                storyboardScenes: state.storyboardScenes.map(s => s.id === sceneId ? { ...s, imageUrl: url, isGenerating: false } : s),
              }));
              return;
            } catch (e: any) {
              console.error("Agnes storyboard scene generation failed:", e);
              const parsedMessage = parseAgnesError(e);
              toast.error(`Scene ${scene.sceneNumber} image generation failed: ${parsedMessage}`, { duration: 8000 });
              set((state) => ({
                storyboardScenes: state.storyboardScenes.map(s => s.id === sceneId ? { ...s, isGenerating: false } : s)
              }));
              return;
            }
          } else {
            // ComfyUI workflow
            const clientId = crypto.randomUUID();
            const { width, height } = (() => {
              switch(aspectRatio) {
                case "16:9": return { width: 1344, height: 768 };
                case "9:16": return { width: 768, height: 1344 };
                default: return { width: 1024, height: 1024 };
              }
            })();

            // Helper to upload images to ComfyUI
            const uploadImage = async (dataUrl: string, name: string) => {
              const [header, data] = dataUrl.split(',');
              const mime = header.split(':')[1].split(';')[0];
              const binary = atob(data);
              const array = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
              const blob = new Blob([array], { type: mime });
              
              const formData = new FormData();
              formData.append('image', blob, `${name}.png`);
              formData.append('overwrite', 'true');
              
              const res = await fetch(`${comfyUiUrl}/upload/image`, {
                method: 'POST',
                body: formData
              });
              if (!res.ok) throw new Error(`Failed to upload ${name} to ComfyUI`);
              return await res.json();
            };

            const promptJson: any = {
              "3": { 
                "class_type": "KSampler", 
                "inputs": { 
                  "seed": Math.floor(Math.random() * 999999999), 
                  "steps": comfyUiSteps, 
                  "cfg": comfyUiCfg, 
                  "sampler_name": comfyUiSampler, 
                  "scheduler": comfyUiScheduler, 
                  "denoise": targetSubjectImg ? comfyUiDenoise : 1.0, 
                  "model": ["4", 0], 
                  "positive": ["6", 0], 
                  "negative": ["7", 0], 
                  "latent_image": targetSubjectImg ? ["11", 0] : ["5", 0] 
                } 
              },
              "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": comfyUiCheckpoint } },
              "5": { "class_type": "EmptyLatentImage", "inputs": { "width": width, "height": height, "batch_size": 1 } },
              "6": { "class_type": "CLIPTextEncode", "inputs": { "text": scene.prompt, "clip": ["4", 1] } },
              "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "low quality, worst quality, text, blurry", "clip": ["4", 1] } },
              "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
              "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": "Storyboard", "images": ["8", 0] } }
            };

            if (targetSubjectImg) {
              await uploadImage(targetSubjectImg, "subject");
              promptJson["10"] = { "class_type": "LoadImage", "inputs": { "image": "subject.png" } };
              promptJson["11"] = { "class_type": "VAEEncode", "inputs": { "pixels": ["10", 0], "vae": ["4", 2] } };
            }
            if (targetSceneImg) await uploadImage(targetSceneImg, "scene");
            if (targetStyleImg) await uploadImage(targetStyleImg, "style");

            const queueResponse = await fetch(`${comfyUiUrl}/prompt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: promptJson, client_id: clientId })
            });
            if (!queueResponse.ok) throw new Error("ComfyUI queue down");
            const { prompt_id } = await queueResponse.json();

            let imageUrl = null;
            for (let i = 0; i < 60; i++) {
              const historyResponse = await fetch(`${comfyUiUrl}/history/${prompt_id}`);
              if (historyResponse.ok) {
                const history = await historyResponse.json();
                if (history[prompt_id]) {
                  const outputs = history[prompt_id].outputs;
                  const anyOutput: any = Object.values(outputs).find((val: any) => val.images);
                  if (anyOutput && anyOutput.images?.length > 0) {
                    const img = anyOutput.images[0];
                    imageUrl = `${comfyUiUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
                    break;
                  }
                }
              }
              await new Promise(r => setTimeout(r, 1000));
            }

            if (imageUrl) {
              const newImage = { 
                id: crypto.randomUUID(), 
                url: imageUrl, 
                prompt: scene.prompt, 
                aspectRatio, 
                generationTime: Date.now() - startTime 
              };

              set((state) => ({
                images: [newImage, ...state.images].slice(0, 100),
                storyboardScenes: state.storyboardScenes.map(s => s.id === sceneId ? { ...s, imageUrl: imageUrl, isGenerating: false } : s)
              }));
            } else {
              throw new Error("ComfyUI polling timed out");
            }
          }
        } catch (error: any) {
          console.error("Storyboard scene generation failed:", error);
          const parsedMessage = parseAgnesError(error);
          toast.error(`Scene ${scene.sceneNumber} image generation failed: ${parsedMessage}`, { duration: 8000 });
          set((state) => ({
            storyboardScenes: state.storyboardScenes.map(s => s.id === sceneId ? { ...s, isGenerating: false } : s)
          }));
        }
      }
    }),
    {
      name: 'pictora-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        images: state.images,
        geminiApiKey: state.geminiApiKey,
        agnesApiKey: state.agnesApiKey,
        agnesApiUrl: state.agnesApiUrl,
        agnesImageModel: state.agnesImageModel,
        geminiModel: state.geminiModel,
        provider: state.provider,
        comfyUiUrl: state.comfyUiUrl,
        aspectRatio: state.aspectRatio,
        comfyUiCheckpoint: state.comfyUiCheckpoint,
        comfyUiSteps: state.comfyUiSteps,
        comfyUiCfg: state.comfyUiCfg,
        comfyUiSampler: state.comfyUiSampler,
        comfyUiScheduler: state.comfyUiScheduler,
        comfyUiDenoise: state.comfyUiDenoise,
        viewMode: state.viewMode,
        storyboardScenes: state.storyboardScenes,
        activeSceneId: state.activeSceneId,
        ttsEngine: state.ttsEngine,
        geminiVoice: state.geminiVoice,
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);

