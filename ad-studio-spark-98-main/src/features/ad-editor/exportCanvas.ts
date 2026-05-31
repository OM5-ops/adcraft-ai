import type { Canvas } from "fabric";
import type { ExportFormat } from "./types";

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = href;
  link.click();
}

export async function exportFabricCanvas(
  canvas: Canvas,
  format: ExportFormat,
  options: { multiplier?: number; filename?: string; quality?: number } = {},
): Promise<void> {
  const multiplier = options.multiplier ?? 2;
  const quality = options.quality ?? 0.92;
  const base = options.filename ?? `adcraft-design-${Date.now()}`;

  if (format === "png") {
    const dataUrl = canvas.toDataURL({ format: "png", multiplier, quality: 1 });
    triggerDownload(dataUrl, `${base}.png`);
    return;
  }

  if (format === "jpg") {
    const dataUrl = canvas.toDataURL({ format: "jpeg", multiplier, quality });
    triggerDownload(dataUrl, `${base}.jpg`);
    return;
  }

  const { jsPDF } = await import("jspdf");
  const w = canvas.getWidth();
  const h = canvas.getHeight();
  const dataUrl = canvas.toDataURL({ format: "png", multiplier: 2, quality: 1 });
  const pdf = new jsPDF({
    orientation: w > h ? "landscape" : "portrait",
    unit: "px",
    format: [w, h],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
  pdf.save(`${base}.pdf`);
}
