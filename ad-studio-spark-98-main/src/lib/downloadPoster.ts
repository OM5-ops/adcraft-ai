import html2canvas from "html2canvas";
import { toPng } from "html-to-image";

export type DownloadPosterOptions = {
  filename?: string;
  scale?: number;
};

function getPosterBackgroundColor(el: HTMLElement): string {
  const bg = getComputedStyle(el).backgroundColor;
  if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
  return "#ffffff";
}

/** Load a remote image as a data URL (CORS-safe for canvas export). */
async function imageUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image blob"));
    reader.readAsDataURL(blob);
  });
}

/** Fallback: draw via Image + canvas when fetch is blocked. */
async function imageUrlToDataUrlViaCanvas(url: string): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}

async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = root.querySelectorAll("img");
  await Promise.all(
    Array.from(imgs).map(async (img) => {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;

      let dataUrl: string | null = null;
      try {
        dataUrl = await imageUrlToDataUrl(src);
      } catch {
        try {
          dataUrl = await imageUrlToDataUrlViaCanvas(src);
        } catch {
          // Last resort: keep original src; html2canvas may still render if CORS allows
          img.crossOrigin = "anonymous";
          return;
        }
      }
      if (dataUrl) {
        img.src = dataUrl;
        img.removeAttribute("crossorigin");
      }
    }),
  );
}

function prepareClone(posterElement: HTMLElement): { sandbox: HTMLDivElement; clone: HTMLElement } {
  const sandbox = document.createElement("div");
  sandbox.setAttribute("data-export-sandbox", "true");
  sandbox.style.cssText =
    "position:fixed;left:-99999px;top:0;width:max-content;height:max-content;overflow:visible;z-index:-1;pointer-events:none;opacity:1;";

  const clone = posterElement.cloneNode(true) as HTMLElement;
  const width = posterElement.offsetWidth || posterElement.getBoundingClientRect().width;

  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.maxHeight = "none";
  clone.style.maxWidth = "none";
  clone.style.overflow = "visible";
  clone.style.width = `${width}px`;
  clone.style.height = "auto";
  clone.style.boxShadow = "none";
  clone.style.margin = "0";

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  return { sandbox, clone };
}

/**
 * Captures only the poster DOM node (not the page) as a high-quality PNG.
 */
export async function downloadPosterAsPng(
  posterElement: HTMLElement,
  options: DownloadPosterOptions = {},
): Promise<void> {
  const { filename = `adcraft-poster-${Date.now()}.png`, scale = 2 } = options;

  if (!posterElement.offsetWidth && !posterElement.getBoundingClientRect().width) {
    throw new Error("Poster element has no visible size");
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const bgColor = getPosterBackgroundColor(posterElement);
  const { sandbox, clone } = prepareClone(posterElement);

  try {
    await inlineImages(clone);

    const width = clone.offsetWidth || posterElement.offsetWidth;
    const height = clone.scrollHeight || posterElement.scrollHeight;

    const triggerDownload = (href: string) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = href;
      link.click();
    };

    // Primary: html-to-image (handles fonts/gradients well)
    try {
      const dataUrl = await toPng(clone, {
        pixelRatio: scale,
        cacheBust: true,
        skipAutoScale: false,
        backgroundColor: bgColor,
        width,
        height,
        style: {
          transform: "none",
          overflow: "visible",
        },
      });
      triggerDownload(dataUrl);
      return;
    } catch (primaryErr) {
      console.warn("html-to-image export failed, falling back to html2canvas:", primaryErr);
    }

    // Fallback: html2canvas
    const canvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      allowTaint: false,
      backgroundColor: bgColor,
      logging: false,
      imageTimeout: 20000,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      onclone: (_doc, node) => {
        const el = node as HTMLElement;
        el.style.transform = "none";
        el.style.overflow = "visible";
      },
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png", 1);
    });

    if (!blob) {
      throw new Error("Canvas export produced an empty blob (possible CORS restriction)");
    }

    const url = URL.createObjectURL(blob);
    triggerDownload(url);
    URL.revokeObjectURL(url);
  } finally {
    sandbox.remove();
  }
}
