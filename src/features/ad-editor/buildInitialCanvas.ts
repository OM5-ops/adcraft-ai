import { Canvas, FabricImage, FabricText, Gradient, Rect, type FabricObject } from "fabric";
import type { AdConcept, AdStyle } from "@/lib/adTypes";
import type { CanvasPreset } from "./types";

function textShadow(style: AdStyle): string | undefined {
  if (style.shadow === "soft") return "0 2px 8px rgba(0,0,0,0.35)";
  if (style.shadow === "hard") return "4px 4px 0 rgba(0,0,0,0.85)";
  if (style.shadow === "glow") return `0 0 24px ${style.accentColor}`;
  return undefined;
}

function alignToFabric(align: AdStyle["align"]): "left" | "center" | "right" {
  return align;
}

function setRole(obj: FabricObject, role: string, name: string) {
  obj.set({ adRole: role, name });
  (obj as FabricObject & { name?: string }).name = name;
}

export async function buildCanvasFromAd(
  canvas: Canvas,
  concept: AdConcept,
  style: AdStyle,
  imageUrls: string[],
  preset: CanvasPreset,
): Promise<void> {
  const W = preset.width;
  const H = preset.height;
  canvas.setDimensions({ width: W, height: H });
  canvas.clear();
  canvas.backgroundColor = style.bgType === "solid" ? style.bgColor : "#111827";

  const bg = new Rect({
    left: 0,
    top: 0,
    width: W,
    height: H,
    selectable: false,
    evented: false,
    hasControls: false,
  });
  setRole(bg, "background", "Background");
  if (style.bgType === "gradient") {
    bg.fill = new Gradient({
      type: "linear",
      coords: { x1: 0, y1: 0, x2: W, y2: H },
      colorStops: [
        { offset: 0, color: style.bgGradientFrom },
        { offset: 1, color: style.bgGradientTo },
      ],
    });
  } else {
    bg.fill = style.bgColor;
  }
  canvas.add(bg);

  let contentTop = style.padding;
  const contentW = W - style.padding * 2;

  if (imageUrls.length > 0) {
    const rows = imageUrls.length <= 2 ? 1 : 2;
    const cols = Math.min(imageUrls.length, rows === 1 ? imageUrls.length : 2);
    const areaH = Math.min(H * 0.42, 480);
    const gap = 12;
    const cellW = (contentW - gap * (cols - 1)) / cols;
    const cellH = (areaH - gap * (rows - 1)) / rows;

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const img = await FabricImage.fromURL(imageUrls[i], { crossOrigin: "anonymous" });
        const col = i % cols;
        const row = Math.floor(i / cols);
        const iw = img.width || 100;
        const ih = img.height || 100;
        const scale = Math.min(cellW / iw, cellH / ih) * 0.95;
        img.set({
          left: style.padding + col * (cellW + gap),
          top: contentTop + row * (cellH + gap),
          scaleX: scale,
          scaleY: scale,
          cornerStyle: "circle",
          borderColor: style.accentColor,
          lockUniScaling: false,
        });
        setRole(img, "product-image", `Product ${i + 1}`);
        canvas.add(img);
      } catch {
        /* skip failed image */
      }
    }
    contentTop += areaH + 28;
  }

  const baseText = {
    fontFamily: `${style.fontFamily}, system-ui, sans-serif`,
    fill: style.textColor,
    width: contentW,
    textAlign: alignToFabric(style.align),
    charSpacing: style.letterSpacing * 10,
    lineHeight: style.lineHeight,
    splitByGrapheme: true,
  };

  const headline = new FabricText(concept.headline, {
    ...baseText,
    left: style.padding,
    top: contentTop,
    fontSize: Math.min(style.headingSize, W * 0.08),
    fontWeight: style.bold ? "bold" : "normal",
    fontStyle: style.italic ? "italic" : "normal",
    underline: style.underline,
    shadow: textShadow(style),
  });
  setRole(headline, "headline", "Headline");
  canvas.add(headline);
  contentTop += (headline.height ?? 0) * (headline.scaleY ?? 1) + 14;

  if (style.showSubheadline && concept.subheadline) {
    const sub = new FabricText(concept.subheadline, {
      ...baseText,
      left: style.padding,
      top: contentTop,
      fontSize: Math.min(style.bodySize * 1.2, W * 0.04),
      fontWeight: "600",
      opacity: 0.92,
    });
    setRole(sub, "subheadline", "Subheadline");
    canvas.add(sub);
    contentTop += (sub.height ?? 0) * (sub.scaleY ?? 1) + 10;
  }

  if (style.showBody && concept.body) {
    const body = new FabricText(concept.body, {
      ...baseText,
      left: style.padding,
      top: contentTop,
      fontSize: style.bodySize,
      fontWeight: "normal",
      opacity: 0.88,
    });
    setRole(body, "body", "Body");
    canvas.add(body);
    contentTop += (body.height ?? 0) * (body.scaleY ?? 1) + 16;
  }

  if (style.showCta && concept.cta) {
    const ctaBg = new Rect({
      left: style.padding,
      top: contentTop,
      width: Math.min(contentW * 0.55, 320),
      height: 52,
      rx: 26,
      ry: 26,
      fill: style.accentColor,
    });
    setRole(ctaBg, "cta", "CTA Button");
    canvas.add(ctaBg);

    const ctaText = new FabricText(`${concept.cta} →`, {
      left: style.padding + 20,
      top: contentTop + 14,
      fontSize: 16,
      fontFamily: baseText.fontFamily,
      fill: style.bgType === "solid" ? style.bgColor : "#ffffff",
      fontWeight: "bold",
    });
    setRole(ctaText, "cta", "CTA Text");
    canvas.add(ctaText);
  }

  canvas.renderAll();
}
