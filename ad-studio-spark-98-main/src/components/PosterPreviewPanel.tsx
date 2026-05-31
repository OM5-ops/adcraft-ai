import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { AdConcept, AdStyle } from "@/lib/adTypes";
import { AdPreview } from "@/components/AdPreview";
import { cn } from "@/lib/utils";

export const ZOOM_MIN = 50;
export const ZOOM_MAX = 150;
export const ZOOM_STEP = 10;

type PosterPreviewPanelProps = {
  concept: AdConcept;
  style: AdStyle;
  images: string[];
  zoom: number;
  /** Unscaled poster used for PNG export (no transform parent). */
  exportRef?: React.RefObject<HTMLDivElement | null>;
  posterRef?: React.RefObject<HTMLDivElement | null>;
};

export function PosterPreviewPanel({
  concept,
  style,
  images,
  zoom,
  exportRef: externalExportRef,
  posterRef: externalPosterRef,
}: PosterPreviewPanelProps) {
  const internalPosterRef = useRef<HTMLDivElement>(null);
  const internalExportRef = useRef<HTMLDivElement>(null);
  const posterRef = externalPosterRef ?? internalPosterRef;
  const exportRef = externalExportRef ?? internalExportRef;
  const scrollRef = useRef<HTMLDivElement>(null);
  const naturalSizerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [autoScale, setAutoScale] = useState(1);

  const measureNatural = useCallback(() => {
    const el = naturalSizerRef.current;
    if (!el) return;
    setNaturalSize({ w: el.offsetWidth, h: el.offsetHeight });
  }, []);

  const recomputeAutoScale = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll || naturalSize.w === 0) return;

    const padding = 32;
    const availableW = Math.max(scroll.clientWidth - padding, 1);
    const availableH = Math.max(scroll.clientHeight - padding, 1);
    const scaleW = availableW / naturalSize.w;
    const scaleH = availableH / naturalSize.h;
    const fit = Math.min(1, scaleW, scaleH);
    setAutoScale(Number.isFinite(fit) && fit > 0 ? fit : 1);
  }, [naturalSize]);

  useLayoutEffect(() => {
    measureNatural();
    const el = naturalSizerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measureNatural());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureNatural, concept, style, images]);

  useLayoutEffect(() => {
    recomputeAutoScale();
    const scroll = scrollRef.current;
    if (!scroll) return;
    const ro = new ResizeObserver(() => recomputeAutoScale());
    ro.observe(scroll);
    return () => ro.disconnect();
  }, [recomputeAutoScale, naturalSize, zoom]);

  const displayScale = autoScale * (zoom / 100);
  const scaledW = naturalSize.w * displayScale;
  const scaledH = naturalSize.h * displayScale;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Live preview</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          Zoom {Math.round(zoom)}% · Fit {Math.round(autoScale * 100)}%
        </span>
      </div>

      <div
        ref={scrollRef}
        className={cn(
          "poster-preview-scroll relative flex-1 min-h-[280px] max-h-[calc(100vh-11rem)] sm:max-h-[calc(100vh-10rem)]",
          "overflow-x-auto overflow-y-auto overscroll-contain rounded-2xl",
          "bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(236,72,153,0.12),transparent_60%)]",
          "p-4 sm:p-8",
        )}
      >
        {/* Hidden sizer — natural poster dimensions (no transform) */}
        <div
          ref={naturalSizerRef}
          className="pointer-events-none absolute left-0 top-0 w-full max-w-[min(100%,720px)] opacity-0"
          aria-hidden
        >
          <AdPreview
            ref={exportRef}
            concept={concept}
            style={style}
            images={images}
            mode="fluid"
            height={480}
          />
        </div>

        <div className="flex min-w-min justify-center">
          {naturalSize.w > 0 && (
            <div
              className="poster-preview-scale transition-[width,height] duration-300 ease-out"
              style={{ width: scaledW, height: scaledH, maxWidth: "none" }}
            >
              <div
                style={{
                  transform: `scale(${displayScale})`,
                  transformOrigin: "top left",
                  width: naturalSize.w,
                }}
              >
                <AdPreview
                  ref={posterRef}
                  concept={concept}
                  style={style}
                  images={images}
                  mode="fluid"
                  height={480}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
