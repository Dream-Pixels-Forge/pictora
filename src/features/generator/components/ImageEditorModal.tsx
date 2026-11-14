import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Sliders, Brush, Eraser, RotateCcw, Download, Check, RefreshCw, Layers, Eye, Info } from "lucide-react";
import { useGeneratorStore, agnesFetch, parseAgnesError } from "../store/useGeneratorStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageEditorModalProps {
  image: { id: string; url: string; prompt: string; aspectRatio: any; upscaledUrl?: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "ai" | "filters";

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ image, isOpen, onClose }) => {
  const { updateImage, provider, comfyUiUrl } = useGeneratorStore();
  
  const [activeTab, setActiveTab] = useState<TabType>("ai");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  
  // Real-time Adjustment Filter values
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [exposure, setExposure] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);
  const [vignette, setVignette] = useState(0);

  // Mask Painting states
  const [editorMode, setEditorMode] = useState<"viewport" | "paint" | "erase">("viewport");
  const [brushSize, setBrushSize] = useState(25);
  
  const paintCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const isPaintingRef = useRef(false);

  // Zoom & Pan state for viewport navigation
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const mouseStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  // Selected edited result buffer
  const [editedResultUrl, setEditedResultUrl] = useState<string | null>(null);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (image) {
      setEditedResultUrl(image.upscaledUrl || image.url);
      setEditPrompt("");
      resetFilters();
      clearMask();
      setScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [image]);

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setExposure(100);
    setHueRotate(0);
    setVignette(0);
  };

  const clearMask = () => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Adjust mask canvas resolution to match client bounding box
  const syncCanvasSize = () => {
    const canvas = paintCanvasRef.current;
    const container = imageContainerRef.current;
    if (!canvas || !container) return;

    const imgEl = container.querySelector("img");
    if (!imgEl) return;

    if (imgEl.clientWidth === 0 || imgEl.clientHeight === 0) {
      imgEl.onload = () => {
        syncCanvasSize();
      };
      return;
    }

    // Preserve existing mask pixels before resizing
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = imgEl.clientWidth;
    canvas.height = imgEl.clientHeight;

    // Center and match the paint canvas visual boundary exactly with the image's bounding box
    canvas.style.width = `${imgEl.clientWidth}px`;
    canvas.style.height = `${imgEl.clientHeight}px`;
    canvas.style.position = "absolute";
    canvas.style.left = `${imgEl.offsetLeft}px`;
    canvas.style.top = `${imgEl.offsetTop}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      // Restore drawings if dimensions match
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    if (isOpen && image) {
      setTimeout(syncCanvasSize, 100);
      window.addEventListener("resize", syncCanvasSize);
    }
    return () => {
      window.removeEventListener("resize", syncCanvasSize);
    };
  }, [isOpen, image]);

  if (!isOpen || !image) return null;

  // Painting drawing mechanics
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (editorMode === "viewport") return;
    isPaintingRef.current = true;
    
    const coords = getEventCoords(e);
    if (coords) {
      drawDotOrLine(coords.x, coords.y, null);
      setLastPoint(coords);
    }
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current || editorMode === "viewport") return;
    
    const coords = getEventCoords(e);
    if (coords && lastPoint) {
      drawDotOrLine(coords.x, coords.y, lastPoint);
      setLastPoint(coords);
    }
  };

  const handleEndDraw = () => {
    isPaintingRef.current = false;
    setLastPoint(null);
  };

  const getEventCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      // Prevent scrolling while drawing on mobile screens
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    if (rect.width === 0 || rect.height === 0) return null;

    // Transform coordinate translation accounting for zoom scale & panning offsets!
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    return {
      x: relX * canvas.width,
      y: relY * canvas.height,
    };
  };

  const drawDotOrLine = (x: number, y: number, lastP: { x: number; y: number } | null) => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (editorMode === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(255, 0, 0, 0.65)"; // Semi-translucent red mask highlighting
    }

    if (lastP) {
      ctx.moveTo(lastP.x, lastP.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = editorMode === "erase" ? "rgba(0,0,0,1)" : "rgba(255, 0, 0, 0.65)";
      ctx.fill();
    }
  };

  // Viewport navigation handlers (Pan View)
  const handleViewportMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editorMode !== "viewport") return;
    setIsPanning(true);
    mouseStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...panOffset };
  };

  const handleViewportMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || editorMode !== "viewport") return;
    const dx = e.clientX - mouseStartRef.current.x;
    const dy = e.clientY - mouseStartRef.current.y;
    setPanOffset({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleViewportMouseUp = () => {
    setIsPanning(false);
  };

  const handleViewportTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (editorMode !== "viewport" || e.touches.length === 0) return;
    setIsPanning(true);
    mouseStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...panOffset };
  };

  const handleViewportTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPanning || editorMode !== "viewport" || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - mouseStartRef.current.x;
    const dy = e.touches[0].clientY - mouseStartRef.current.y;
    setPanOffset({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleViewportTouchEnd = () => {
    setIsPanning(false);
  };

  const handleViewportWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const zoomIntensity = 0.08;
    const zoomDir = e.deltaY < 0 ? 1 : -1;
    let nextScale = scale + zoomDir * zoomIntensity;
    nextScale = Math.min(Math.max(0.5, nextScale), 8); // Clamped standard scale limits
    setScale(nextScale);
  };

  // Run Agnes AI generative request with Prompt guidance
  const handleExecuteAiEdit = async () => {
    if (!editPrompt.trim()) {
      toast.error("Please provide an edit prompt instruction.");
      return;
    }

    setIsProcessing(true);
    toast.info("Sending granular image edit to Agnes...");

    try {
      // Setup API and connection
      const { agnesApiKey, agnesApiUrl, agnesImageModel } = useGeneratorStore.getState();
      const activeKey = agnesApiKey || process.env.AGNES_API_KEY || "";
      if (!activeKey) {
        throw new Error("Agnes API Key is missing. Please configure it in the Generator settings tab.");
      }

      // Determine if a mask was painted
      const canvas = paintCanvasRef.current;
      let hasMask = false;
      let maskDataUrl = "";
      
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 10) {
              hasMask = true;
              break;
            }
          }
        }
        if (hasMask) {
          maskDataUrl = canvas.toDataURL("image/png");
        }
      }

      // Convert active base image to base64 data URI
      const responseImg = await fetch(image.upscaledUrl || image.url);
      const blob = await responseImg.blob();
      const base64Url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const imgDataUri = base64Url;

      // Build image refs array (base image + optional mask)
      const imageRefs: string[] = [imgDataUri];
      if (hasMask && maskDataUrl) {
        imageRefs.push(maskDataUrl);
      }

      let lastEditError: any = null;
      const maxEditAttempts = 3;

      for (let attempt = 0; attempt < maxEditAttempts; attempt++) {
        try {
          const adjustedEditPrompt = attempt === 0
            ? editPrompt
            : (attempt === 1
                ? `${editPrompt}, creative variation, masterpiece level`
                : `${editPrompt}, detailed composition adjust, high resolution blend`);

          const data = await agnesFetch(
            "/images/generations",
            {
              model: agnesImageModel || "agnes-image-2.5-flash",
              prompt: `You are a high-level creative AI image modifier. The user wants to edit this image structure. Base prompt description: "${image.prompt}". Precise requested edit instruction: "${adjustedEditPrompt}". ${hasMask ? "A specific regional mask was highlighted indicating where changes should manifest. Keep the rest of the image completely unchanged." : ""} Return a beautifully edited new image that satisfies this change with elite realism, maintaining high artistic style and structure consistency with the original.`,
              n: 1,
              size: "2K",
              extra_body: {
                response_format: "b64_json",
                image: imageRefs,
              },
            },
            activeKey
          );

          const b64 = data.data?.[0]?.b64_json || data.data?.[0]?.url;
          if (!b64) {
            throw new Error("No image data returned from Agnes.");
          }
          
          const returnedBase64 = b64.startsWith('http') ? b64 : `data:image/png;base64,${b64}`;

          // Composite local blending if region mask matches
          if (hasMask && canvas) {
            const originalImg = new Image();
            originalImg.crossOrigin = "anonymous";
            originalImg.src = image.upscaledUrl || image.url;
            await new Promise(r => originalImg.onload = r);

            const replacementImg = new Image();
            replacementImg.src = returnedBase64;
            await new Promise(r => replacementImg.onload = r);

            const compositeCanvas = document.createElement("canvas");
            compositeCanvas.width = originalImg.naturalWidth;
            compositeCanvas.height = originalImg.naturalHeight;
            
            const compositeCtx = compositeCanvas.getContext("2d");
            if (compositeCtx) {
              compositeCtx.drawImage(originalImg, 0, 0);

              const hdMaskCanvas = document.createElement("canvas");
              hdMaskCanvas.width = originalImg.naturalWidth;
              hdMaskCanvas.height = originalImg.naturalHeight;
              const hdMaskCtx = hdMaskCanvas.getContext("2d");
              if (hdMaskCtx) {
                hdMaskCtx.drawImage(canvas, 0, 0, hdMaskCanvas.width, hdMaskCanvas.height);
              }

              compositeCtx.save();
              const maskImgData = hdMaskCtx?.getImageData(0, 0, hdMaskCanvas.width, hdMaskCanvas.height);
              if (maskImgData) {
                compositeCtx.globalCompositeOperation = "source-over";
                const offscreenCanvas = document.createElement("canvas");
                offscreenCanvas.width = originalImg.naturalWidth;
                offscreenCanvas.height = originalImg.naturalHeight;
                const offscreenCtx = offscreenCanvas.getContext("2d");
                if (offscreenCtx) {
                  offscreenCtx.drawImage(replacementImg, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
                  const repImgData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                  for (let i = 3; i < repImgData.data.length; i += 4) {
                    const maskAlpha = maskImgData.data[i];
                    repImgData.data[i] = Math.round((repImgData.data[i] * maskAlpha) / 255);
                  }
                  offscreenCtx.putImageData(repImgData, 0, 0);
                  compositeCtx.drawImage(offscreenCanvas, 0, 0);
                }
              }
              compositeCtx.restore();
              
              const finishedComp = compositeCanvas.toDataURL("image/png");
              setEditedResultUrl(finishedComp);
            }
          } else {
            setEditedResultUrl(returnedBase64);
          }

          toast.success("AI Edit completed successfully!");
          return;
        } catch (e: any) {
          console.warn(`Edit attempt ${attempt + 1} failed:`, e);
          lastEditError = e;
          if (e.message?.includes("Quota exceeded") || e.message?.includes("RESOURCE_EXHAUSTED") || e.status === 429) {
            throw e;
          }
        }
      }

      if (lastEditError?.message?.includes("recitation") || lastEditError?.message?.includes("RECITATION") || lastEditError?.message?.includes("NO_IMAGE")) {
        throw new Error("Strict recitation filters blocked this image edit task. Please try a slightly different variation of your edit prompt.");
      }
      throw lastEditError || new Error("No image data returned from Agnes. Tone down safety parameters or re-word edit prompt.");
    } catch (e: any) {
      console.error(e);
      const parsedMessage = parseAgnesError(e);
      toast.error(parsedMessage || "Failed to make AI edit.", { duration: 8000 });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bake live CSS adjustments directly into the pixel buffer
  const handleSaveActiveFilters = async () => {
    setIsProcessing(true);
    toast.info("Baking custom filter adjustments...");

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = editedResultUrl || image.url;
      await new Promise(r => img.onload = r);

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context initialize failed.");

      // Configure native 2D filter context values matching responsive state!
      const filterString = `
        brightness(${brightness}%) 
        contrast(${contrast}%) 
        saturate(${saturation}%) 
        blur(${blur}px) 
        exposure(${exposure}%) 
        hue-rotate(${hueRotate}deg)
      `.replace(/\s+/g, " ").trim();

      ctx.filter = filterString;
      ctx.drawImage(img, 0, 0);

      // Manual Vignette layer rendering over canvas coordinates
      if (vignette > 0) {
        const radius = Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2));
        const grad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, radius * 0.4,
          canvas.width / 2, canvas.height / 2, radius
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, `rgba(0,0,0,${vignette / 100})`);
        
        ctx.filter = "none";
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const backedBase64 = canvas.toDataURL("image/png");
      setEditedResultUrl(backedBase64);
      resetFilters();
      
      toast.success("Adjustments baked successfully!");
    } catch (e: any) {
      console.error(e);
      toast.error("Adjustments baking failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateOriginalGallery = () => {
    if (!editedResultUrl) return;
    updateImage(image.id, { url: editedResultUrl, upscaledUrl: undefined });
    toast.success("Main image in history has been successfully updated!");
    onClose();
  };

  const handleDownloadActive = () => {
    if (!editedResultUrl) return;
    const link = document.createElement("a");
    link.href = editedResultUrl;
    link.download = `edited-pictora-${image.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloading...");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-6xl bg-[#111] border border-white/5 rounded-3xl flex flex-col md:grid md:grid-cols-12 h-[92vh] md:h-[85vh] lg:h-[90vh] max-h-[95vh] overflow-y-auto md:overflow-hidden shadow-2xl"
      >
        {/* Navigation & Tab Selection (Fixed Left Sidebar or Top Layout) */}
        <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-white/5 flex flex-col min-h-0 bg-[#131313] md:overflow-y-auto order-2 md:order-1">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 rounded bg-pictora-yellow/10 text-pictora-yellow text-[10px] font-bold tracking-widest uppercase">PRO EDITOR</span>
              <h2 className="font-display font-semibold text-sm text-white">Granular Suite</h2>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 text-white/50 hover:text-white rounded-lg border border-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Tabs Selector */}
          <div className="p-3 sm:p-4 grid grid-cols-2 gap-2 border-b border-white/5">
            <button
              onClick={() => setActiveTab("ai")}
              className={cn(
                "py-2.5 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-w-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                activeTab === "ai" 
                  ? "bg-gradient-to-r from-amber-500 to-pictora-yellow text-black shadow-lg shadow-amber-500/10" 
                  : "bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate font-display">AI Inpainting</span>
            </button>
            <button
              onClick={() => setActiveTab("filters")}
              className={cn(
                "py-2.5 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-w-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                activeTab === "filters" 
                  ? "bg-gradient-to-r from-amber-500 to-pictora-yellow text-black shadow-lg shadow-amber-500/10" 
                  : "bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate font-display">Adjustments</span>
            </button>
          </div>

          <div className="p-5 flex-1 space-y-6 min-h-0 overflow-y-auto">
            {activeTab === "ai" ? (
              <>
                {/* AI Inpainting controls */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#FFF]/50 flex items-center gap-1">
                      <Brush className="w-3.5 h-3.5 text-pictora-yellow" />
                      Mask Drawing Mode
                    </label>
                    <span className="text-[9px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full font-mono">Zones to limit changes</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditorMode("viewport")}
                      className={cn(
                        "py-3 px-1 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 min-w-0 text-center cursor-pointer hover:scale-[1.03] active:scale-95",
                        editorMode === "viewport" 
                          ? "bg-white/10 border-white/20 text-white shadow-md shadow-white/5" 
                          : "bg-white/[0.01] border-white/5 text-white/40 hover:text-white hover:bg-white/[0.03]"
                      )}
                    >
                      <Eye className="w-4 h-4 shrink-0 text-sky-400" />
                      <span className="truncate w-full block">Pan View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode("paint")}
                      className={cn(
                        "py-3 px-1 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 min-w-0 text-center cursor-pointer hover:scale-[1.03] active:scale-95",
                        editorMode === "paint" 
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/5" 
                          : "bg-white/[0.01] border-white/5 text-white/40 hover:text-white hover:bg-white/[0.03]"
                      )}
                    >
                      <Brush className="w-4 h-4 shrink-0 text-amber-500" />
                      <span className="truncate w-full block">Paint Mask</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode("erase")}
                      className={cn(
                        "py-3 px-1 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 min-w-0 text-center cursor-pointer hover:scale-[1.03] active:scale-95",
                        editorMode === "erase" 
                          ? "bg-red-500/15 border-red-500/40 text-red-400 shadow-lg shadow-red-500/5" 
                          : "bg-white/[0.01] border-white/5 text-white/40 hover:text-white hover:bg-white/[0.03]"
                      )}
                    >
                      <Eraser className="w-4 h-4 shrink-0 text-red-500" />
                      <span className="truncate w-full block">Erase Mask</span>
                    </button>
                  </div>
                </div>

                {editorMode !== "viewport" && (
                  <div className="space-y-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-white/50">Brush Diameter:</span>
                      <span className="text-pictora-yellow font-bold bg-[#1e1a09] px-2 py-0.5 rounded border border-pictora-yellow/20">{brushSize}px</span>
                    </div>
                    
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-full accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                    />

                    {/* Quick brush size helpers */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[10, 25, 50].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setBrushSize(size)}
                          className={cn(
                            "py-1.5 rounded-lg bg-[#181818] hover:bg-[#222] border border-white/5 text-[9px] font-mono transition-all cursor-pointer hover:scale-[1.03] active:scale-95",
                            brushSize === size ? "text-pictora-yellow border-pictora-yellow/30 font-bold bg-[#262002]" : "text-white/40"
                          )}
                        >
                          {size === 10 ? "Fine (10px)" : size === 25 ? "Medium (25px)" : "Broad (50px)"}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={clearMask}
                      className="w-full py-2.5 px-3 bg-[#241315] hover:bg-[#341418] text-red-400 hover:text-red-350 rounded-xl text-[10px] font-bold text-center border border-red-900/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Brush Mask Layers
                    </button>
                  </div>
                )}

                {/* AI Edit prompt container */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Focal Edit Prompt</label>
                    <span className="text-[9px] text-white/30 flex items-center gap-0.5">
                      <Info className="w-3 h-3" />
                      Be descriptive
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe exactly what to replace, modify or add... (e.g., 'Make the hair platinum blue', 'Put a majestic castle in the background')"
                    className="w-full p-3.5 bg-[#161616] border border-white/5 rounded-2xl text-xs font-normal focus:outline-none focus:ring-2 focus:ring-pictora-yellow/30 text-white placeholder-white/30 resize-none transition-all shadow-inner"
                  />

                  {/* Inspiration tags */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-white/35 block uppercase tracking-wider">💡 Prompt Inspirations (click to use)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "🌲 Magic Forest", prompt: "Convert background to a sparkling enchanting dense magical forest with glowing sun rays" },
                        { label: "🕶️ Neon Glasses", prompt: "Add high-tech glowing futuristic cyberpunk neon spectacles on user" },
                        { label: "🧥 Golden Armor", prompt: "Replace garments with custom sleek golden futuristic power-plated warrior armor" },
                        { label: "🎨 Oil Masterpiece", prompt: "Re-synthesize the image details into an expressive textured Vincent van Gogh oil painting" },
                        { label: "⚡ Volumetric Lights", prompt: "Synthesize majestic atmospheric warm volumetric dust particles and dramatic key lights" }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditPrompt(item.prompt)}
                          className="py-1.5 px-2.5 rounded-lg bg-[#1a1a1a] hover:bg-pictora-yellow/10 border border-white/5 text-[9px] text-white/60 hover:text-pictora-yellow transition-all max-w-[130px] truncate cursor-pointer hover:scale-[1.03] active:scale-95 hover:border-pictora-yellow/20"
                          title={item.prompt}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[9px] p-2 bg-[#1c1809] border border-pictora-yellow/10 rounded-xl text-amber-500/80 leading-normal">
                    ⚠️ <b>Pro-Tip:</b> If you painted a mask, the AI edits only that region, leaving other parts pristine. Unmasked changes edit the whole picture!
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleExecuteAiEdit}
                    disabled={isProcessing || !editPrompt.trim()}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-pictora-yellow hover:scale-[1.02] active:scale-[0.98] text-black disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-pictora-yellow/5 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span className="font-mono tracking-wider">AI BLENDING CANVAS...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black animate-pulse" />
                        <span>Run Prompt AI Edit</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Custom look presets to change sliders */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#FFF]/50 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-pictora-yellow" />
                      One-Tap Look Presets
                    </label>
                    <button 
                      onClick={resetFilters} 
                      className="text-[9px] text-pictora-yellow hover:text-yellow-400 hover:underline transition-all font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear
                    </button>
                  </div>

                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                    {[
                      { name: "🎬 Cinematic", b: 92, c: 115, s: 80, e: 95, h: 0, bl: 0, v: 22 },
                      { name: "🖤 Noir Classic", b: 90, c: 130, s: 0, e: 92, h: 0, bl: 0, v: 40 },
                      { name: "✨ Golden Hour", b: 104, c: 105, s: 125, e: 106, h: 12, bl: 0, v: 15 },
                      { name: "👾 Neon Cyber", b: 98, c: 112, s: 150, e: 100, h: 320, bl: 0, v: 25 },
                      { name: "🕯️ Dreamy Glow", b: 110, c: 90, s: 105, e: 108, h: 0, bl: 2, v: 10 },
                      { name: "🌿 Earth Warmth", b: 96, c: 108, s: 95, e: 100, h: 25, bl: 0, v: 18 }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setBrightness(preset.b);
                          setContrast(preset.c);
                          setSaturation(preset.s);
                          setExposure(preset.e);
                          setHueRotate(preset.h);
                          setBlur(preset.bl);
                          setVignette(preset.v);
                          toast.success(`${preset.name} look preset selected!`);
                        }}
                        className="py-2.5 px-2 bg-[#181818] hover:bg-[#222] border border-white/5 hover:border-pictora-yellow/30 rounded-xl text-[10px] font-bold text-white/80 hover:text-white text-center transition-all truncate cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Granular Sliders parameters */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Finetune Settings</span>
                    <span className="text-[8px] text-white/30 italic">Step buttons allow precise touch values</span>
                  </div>

                  {/* Brightness Card */}
                  <div className="bg-[#181818]/60 border border-white/5 p-3.5 rounded-2xl space-y-2 transition-all hover:bg-[#1a1a1a]">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/60 font-semibold">Brightness</span>
                      <span className="text-pictora-yellow font-bold font-mono bg-[#1E1a09] px-1.5 py-0.5 rounded text-[10px] border border-pictora-yellow/10">{brightness}%</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setBrightness(prev => Math.max(50, prev - 5))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="flex-1 accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => setBrightness(prev => Math.min(150, prev + 5))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Contrast Card */}
                  <div className="bg-[#181818]/60 border border-white/5 p-3.5 rounded-2xl space-y-2 transition-all hover:bg-[#1a1a1a]">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/60 font-semibold">Contrast</span>
                      <span className="text-pictora-yellow font-bold font-mono bg-[#1E1a09] px-1.5 py-0.5 rounded text-[10px] border border-pictora-yellow/10">{contrast}%</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setContrast(prev => Math.max(50, prev - 5))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value))}
                        className="flex-1 accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => setContrast(prev => Math.min(150, prev + 5))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Saturation Card */}
                  <div className="bg-[#181818]/60 border border-white/5 p-3.5 rounded-2xl space-y-2 transition-all hover:bg-[#1a1a1a]">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/60 font-semibold">Color Saturation</span>
                      <span className="text-pictora-yellow font-bold font-mono bg-[#1E1a09] px-1.5 py-0.5 rounded text-[10px] border border-pictora-yellow/10">{saturation}%</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setSaturation(prev => Math.max(0, prev - 10))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={saturation}
                        onChange={(e) => setSaturation(parseInt(e.target.value))}
                        className="flex-1 accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => setSaturation(prev => Math.min(200, prev + 10))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Exposure Card */}
                  <div className="bg-[#181818]/60 border border-white/5 p-3.5 rounded-2xl space-y-2 transition-all hover:bg-[#1a1a1a]">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/60 font-semibold">Local Exposure</span>
                      <span className="text-pictora-yellow font-bold font-mono bg-[#1E1a09] px-1.5 py-0.5 rounded text-[10px] border border-pictora-yellow/10">{exposure}%</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setExposure(prev => Math.max(50, prev - 5))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={exposure}
                        onChange={(e) => setExposure(parseInt(e.target.value))}
                        className="flex-1 accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => setExposure(prev => Math.min(150, prev + 5))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Hue Rotation Card */}
                  <div className="bg-[#181818]/60 border border-white/5 p-3.5 rounded-2xl space-y-2 transition-all hover:bg-[#1a1a1a]">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/60 font-semibold">Hue Color Rotation</span>
                      <span className="text-pictora-yellow font-bold font-mono bg-[#1E1a09] px-1.5 py-0.5 rounded text-[10px] border border-pictora-yellow/10">{hueRotate}°</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setHueRotate(prev => Math.max(0, (prev - 15) % 360))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={hueRotate}
                        onChange={(e) => setHueRotate(parseInt(e.target.value))}
                        className="flex-1 accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => setHueRotate(prev => (prev + 15) % 360)}
                        className="w-8 h-8 rounded-lg bg-[#fff]/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Gaussian Blur Card */}
                  <div className="bg-[#181818]/60 border border-white/5 p-3.5 rounded-2xl space-y-2 transition-all hover:bg-[#1a1a1a]">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/60 font-semibold">Soft Focus (Blur)</span>
                      <span className="text-pictora-yellow font-bold font-mono bg-[#1E1a09] px-1.5 py-0.5 rounded text-[10px] border border-pictora-yellow/10">{blur}px</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setBlur(prev => Math.max(0, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={blur}
                        onChange={(e) => setBlur(parseInt(e.target.value))}
                        className="flex-1 accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => setBlur(prev => Math.min(10, prev + 1))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Vignette Depth Card */}
                  <div className="bg-[#181818]/60 border border-white/5 p-3.5 rounded-2xl space-y-2 transition-all hover:bg-[#1a1a1a]">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/60 font-semibold">Vignette Depth</span>
                      <span className="text-pictora-yellow font-bold font-mono bg-[#1E1a09] px-1.5 py-0.5 rounded text-[10px] border border-pictora-yellow/10">{vignette}%</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setVignette(prev => Math.max(0, prev - 5))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={vignette}
                        onChange={(e) => setVignette(parseInt(e.target.value))}
                        className="flex-1 accent-pictora-yellow h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => setVignette(prev => Math.min(100, prev + 5))}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-all active:scale-90 border border-white/5 select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveActiveFilters}
                    disabled={isProcessing}
                    className="w-full py-4 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-white/5 transition-all text-center hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-pictora-yellow animate-pulse" />
                    <span>Bake Adjustments into Pixels</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Master actions bottom */}
          <div className="p-4 sm:p-5 border-t border-white/5 bg-white/[0.01] flex flex-col gap-2.5">
            <button
              onClick={handleUpdateOriginalGallery}
              disabled={isProcessing}
              className="w-full py-4 px-4 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-350 hover:to-teal-350 text-black rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all min-w-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 shrink-0 font-extrabold" />
              <span className="truncate">Apply and Update Gallery</span>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleDownloadActive}
                disabled={isProcessing}
                className="py-3 px-3 bg-[#1c1c1c] hover:bg-[#282828] text-white/80 hover:text-white rounded-2xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-all truncate hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Download Image</span>
              </button>
              <button
                onClick={onClose}
                className="py-3 px-3 bg-transparent hover:bg-white/5 text-white/50 hover:text-white rounded-2xl font-bold text-[10px] sm:text-xs border border-white/5 flex items-center justify-center transition-all hover:bg-white/[0.03] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>Discard Changes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Interactive Canva (8 cols) - Stacked above on mobile for natural intuitive viewport editing */}
        <div className="col-span-12 md:col-span-8 bg-[#0b0b0b] dot-grid p-4 sm:p-6 md:p-10 flex flex-col min-h-0 min-w-0 h-auto md:h-full justify-center relative order-1 md:order-2">
          
          {/* Top Resolution and prompt details */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 z-10 pointer-events-none select-none">
            <span className="font-mono text-[10px] text-white/40 max-w-sm cut-text">
              Active image source: {image.prompt.slice(0, 50)}...
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 px-2 py-0.5 rounded bg-white/5">
                Aspect ratio: {image.aspectRatio}
              </span>
            </div>
          </div>

          {/* Dynamic viewport */}
          <div 
            onMouseDown={handleViewportMouseDown}
            onMouseMove={handleViewportMouseMove}
            onMouseUp={handleViewportMouseUp}
            onMouseLeave={handleViewportMouseUp}
            onTouchStart={handleViewportTouchStart}
            onTouchMove={handleViewportTouchMove}
            onTouchEnd={handleViewportTouchEnd}
            onWheel={handleViewportWheel}
            className={cn(
              "flex-1 relative rounded-none overflow-hidden border border-white/5 bg-[#141414] dot-grid min-h-0 flex items-center justify-center",
              editorMode === "viewport" ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
            )}
          >
            
            {/* Spinning AI processing glow card overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pictora-yellow to-transparent p-0.5 animate-spin" />
                  <div className="absolute inset-1.5 bg-black rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-pictora-yellow animate-pulse" />
                  </div>
                </div>
                <p className="font-mono text-xs text-white/90 font-semibold uppercase tracking-widest leading-relaxed">
                  Re-synthesizing canvas arrays...
                </p>
                <p className="text-[10px] text-white/40 mt-1">Please wait while the server runs the convolution process.</p>
              </div>
            )}

            {/* Core container centering the drawing mechanics and base frame */}
            <div 
              ref={imageContainerRef}
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: isPanning ? "none" : "transform 0.15s ease-out"
              }}
              className="relative max-h-full max-w-full aspect-square flex items-center justify-center"
            >
              <img 
                src={editedResultUrl || image.url} 
                alt="Active Edit Frame" 
                onLoad={syncCanvasSize}
                style={{
                  filter: `
                    brightness(${brightness}%) 
                    contrast(${contrast}%) 
                    saturate(${saturation}%) 
                    blur(${blur}px) 
                    opacity(1)
                  `,
                  boxShadow: vignette > 0 ? `inset 0 0 ${vignette}px rgba(0,0,0,1)` : "none"
                }}
                className="max-h-[35vh] xs:max-h-[45vh] sm:max-h-[50vh] md:max-h-[55vh] object-contain rounded-none select-none pointer-events-none"
              />

              {/* Mask overlay canvas strictly aligned with image viewport client width */}
              <canvas
                ref={paintCanvasRef}
                onMouseDown={handleStartDraw}
                onMouseMove={handleDrawMove}
                onMouseUp={handleEndDraw}
                onMouseLeave={handleEndDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleDrawMove}
                onTouchEnd={handleEndDraw}
                className={cn(
                  "absolute z-20 rounded-none transition-all duration-100",
                  editorMode === "viewport" 
                    ? "pointer-events-none opacity-40" 
                    : editorMode === "erase" 
                      ? "pointer-events-auto cursor-cell opacity-100" 
                      : "pointer-events-auto cursor-crosshair opacity-100"
                )}
              />
            </div>

            {/* Floating Zoom & Pan Control Deck */}
            <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 bg-[#121212]/90 backdrop-blur-md border border-white/10 rounded-full p-1.5 shadow-2xl">
              <button
                type="button"
                onClick={() => setScale(prev => Math.max(0.5, prev - 0.25))}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer font-bold text-xs"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[10px] font-mono font-bold text-white/70 min-w-[40px] text-center select-none">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale(prev => Math.min(8, prev + 0.25))}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer font-bold text-xs"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => {
                  setScale(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer"
                title="Reset Zoom & Pan"
              >
                <RotateCcw className="w-3.5 h-3.5 text-pictora-yellow" />
              </button>
            </div>
          </div>

          {/* Info Footer for viewport */}
          <div className="mt-4 flex items-center gap-2 justify-center py-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] text-white/45 max-w-md mx-auto select-none pointer-events-none">
            {editorMode === "paint" ? (
              <span className="text-amber-400 font-medium">✏️ Mask Brush Active: Painting red highlight pixels represents direct modification areas.</span>
            ) : editorMode === "erase" ? (
              <span className="text-red-400 font-medium">🧽 Erase Brush Active: Drag over painted masks to eliminate regional selections.</span>
            ) : (
              <span>✨ Click "Draw Mask" to dynamically pinpoint changes or modify adjust-filters sliders horizontally.</span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
