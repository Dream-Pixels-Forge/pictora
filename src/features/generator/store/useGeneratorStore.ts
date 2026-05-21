import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { GoogleGenAI } from "@google/genai";
import { toast } from 'sonner';
import { get, set as idbSet, del } from 'idb-keyval';

// Custom storage for IndexedDB
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
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

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "16:10" | "2:3" | "3:2" | "4:5";
export type Provider = "gemini" | "comfyui";

interface GeneratorState {
  prompt: string;
  isGenerating: boolean;
  images: GeneratedImage[];
  aspectRatio: AspectRatio;
  subjectImage: string | null;
  sceneImage: string | null;
  styleImage: string | null;
  showVariations: boolean;
  provider: Provider;
  comfyUiUrl: string;
  geminiApiKey: string;
  geminiModel: string;
  recentGenerations: number[];
  
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
  setProvider: (provider: Provider) => void;
  setComfyUiUrl: (url: string) => void;
  setGeminiApiKey: (key: string) => void;
  setGeminiModel: (model: string) => void;
  toggleShowVariations: () => void;
  generateImages: () => Promise<void>;
  randomizePrompt: () => Promise<void>;
  deleteImage: (id: string) => void;
  clearImages: () => void;
  updateImage: (id: string, updates: Partial<GeneratedImage>) => void;
  toggleFavorite: (id: string) => void;
  
  setComfyUiCheckpoint: (checkpoint: string) => void;
  setComfyUiSteps: (steps: number) => void;
  setComfyUiCfg: (cfg: number) => void;
  setComfyUiSampler: (sampler: string) => void;
  setComfyUiScheduler: (scheduler: string) => void;
  setComfyUiDenoise: (denoise: number) => void;
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
      showVariations: true,
      provider: 'gemini',
      comfyUiUrl: 'http://127.0.0.1:8188',
      geminiApiKey: '',
      geminiModel: 'gemini-2.5-flash-image',
      recentGenerations: [],
      
      // ComfyUI default advanced settings
      comfyUiCheckpoint: 'sd_xl_base_1.0.safetensors',
      comfyUiSteps: 25,
      comfyUiCfg: 7.0,
      comfyUiSampler: 'dpmpp_2m',
      comfyUiScheduler: 'karras',
      comfyUiDenoise: 0.70,

      setPrompt: (prompt) => set({ prompt }),
      setAspectRatio: (aspectRatio) => set({ aspectRatio }),
      setSubjectImage: (subjectImage) => set({ subjectImage }),
      setSceneImage: (sceneImage) => set({ sceneImage }),
      setStyleImage: (styleImage) => set({ styleImage }),
      setProvider: (provider) => set({ provider }),
      setComfyUiUrl: (comfyUiUrl) => set({ comfyUiUrl }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setGeminiModel: (geminiModel) => set({ geminiModel }),
      toggleShowVariations: () => set((state) => ({ showVariations: !state.showVariations })),
      deleteImage: (id) => set((state) => ({ images: state.images.filter(img => img.id !== id) })),
      clearImages: () => set({ images: [] }),
      updateImage: (id, updates) => set((state) => ({ images: state.images.map(img => img.id === id ? { ...img, ...updates } : img) })),
      toggleFavorite: (id) => set((state) => ({ images: state.images.map(img => img.id === id ? { ...img, isFavorite: !img.isFavorite } : img) })),
      
      setComfyUiCheckpoint: (comfyUiCheckpoint) => set({ comfyUiCheckpoint }),
      setComfyUiSteps: (comfyUiSteps) => set({ comfyUiSteps }),
      setComfyUiCfg: (comfyUiCfg) => set({ comfyUiCfg }),
      setComfyUiSampler: (comfyUiSampler) => set({ comfyUiSampler }),
      setComfyUiScheduler: (comfyUiScheduler) => set({ comfyUiScheduler }),
      setComfyUiDenoise: (comfyUiDenoise) => set({ comfyUiDenoise }),

      randomizePrompt: async () => {
        const { geminiApiKey } = get();
        try {
          const ai = new GoogleGenAI({ apiKey: geminiApiKey || process.env.GEMINI_API_KEY || '' });
          const result = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: "Generate a short, creative, and highly descriptive image generation prompt (max 20 words). Response should be ONLY the prompt text."
          });
          const text = result.text?.trim();
          if (text) set({ prompt: text });
        } catch (e) {
          console.error("Failed to randomize prompt:", e);
          const fallbacks = ["Cyberpunk city at night", "Misty forest in autumn", "A futuristic robot gardener"];
          set({ prompt: fallbacks[Math.floor(Math.random() * fallbacks.length)] });
        }
      },

      generateImages: async () => {
        const { 
          prompt, images, aspectRatio, subjectImage, sceneImage, styleImage, provider, comfyUiUrl, 
          geminiApiKey, geminiModel, comfyUiCheckpoint, comfyUiSteps, comfyUiCfg, comfyUiSampler, comfyUiScheduler, comfyUiDenoise 
        } = get();
        if (!prompt.trim()) {
          toast.error("Please enter a prompt first!");
          return;
        }

        set({ isGenerating: true, showVariations: true });
        const startTime = Date.now();

        try {
          if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: geminiApiKey || process.env.GEMINI_API_KEY || '' });

            let apiAspectRatio = aspectRatio;
            if (aspectRatio === "16:10") apiAspectRatio = "16:9";
            if (aspectRatio === "3:2") apiAspectRatio = "4:3";
            if (aspectRatio === "2:3") apiAspectRatio = "3:4";
            if (aspectRatio === "4:5") apiAspectRatio = "3:4";

            const parts: any[] = [{ text: prompt }];

            const getInlineData = async (imageInput: string | null) => {
              if (!imageInput) return null;
              if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
                try {
                  const response = await fetch(imageInput);
                  const blob = await response.blob();
                  const base64Url = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                  });
                  const [header, data] = base64Url.split(',');
                  const mimeType = header.split(':')[1].split(';')[0];
                  return { data, mimeType };
                } catch (e) {
                  console.warn("Failed to fetch image URL for inline data:", e);
                  return null;
                }
              }
              if (imageInput.startsWith('data:')) {
                const [header, data] = imageInput.split(',');
                const mimeType = header.split(':')[1].split(';')[0];
                return { data, mimeType };
              }
              return null;
            };

            if (subjectImage) {
              const inline = await getInlineData(subjectImage);
              if (inline) {
                parts.push({ inlineData: inline });
                parts.push({ text: "Use this image as the subject reference." });
              }
            }
            if (sceneImage) {
              const inline = await getInlineData(sceneImage);
              if (inline) {
                parts.push({ inlineData: inline });
                parts.push({ text: "Use this image as the scene reference." });
              }
            }
            if (styleImage) {
              const inline = await getInlineData(styleImage);
              if (inline) {
                parts.push({ inlineData: inline });
                parts.push({ text: "Use this image as the style reference." });
              }
            }

            let response;
            const isImagen = geminiModel?.toLowerCase().includes('imagen') || geminiModel?.toLowerCase().includes('veo');
            
            if (isImagen) {
              // Imagen models use generateImages
              response = await ai.models.generateImages({
                model: geminiModel || 'imagen-3.0-generate-001',
                prompt: prompt,
                config: {
                  numberOfImages: 1,
                  aspectRatio: apiAspectRatio as any,
                }
              });
              
              const imagePart = response.generatedImages?.[0];
              if (imagePart && imagePart.image?.imageBytes) {
                const url = `data:image/png;base64,${imagePart.image.imageBytes}`;
                const generationTime = Date.now() - startTime;
                const newImage = { id: crypto.randomUUID(), url, prompt, aspectRatio, generationTime };
                
                const now = Date.now();
                const recentGenerations = get().recentGenerations.filter(t => now - t < 60000);
                set({ 
                  images: [newImage, ...images].slice(0, 100),
                  recentGenerations: [...recentGenerations, now]
                }); 
                
                if (!get().subjectImage) set({ subjectImage: url });
                return; // Exit early as we're done
              } else {
                throw new Error("Imagen failed to return an image. It might have been blocked by safety filters.");
              }
            } else {
              // Gemini models use generateContent for multimodal output
              try {
                response = await ai.models.generateContent({
                  model: geminiModel || 'gemini-2.0-flash', // Updated to a known good multimodal model
                  contents: { parts },
                  config: {
                    ...( (geminiModel?.includes('image') || !geminiModel) ? {
                      imageConfig: {
                        aspectRatio: apiAspectRatio as any
                      }
                    } : {} ),
                    responseModalities: ["IMAGE"],
                  }
                });
                
                const firstCandidate = response.candidates?.[0];
                const part = firstCandidate?.content?.parts?.find(p => p.inlineData);
                
                if (part && part.inlineData && part.inlineData.data) {
                  const mimeType = part.inlineData.mimeType || 'image/png';
                  const url = `data:${mimeType};base64,${part.inlineData.data}`;
                  const generationTime = Date.now() - startTime;
                  const newImage = { id: crypto.randomUUID(), url, prompt, aspectRatio, generationTime };
                  
                  // Track successful generation for quota
                  const now = Date.now();
                  const recentGenerations = get().recentGenerations.filter(t => now - t < 60000);
                  set({ 
                    images: [newImage, ...images].slice(0, 100),
                    recentGenerations: [...recentGenerations, now]
                  }); 
                  
                  if (!get().subjectImage) set({ subjectImage: url });
                  return; // Exit
                } else if (firstCandidate?.finishReason) {
                  let errorMessage = `Generation stopped. Reason: ${firstCandidate.finishReason}.`;
                  if (firstCandidate.finishReason === 'SAFETY') {
                    errorMessage = "The image was blocked by safety filters. Try modifying your prompt.";
                  } else if (firstCandidate.finishReason === 'PROHIBITED_CONTENT') {
                    errorMessage = "The content was flagged as prohibited.";
                  } else if (firstCandidate.finishReason === 'RECITATION' || firstCandidate.finishReason === 'NO_IMAGE') {
                    errorMessage = "The model failed to produce an image for this prompt. Try a different variation.";
                  }
                  throw new Error(errorMessage);
                }
              } catch (e: any) {
                if (e.message?.includes("only supports text output")) {
                  throw new Error("The selected Gemini model does not support image generation. Please select an 'Imagen' model instead.");
                }
                throw e;
              }
            }
            
            throw new Error("Failed to generate image: Unsupported model or unexpected response format.");
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
          let errorMessage = "Generation failed.";
          
          // Check for Gemini API specific errors
          const errorText = error.message || String(error);
          
          if (errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("quota") || errorText.includes("429")) {
            errorMessage = "Gemini API quota exceeded. The free tier has limits. Please wait a moment or provide your own API key in settings.";
          } else if (errorText.includes("SAFETY")) {
             errorMessage = "The image was blocked by safety filters. Try modifying your prompt.";
          } else if (errorText.includes("403") || errorText.includes("permission")) {
            errorMessage = "Permission denied. Please check your API key.";
          } else {
            try {
              // Try to parse as JSON if it looks like a JSON error from Google API
              const match = errorText.match(/\{.*\}/);
              if (match) {
                const parsed = JSON.parse(match[0]);
                if (parsed.error?.code === 429 || parsed.error?.status === "RESOURCE_EXHAUSTED") {
                  errorMessage = "Gemini API quota exceeded. Please wait or add your own API key.";
                } else if (parsed.error?.message) {
                  errorMessage = parsed.error.message;
                }
              }
            } catch (e) {
              if (error.message) {
                errorMessage = error.message;
              }
            }
          }
          toast.error(errorMessage);
        } finally {
          set({ isGenerating: false });
        }
      }
    }),
    {
      name: 'pictora-storage',
      storage: createJSONStorage(() => storage),
      version: 1,
      migrate: (persisted) => ({
        ...persisted as any,
        geminiApiKey: '',
      }),
      partialize: (state) => ({
        images: state.images,
        geminiApiKey: state.geminiApiKey,
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
      }),
    }
  )
);

