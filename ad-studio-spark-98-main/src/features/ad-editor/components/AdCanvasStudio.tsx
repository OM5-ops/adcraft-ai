import { useCallback, useState } from "react";
import {
  Copy,
  Layers,
  Loader2,
  Lock,
  Redo2,
  Trash2,
  Undo2,
  Unlock,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { AdConcept, AdStyle } from "@/lib/adTypes";
import { Button } from "@/components/ui/button";
import { useFabricEditor } from "../hooks/useFabricEditor";
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "@/components/PosterPreviewPanel";
import { EditorSidebar } from "./EditorSidebar";
import type { ExportFormat } from "../types";
import { toast } from "sonner";

type AdCanvasStudioProps = {
  concept: AdConcept;
  style: AdStyle;
  images: string[];
  uploading: boolean;
  onUploadFiles: (files: FileList | null) => void;
};

export function AdCanvasStudio({
  concept,
  style,
  images,
  uploading,
  onUploadFiles,
}: AdCanvasStudioProps) {
  const [canvasNode, setCanvasNode] = useState<HTMLCanvasElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const editor = useFabricEditor(canvasNode, concept, style, images);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setExporting(true);
      try {
        await editor.exportDesign(format);
        toast.success(`Exported as ${format.toUpperCase()}`);
      } catch (e) {
        console.error(e);
        toast.error("Export failed");
      } finally {
        setExporting(false);
      }
    },
    [editor],
  );

  const zoomOut = () => editor.setZoom(Math.max(ZOOM_MIN, editor.zoom - ZOOM_STEP));
  const zoomIn = () => editor.setZoom(Math.min(ZOOM_MAX, editor.zoom + ZOOM_STEP));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,320px)_1fr] gap-4 min-h-0 flex-1">
      <EditorSidebar
        editor={editor}
        style={style}
        images={images}
        uploading={uploading}
        onUploadFiles={onUploadFiles}
        onExport={handleExport}
        exporting={exporting}
      />

      <div className="flex flex-col min-h-0 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2 rounded-lg border bg-background/80">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={editor.undo}
            disabled={!editor.canUndo}
            aria-label="Undo"
          >
            <Undo2 className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={editor.redo}
            disabled={!editor.canRedo}
            aria-label="Redo"
          >
            <Redo2 className="size-4" />
          </Button>
          <div className="w-px h-6 bg-border" />
          <Button size="sm" variant="outline" onClick={editor.duplicateSelected}>
            <Copy className="size-3.5 mr-1" /> Duplicate
          </Button>
          <Button size="sm" variant="outline" onClick={editor.deleteSelected}>
            <Trash2 className="size-3.5 mr-1" /> Delete
          </Button>
          <Button size="sm" variant="outline" onClick={editor.bringForward}>
            <Layers className="size-3.5 mr-1" /> Forward
          </Button>
          <Button size="sm" variant="outline" onClick={editor.sendBackward}>
            <Layers className="size-3.5 mr-1 rotate-180" /> Back
          </Button>
          <Button size="sm" variant="outline" onClick={editor.groupSelected}>
            Group
          </Button>
          <Button size="sm" variant="outline" onClick={editor.toggleLockSelected}>
            {editor.selectedObject?.lockMovementX ? (
              <Unlock className="size-3.5" />
            ) : (
              <Lock className="size-3.5" />
            )}
          </Button>
          <div className="ml-auto flex items-center gap-1 rounded-lg border p-0.5">
            <Button size="icon" variant="ghost" className="size-8" onClick={zoomOut}>
              <ZoomOut className="size-4" />
            </Button>
            <span className="text-xs w-10 text-center tabular-nums">{editor.zoom}%</span>
            <Button size="icon" variant="ghost" className="size-8" onClick={zoomIn}>
              <ZoomIn className="size-4" />
            </Button>
          </div>
        </div>

        <div className="poster-preview-scroll flex-1 overflow-auto rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.1),transparent_55%)] p-4 sm:p-8 flex justify-center items-start min-h-[320px]">
          <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white/5 transition-transform duration-200">
            {!editor.ready && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-background/80">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <canvas ref={setCanvasNode} className="max-w-full h-auto block" />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          Drag elements to move · Handles to resize & rotate · Snap guides at center & edges
        </p>
      </div>
    </div>
  );
}
