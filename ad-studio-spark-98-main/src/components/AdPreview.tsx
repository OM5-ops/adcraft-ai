import { forwardRef, type CSSProperties } from "react";
import type { AdConcept, AdStyle } from "@/lib/adTypes";
import { SmartImageLayout } from "./SmartImageLayout";

const shadows: Record<AdStyle["shadow"], string> = {
  none: "none",
  soft: "0 2px 8px rgba(0,0,0,0.25)",
  hard: "4px 4px 0 rgba(0,0,0,0.85)",
  glow: "0 0 24px currentColor",
};

export type AdPreviewProps = {
  concept: AdConcept;
  style: AdStyle;
  images?: string[];
  /** Fixed height mode (cards). Fluid grows with content (customize page). */
  mode?: "fixed" | "fluid";
  height?: number | string;
  compact?: boolean;
};

export const AdPreview = forwardRef<HTMLDivElement, AdPreviewProps>(function AdPreview(
  { concept, style, images = [], mode = "fixed", height = 520, compact = false },
  ref,
) {
  const background =
    style.bgType === "gradient"
      ? `linear-gradient(135deg, ${style.bgGradientFrom}, ${style.bgGradientTo})`
      : style.bgColor;

  const isFluid = mode === "fluid";
  const layoutMinHeight = isFluid ? 420 : undefined;

  const textBase: CSSProperties = {
    color: style.textColor,
    textAlign: style.align,
    fontWeight: style.bold ? 800 : 500,
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    textShadow: shadows[style.shadow],
    letterSpacing: `${style.letterSpacing}px`,
    lineHeight: style.lineHeight,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    maxWidth: "100%",
    hyphens: "auto",
  };

  const headingFont = `${style.fontFamily}, system-ui, sans-serif`;
  const headingSize = compact ? style.headingSize * 0.55 : style.headingSize;
  const responsiveHeading = isFluid
    ? `clamp(${Math.max(18, headingSize * 0.45)}px, 4.5vw, ${headingSize}px)`
    : `${headingSize}px`;

  const renderText = (
    <div
      className="ad-poster-text"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: isFluid ? 10 : 12,
        flex: isFluid ? "0 0 auto" : 1,
        minWidth: 0,
        width: "100%",
      }}
    >
      <div
        style={{
          ...textBase,
          fontFamily: headingFont,
          fontSize: responsiveHeading,
          lineHeight: style.lineHeight,
        }}
      >
        {concept.headline}
      </div>
      {style.showSubheadline && (
        <div
          style={{
            ...textBase,
            fontWeight: 600,
            opacity: 0.92,
            fontSize: compact
              ? style.bodySize * 1.05
              : isFluid
                ? `clamp(${style.bodySize * 0.75}px, 2.5vw, ${style.bodySize * 1.25}px)`
                : style.bodySize * 1.25,
          }}
        >
          {concept.subheadline}
        </div>
      )}
      {style.showBody && (
        <div
          style={{
            ...textBase,
            fontWeight: 400,
            opacity: 0.85,
            fontSize: compact
              ? style.bodySize * 0.85
              : isFluid
                ? `clamp(${style.bodySize * 0.7}px, 2vw, ${style.bodySize}px)`
                : style.bodySize,
          }}
        >
          {concept.body}
        </div>
      )}
      {style.showCta && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            justifyContent:
              style.align === "center"
                ? "center"
                : style.align === "right"
                  ? "flex-end"
                  : "flex-start",
          }}
        >
          <button
            type="button"
            style={{
              background: style.accentColor,
              color: style.bgType === "solid" ? style.bgColor : "#fff",
              fontFamily: headingFont,
              fontWeight: 700,
              padding: compact ? "8px 14px" : "12px 22px",
              borderRadius: 999,
              fontSize: compact ? 12 : 14,
              letterSpacing: 0.5,
              border: "none",
              cursor: "default",
              boxShadow: "0 8px 20px -8px rgba(0,0,0,0.35)",
              maxWidth: "100%",
              whiteSpace: "normal",
              textAlign: "center",
            }}
          >
            {concept.cta} →
          </button>
        </div>
      )}
    </div>
  );

  const showImages = images.length > 0;
  const fillHeight = isFluid ? "auto" : "100%";
  const sectionMin = isFluid ? layoutMinHeight : undefined;

  const inner = () => {
    if (style.layout === "overlay" && showImages) {
      return (
        <div
          style={{
            position: "relative",
            width: "100%",
            minHeight: sectionMin,
            height: fillHeight,
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <SmartImageLayout urls={images} accent={style.accentColor} radius={0} />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.55))",
            }}
          />
          <div
            style={{
              position: "relative",
              minHeight: sectionMin,
              padding: style.padding,
              display: "flex",
              alignItems: "center",
            }}
          >
            {renderText}
          </div>
        </div>
      );
    }
    if (style.layout === "split" && showImages) {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isFluid ? "repeat(auto-fit, minmax(240px, 1fr))" : "1fr 1fr",
            gap: style.padding / 2,
            padding: style.padding,
            minHeight: sectionMin,
            height: fillHeight,
          }}
        >
          {renderText}
          <div style={{ minWidth: 0, minHeight: isFluid ? 200 : undefined }}>
            <SmartImageLayout
              urls={images}
              accent={style.accentColor}
              radius={Math.max(8, style.radius - 8)}
            />
          </div>
        </div>
      );
    }
    if (style.layout === "banner") {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: style.padding / 2,
            padding: style.padding,
            minHeight: sectionMin,
            height: fillHeight,
          }}
        >
          {renderText}
          {showImages && (
            <div style={{ minWidth: 0, flexShrink: 0 }}>
              <SmartImageLayout
                urls={images}
                accent={style.accentColor}
                radius={Math.max(8, style.radius - 8)}
              />
            </div>
          )}
        </div>
      );
    }
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: style.padding / 2,
          padding: style.padding,
          minHeight: sectionMin,
          height: fillHeight,
        }}
      >
        {showImages && (
          <div style={{ minWidth: 0, flexShrink: 0 }}>
            <SmartImageLayout
              urls={images}
              accent={style.accentColor}
              radius={Math.max(8, style.radius - 8)}
            />
          </div>
        )}
        {renderText}
      </div>
    );
  };

  const rootHeight = isFluid ? "auto" : height;
  const rootMinHeight = isFluid ? (typeof height === "number" ? height : 480) : undefined;

  return (
    <div
      ref={ref}
      data-ad-poster="true"
      className="ad-poster-root"
      style={{
        background,
        borderRadius: style.radius,
        width: "100%",
        maxWidth: "100%",
        height: rootHeight,
        minHeight: rootMinHeight,
        overflow: "hidden",
        boxShadow: "0 30px 80px -30px rgba(0,0,0,0.4)",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {inner()}
    </div>
  );
});
