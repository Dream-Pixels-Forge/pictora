// jspdf unavailable in this build; PDF export disabled.
import { StoryboardScene } from "../store/useGeneratorStore";

// Safe helper to load images with CORS support
export const loadImageSafely = (src: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Direct asset fallback
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => resolve(null);
      fallback.src = src;
    };
    img.src = src;
  });
};

// Simple clean word-wrapping utility for canvas text
export const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  const words = (text || "").trim().split(/\s+/);
  if (words.length === 0 || words[0] === "") return [];
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + " " + word;
    const width = ctx.measureText(testLine).width;
    if (width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
};

interface ExportMetadata {
  email?: string;
  style?: string;
}

// Draw a single slide canvas (Title page or individual scene slide)
export const renderSlideToCanvas = async (
  scene: StoryboardScene | null, // null means Title Page
  totalScenes: number,
  index: number, // 0 for title page, 1..N for scenes
  metadata: ExportMetadata = {}
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  // 1. Sleek Cinematic Background
  ctx.fillStyle = "#0c0d0f";
  ctx.fillRect(0, 0, 1280, 720);

  // Subtle aesthetic geometric accent shapes
  ctx.strokeStyle = "rgba(255, 214, 0, 0.05)";
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, 1240, 680);

  // A glowing corner light bar top left
  ctx.fillStyle = "#FFD600";
  ctx.fillRect(20, 20, 180, 4);
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(1100, 20, 160, 4);

  if (scene === null) {
    // --- TITLE SLIDE GENERATION ---
    ctx.textAlign = "center";
    
    // Tiny label info
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillText("PICTORA STORYBOARD PRESENTATION DECK", 640, 200);

    // Giant main title
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 52px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText("CINEMATIC SCREENPLAY", 640, 280);

    ctx.fillStyle = "#FFD600";
    ctx.font = "800 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText("DIRECTOR BOARD ARCHIVE", 640, 335);

    // Separator line
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(440, 390, 400, 2);

    // Presentation info
    ctx.textAlign = "left";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillText("AUTHOR CREDENTIALS:", 440, 450);
    ctx.fillText("CREATIVE STYLE:", 440, 480);
    ctx.fillText("ROUND TOTALS:", 440, 510);
    ctx.fillText("EXPORT DATE:", 440, 540);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(metadata.email || "Guest Creative Director", 600, 450);
    ctx.fillText((metadata.style || "Realistic Film Still").toUpperCase(), 600, 480);
    ctx.fillText(`${totalScenes} Active Sequenced Scenes`, 600, 510);
    ctx.fillText(new Date().toLocaleDateString(undefined, { dateStyle: "long" }), 600, 540);

    // Footer info
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.fillText("PROPRIETARY MATERIAL © PICTORA AI - DEVELOPER WORKSPACE", 640, 680);

  } else {
    // --- SCENE SLIDE GENERATION ---
    ctx.textAlign = "left";

    // Top subtle bar heading text
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.fillText("PICTORA SYSTEM MULTI-ROUND STORYBOARD PRESENTATION DECK", 50, 52);

    // Header dividing line
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(40, 70, 1200, 1);

    // ROUND / SCENE Badge
    // Drawing a neat round label badge
    ctx.fillStyle = "rgba(255, 214, 0, 0.12)";
    ctx.strokeStyle = "rgba(255, 214, 0, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(50, 100, 160, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFD600";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillText(`ROUND ${scene.sceneNumber} / SCENE ${scene.sceneNumber}`, 68, 117);

    // Scene Title Heading
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(scene.title || `Untitled Scene ${scene.sceneNumber}`, 235, 121);

    // LEFT PANEL - Visual Still Frame box (16:9 box: 640 x 360) Is computed nicely
    const frameX = 50;
    const frameY = 168;
    const frameW = 640;
    const frameH = 360;

    // Draw frame backing
    ctx.fillStyle = "#050607";
    ctx.fillRect(frameX, frameY, frameW, frameH);

    if (scene.imageUrl) {
      const img = await loadImageSafely(scene.imageUrl);
      if (img) {
        // Draw centered and cropped object-cover fit on canvas
        const imgRatio = img.width / img.height;
        const frameRatio = frameW / frameH;
        let drawW = frameW;
        let drawH = frameH;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > frameRatio) {
          drawW = frameH * imgRatio;
          offsetX = (frameW - drawW) / 2;
        } else {
          drawH = frameW / imgRatio;
          offsetY = (frameH - drawH) / 2;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(frameX, frameY, frameW, frameH);
        ctx.clip();
        ctx.drawImage(img, frameX + offsetX, frameY + offsetY, drawW, drawH);
        ctx.restore();
      } else {
        // Failed image source error drawer placeholder
        ctx.fillStyle = "rgba(239, 68, 68, 0.05)";
        ctx.fillRect(frameX, frameY, frameW, frameH);
        ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
        ctx.font = "bold 13px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("Failed to Secure Frame Render Asset", frameX + frameW / 2, frameY + frameH / 2);
      }
    } else {
      // Frame Pending render card representation
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(frameX, frameY, frameW, frameH);
      ctx.setLineDash([]);
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
      ctx.fillRect(frameX, frameY, frameW, frameH);
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.font = "bold 12px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("SCENE FRAME PENDING COMPUTATION RENDER", frameX + frameW / 2, frameY + frameH / 2 - 10);
      ctx.font = "9px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("The picture was not rendered in the live canvas yet.", frameX + frameW / 2, frameY + frameH / 2 + 15);
    }

    // Still Frame Specifications Metadata tag
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.fillText("VISUAL RATIO BOUNDS: Locked Widescreen (16:9)", 50, 555);
    ctx.fillText(`RENDERING MODE: ${(metadata.style || "Realistic Film").toUpperCase()}`, 50, 575);

    // RIGHT PANEL - Screenplay info texts column: x: 740, w: 490
    const colX = 735;
    const textW = 490;

    // Draw Section A: Prompt triggers
    ctx.fillStyle = "#FFD600";
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("CREATIVE PROMPT STIMULUS", colX, 185);

    // Line under sub-heading
    ctx.fillStyle = "rgba(255, 214, 0, 0.15)";
    ctx.fillRect(colX, 194, textW, 1);

    ctx.fillStyle = "#cad4e0";
    ctx.font = "italic 13px -apple-system, BlinkMacSystemFont, sans-serif";
    const promptLines = wrapText(ctx, scene.prompt || "No design prompt configured for this scene.", textW);
    let curY = 215;
    promptLines.slice(0, 5).forEach((line) => {
      ctx.fillText(line, colX, curY);
      curY += 19;
    });

    // Draw Section B: Voiceover narration actions
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("SCREENPLAY SPEECH NARRATION / ACTION DIRECTVES", colX, 350);

    // Line under sub-heading
    ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
    ctx.fillRect(colX, 359, textW, 1);

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
    const narrationLines = wrapText(ctx, scene.narration || "No voiceover dialogue written for this scene.", textW);
    curY = 382;
    narrationLines.slice(0, 10).forEach((line) => {
      ctx.fillText(line, colX, curY);
      curY += 21;
    });

    // Outer dividing lines / frames footer
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(40, 640, 1200, 1);

    // Page indicator footer
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.fillText(`SCENE MODULE ${index} OF ${totalScenes}`, 50, 665);
    ctx.textAlign = "right";
    ctx.fillText("GEN AI PICTORA STUDIO", 1230, 665);
  }

  return canvas;
};

// 1. PDF export (print-based, no external dependency)
export const exportToPDF = async (scenes: StoryboardScene[], metadata: ExportMetadata = {}): Promise<void> => {
  const win = window.open("", "_blank");
  if (!win) throw new Error("Popup blocked; allow popups to export PDF.");

  const titleCanvas = await renderSlideToCanvas(null, scenes.length, 0, metadata);
  const titleUrl = titleCanvas.toDataURL("image/jpeg", 0.9);

  const sceneUrls: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const c = await renderSlideToCanvas(scenes[i], scenes.length, i + 1, metadata);
    sceneUrls.push(c.toDataURL("image/jpeg", 0.9));
  }

  const imgs = [titleUrl, ...sceneUrls]
    .map((u) => `<img src="${u}" style="width:100%;page-break-after:always;display:block;" />`)
    .join("");

  win.document.write(`<!DOCTYPE html><html><head><title>Pictora Storyboard</title>
  <style>body{margin:0;background:#000;}@media print{img{page-break-after:always;}}</style></head><body>${imgs}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
};

// 2. HIGHER-RESOLUTION COMBINED STORYBOARD CONTACT SHEET FILM STRIP
export const exportToContactSheet = async (
  scenes: StoryboardScene[],
  metadata: ExportMetadata = {}
): Promise<void> => {
  if (scenes.length === 0) return;

  const headerHeight = 220;
  const itemHeight = 440;
  const padding = 40;
  const contentWidth = 1200;
  const totalW = contentWidth + padding * 2; // 1280
  const totalH = headerHeight + scenes.length * itemHeight + padding;

  const canvas = document.createElement("canvas");
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext("2d")!;

  // 1. Sleek Matte Black Backing
  ctx.fillStyle = "#070809";
  ctx.fillRect(0, 0, totalW, totalH);

  // Outer safety grid lines border
  ctx.strokeStyle = "rgba(255, 214, 0, 0.04)";
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, totalW - 40, totalH - 40);

  // --- DRAW HEADER ---
  // Large logo
  ctx.fillStyle = "#FFD600";
  ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("PICTORA STORYBOARD PORTFOLIO", padding, 70);

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.fillText("COMBINED MASTER SCRIPT & DIRECTORS PRODUCTION REEL", padding, 92);

  // Split information grid line
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(padding, 115, contentWidth, 1);

  // Meta grid columns
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 10px 'JetBrains Mono', monospace";
  ctx.fillText("PRODUCED BY:", padding, 150);
  ctx.fillText("CREATIVE STYLE:", padding + 350, 150);
  ctx.fillText("ROUND HIGHLIGHTS:", padding + 700, 150);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(metadata.email || "Guest Director", padding, 172);
  ctx.fillText((metadata.style || "Realistic Photographic").toUpperCase(), padding + 350, 172);
  ctx.fillText(`${scenes.length} Production Scene Frames`, padding + 700, 172);

  // Dividing line below header
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(padding, 200, contentWidth, 1);

  // --- DRAW SCENES SEQUENTIALLY ---
  let curY = headerHeight;

  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];

    // Background block for card
    ctx.fillStyle = "#0c0d10";
    ctx.fillRect(padding, curY + 20, contentWidth, itemHeight - 40);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeRect(padding, curY + 20, contentWidth, itemHeight - 40);

    // Left Border Gold Light Glow Accents
    ctx.fillStyle = "#FFD600";
    ctx.fillRect(padding, curY + 20, 4, itemHeight - 40);

    // A. Badge ROUND X / SCENE X
    ctx.fillStyle = "rgba(255, 214, 0, 0.1)";
    ctx.strokeStyle = "rgba(255, 214, 0, 0.25)";
    ctx.beginPath();
    ctx.roundRect(padding + 30, curY + 45, 120, 24, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFD600";
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.fillText(`SCENE ${s.sceneNumber}`, padding + 48, curY + 60);

    // Scene Title Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(s.title || `Scene round ${s.sceneNumber}`, padding + 165, curY + 63);

    // B. Visual Frame box bounds (w: 520 x 292 is exact 16:9 widescreen ratio)
    const mediaX = padding + 30;
    const mediaY = curY + 90;
    const mediaW = 520;
    const mediaH = 292;

    ctx.fillStyle = "#050607";
    ctx.fillRect(mediaX, mediaY, mediaW, mediaH);

    if (s.imageUrl) {
      const img = await loadImageSafely(s.imageUrl);
      if (img) {
        const imgRatio = img.width / img.height;
        const frameRatio = mediaW / mediaH;
        let drawW = mediaW;
        let drawH = mediaH;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > frameRatio) {
          drawW = mediaH * imgRatio;
          offsetX = (mediaW - drawW) / 2;
        } else {
          drawH = mediaW / imgRatio;
          offsetY = (mediaH - drawH) / 2;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(mediaX, mediaY, mediaW, mediaH);
        ctx.clip();
        ctx.drawImage(img, mediaX + offsetX, mediaY + offsetY, drawW, drawH);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(239, 68, 68, 0.04)";
        ctx.fillRect(mediaX, mediaY, mediaW, mediaH);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 12px 'JetBrains Mono', monospace";
        ctx.fillText("Failed to Secure Frame Render", mediaX + 130, mediaY + 150);
      }
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
      ctx.fillRect(mediaX, mediaY, mediaW, mediaH);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.strokeRect(mediaX, mediaY, mediaW, mediaH);

      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("IMAGE RENDERING PENDING", mediaX + mediaW / 2, mediaY + mediaH / 2);
      ctx.textAlign = "left";
    }

    // Right screenplay text blocks: colX: 600, w: 560
    const colX = padding + 580;
    const textW = 560;

    // Creative visual visual prompt descriptor trigger
    ctx.fillStyle = "#FFD600";
    ctx.font = "bold 10px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("ROUND PROMPT TRIGGER", colX, curY + 60);
    ctx.fillStyle = "rgba(255, 214, 0, 0.15)";
    ctx.fillRect(colX, curY + 68, textW, 1);

    ctx.fillStyle = "#cad4e0";
    ctx.font = "italic 13px -apple-system, BlinkMacSystemFont, sans-serif";
    const promptLines = wrapText(ctx, s.prompt || "No prompt written yet.", textW);
    let wrapY = curY + 90;
    promptLines.slice(0, 4).forEach((line) => {
      ctx.fillText(line, colX, wrapY);
      wrapY += 18;
    });

    // Creative screen speech dialogues narration text
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 10px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("SCREENPLAY DIALOGUE / STAGE NARRATIVE", colX, curY + 195);
    ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
    ctx.fillRect(colX, curY + 203, textW, 1);

    ctx.fillStyle = "#ffffff";
    ctx.font = "13px -apple-system, BlinkMacSystemFont, sans-serif";
    const narrationLines = wrapText(ctx, s.narration || "No sound voiceover scripted.", textW);
    wrapY = curY + 225;
    narrationLines.slice(0, 9).forEach((line) => {
      ctx.fillText(line, colX, wrapY);
      wrapY += 19;
    });

    // Advance cursor index vertical
    curY += itemHeight;
  }

  // Draw ultimate copyright notice bar
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillText(`PICTORA DIGITAL CINEMA SHEET ARCHIVE • GENERATED ON ${new Date().toLocaleDateString()} • CONFIDENTIAL RELEASE LIMITS`, padding, totalH - 22);

  // Trigger high resolution download URL pointer
  try {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `storyboard-contact-sheet-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error(e);
  }
};

// 3. EXPORT INDIVIDUAL HIGH RESOLUTION PRESENTATION SLIDES (IN SEQUENCE SLIDES)
export const exportToImageDeck = async (
  scenes: StoryboardScene[],
  metadata: ExportMetadata = {}
): Promise<void> => {
  if (scenes.length === 0) return;

  // Render + download Title Slide (Scene 0)
  const titleCanvas = await renderSlideToCanvas(null, scenes.length, 0, metadata);
  try {
    const titleDataUrl = titleCanvas.toDataURL("image/png");
    const titleLink = document.createElement("a");
    titleLink.href = titleDataUrl;
    titleLink.download = "slide-0-title-intro.png";
    document.body.appendChild(titleLink);
    titleLink.click();
    document.body.removeChild(titleLink);
  } catch (err) {
    console.error(err);
  }

  // Load and trigger consecutive slides with a slight delay to prevent concurrent download blocks in browser sandbox
  for (let i = 0; i < scenes.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 250)); // subtle interval delay pacing
    const sceneCanvas = await renderSlideToCanvas(scenes[i], scenes.length, i + 1, metadata);
    try {
      const dataUrl = sceneCanvas.toDataURL("image/png");
      const slLink = document.createElement("a");
      slLink.href = dataUrl;
      slLink.download = `slide-${i + 1}-scene-${scenes[i].sceneNumber || i + 1}.png`;
      document.body.appendChild(slLink);
      slLink.click();
      document.body.removeChild(slLink);
    } catch (e) {
      console.error(e);
    }
  }
};
