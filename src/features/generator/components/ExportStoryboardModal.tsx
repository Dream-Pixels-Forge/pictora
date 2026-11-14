import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Download, FileText, Image as ImageIcon, Columns, FileCode, CheckCircle2, Loader2, Sparkles 
} from "lucide-react";
import { useGeneratorStore } from "../store/useGeneratorStore";
import { exportToPDF, exportToContactSheet, exportToImageDeck } from "../utils/exportUtils";
import { toast } from "sonner";

interface ExportStoryboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportHtmlFn: () => void; // Recycles existing HTML builder
}

type ExportType = "pdf" | "images" | "contact_sheet" | "html";

export const ExportStoryboardModal = ({
  isOpen,
  onClose,
  exportHtmlFn,
}: ExportStoryboardModalProps) => {
  const { storyboardScenes, storyboardStyle } = useGeneratorStore();
  const [activeFormat, setActiveFormat] = useState<ExportType>("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  if (!isOpen) return null;

  const renderedFramesCount = storyboardScenes.filter(s => s.imageUrl).length;
  const isPendingAnyRender = renderedFramesCount < storyboardScenes.length;

  const handleStartExport = async () => {
    if (storyboardScenes.length === 0) {
      toast.error("No storyboard scenes available to export.");
      return;
    }

    setIsExporting(true);
    setExportProgress(10);
    const toastId = toast.loading(`Preparing ${activeFormat.toUpperCase()} storyboard compilation...`);

    try {
      const emailValue = "Guest Director";
      const metadata = {
        email: emailValue,
        style: storyboardStyle === "drawing" ? "Drawing Concept Sketch" : "Realistic Film Camera Work"
      };

      if (activeFormat === "pdf") {
        setExportProgress(30);
        await new Promise((resolve) => setTimeout(resolve, 300));
        setExportProgress(60);
        await exportToPDF(storyboardScenes, metadata);
        setExportProgress(100);
        toast.success("Multipage PDF Presentation downloaded successfully!", { id: toastId });
      } else if (activeFormat === "contact_sheet") {
        setExportProgress(30);
        await new Promise((resolve) => setTimeout(resolve, 300));
        setExportProgress(70);
        await exportToContactSheet(storyboardScenes, metadata);
        setExportProgress(100);
        toast.success("Unified Cinema Strip PNG image downloaded!", { id: toastId });
      } else if (activeFormat === "images") {
        setExportProgress(20);
        await exportToImageDeck(storyboardScenes, metadata);
        setExportProgress(100);
        toast.success("All individual high-res storyboard slides triggered!", { id: toastId });
      } else if (activeFormat === "html") {
        setExportProgress(50);
        await new Promise((resolve) => setTimeout(resolve, 200));
        exportHtmlFn();
        setExportProgress(100);
        toast.dismiss(toastId);
      }
    } catch (err) {
      console.error(err);
      toast.error("Export compilation failed. Try rendering all scene previews first.", { id: toastId });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        
        {/* Backdrop clicking safe close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-[#131416] border border-white/10 rounded-2xl p-6 w-full max-w-xl shadow-2xl relative z-10 overflow-hidden font-sans"
        >
          {/* Accent decoration bars */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-pictora-yellow to-sky-400" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
            title="Close Exporter"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title Area */}
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-pictora-yellow fill-current animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-wide uppercase">
              Pro Storyboard Exporter
            </h3>
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Format your sequenced screenplay assets into professional, presentation-ready media assets. Perfect for film directors, concept artists, and script pitching.
          </p>

          {/* Render check indicators */}
          <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={isPendingAnyRender ? "w-4 h-4 text-amber-500/80" : "w-4 h-4 text-emerald-500"} />
              <span className="text-white/70 font-medium">
                Frame Preview Pipeline: <b className="text-white">{renderedFramesCount} of {storyboardScenes.length}</b> renders computed
              </span>
            </div>
            {isPendingAnyRender && (
              <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[8px] animate-pulse">
                Incomplete Previews Included
              </span>
            )}
          </div>

          {/* Choice Grid */}
          <div className="mt-5 space-y-2.5">
            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Select Export Format</label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* PDF SLIDE DECK */}
              <div
                onClick={() => !isExporting && setActiveFormat("pdf")}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex gap-3 items-start select-none ${
                  activeFormat === "pdf"
                    ? "bg-pictora-yellow/10 border-pictora-yellow text-[#FFD600]"
                    : "bg-black/25 border-white/5 text-white/50 hover:border-white/10 hover:bg-[#18191b]"
                }`}
              >
                <FileText className={`w-5 h-5 shrink-0 mt-0.5 ${activeFormat === "pdf" ? "text-pictora-yellow" : "text-white/30"}`} />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white">Modern PDF Slide Deck</p>
                  <p className="text-[9px] text-white/45 mt-0.5 leading-relaxed">16:9 widescreen presentation sheets. Best for pitch screens.</p>
                </div>
              </div>

              {/* IMAGE SLIDE DECK */}
              <div
                onClick={() => !isExporting && setActiveFormat("images")}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex gap-3 items-start select-none ${
                  activeFormat === "images"
                    ? "bg-pictora-yellow/10 border-pictora-yellow text-[#FFD600]"
                    : "bg-black/25 border-white/5 text-white/50 hover:border-white/10 hover:bg-[#18191b]"
                }`}
              >
                <ImageIcon className={`w-5 h-5 shrink-0 mt-0.5 ${activeFormat === "images" ? "text-pictora-yellow" : "text-white/30"}`} />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white">Individual PNG Slides</p>
                  <p className="text-[9px] text-white/45 mt-0.5 leading-relaxed">Sequence of separate high-res widescreen slide images.</p>
                </div>
              </div>

              {/* COMBINED CINEMATIC STRIP */}
              <div
                onClick={() => !isExporting && setActiveFormat("contact_sheet")}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex gap-3 items-start select-none ${
                  activeFormat === "contact_sheet"
                    ? "bg-pictora-yellow/10 border-pictora-yellow text-[#FFD600]"
                    : "bg-black/25 border-white/5 text-white/50 hover:border-white/10 hover:bg-[#18191b]"
                }`}
              >
                <Columns className={`w-5 h-5 shrink-0 mt-0.5 ${activeFormat === "contact_sheet" ? "text-pictora-yellow" : "text-white/30"}`} />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white">Master Cinema Strip</p>
                  <p className="text-[9px] text-white/45 mt-0.5 leading-relaxed">One vertical production layout grouping all active frames and notes.</p>
                </div>
              </div>

              {/* OFFLINE HTML SUITE */}
              <div
                onClick={() => !isExporting && setActiveFormat("html")}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex gap-3 items-start select-none ${
                  activeFormat === "html"
                    ? "bg-pictora-yellow/10 border-pictora-yellow text-[#FFD600]"
                    : "bg-black/25 border-white/5 text-white/50 hover:border-white/10 hover:bg-[#18191b]"
                }`}
              >
                <FileCode className={`w-5 h-5 shrink-0 mt-0.5 ${activeFormat === "html" ? "text-pictora-yellow" : "text-white/30"}`} />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white">Offline HTML Script</p>
                  <p className="text-[9px] text-white/45 mt-0.5 leading-relaxed">Interactive independent dashboard containing full screenplay web structures.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Export compilation loading progress bar */}
          {isExporting && (
            <div className="mt-5 space-y-1.5">
              <div className="flex justify-between items-center text-[9px] font-mono text-white/40">
                <span>COMPILING SOURCE CHASSIS...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-pictora-yellow rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${exportProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          )}

          {/* Footer controls */}
          <div className="flex gap-3 justify-end items-center mt-6 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-white"
              disabled={isExporting}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleStartExport}
              className="px-5 py-2.5 bg-pictora-yellow hover:bg-yellow-400 text-black rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Package</span>
                </>
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
