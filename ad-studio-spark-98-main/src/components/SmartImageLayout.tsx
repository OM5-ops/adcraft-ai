import { useEffect, useState } from "react";

type Img = { url: string; w: number; h: number; orient: "portrait" | "landscape" | "square" };

function measure(url: string): Promise<Img> {
  return new Promise((resolve) => {
    const i = new Image();
    i.onload = () => {
      const w = i.naturalWidth || 1;
      const h = i.naturalHeight || 1;
      const ratio = w / h;
      const orient: Img["orient"] = ratio > 1.1 ? "landscape" : ratio < 0.9 ? "portrait" : "square";
      resolve({ url, w, h, orient });
    };
    i.onerror = () => resolve({ url, w: 1, h: 1, orient: "square" });
    i.src = url;
  });
}

/**
 * Smart layout engine: detects dimensions and picks a poster-quality arrangement.
 * Avoids overlap by using CSS grid with object-fit cover, and varies template
 * based on count + dominant orientation.
 */
export function SmartImageLayout({
  urls,
  accent = "#fff",
  radius = 16,
}: {
  urls: string[];
  accent?: string;
  radius?: number;
}) {
  const [imgs, setImgs] = useState<Img[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(urls.map(measure)).then((r) => {
      if (!cancelled) setImgs(r);
    });
    return () => {
      cancelled = true;
    };
  }, [urls]);

  if (urls.length === 0) return null;
  if (imgs.length === 0) {
    return (
      <div className="w-full h-full bg-black/10 animate-pulse" style={{ borderRadius: radius }} />
    );
  }

  const count = imgs.length;
  const portraits = imgs.filter((i) => i.orient === "portrait").length;
  const landscapes = imgs.filter((i) => i.orient === "landscape").length;
  const dominant =
    portraits > landscapes ? "portrait" : landscapes > portraits ? "landscape" : "mixed";

  const wrap = (cls: string, children: React.ReactNode) => (
    <div
      className={cls}
      style={{
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: `0 20px 60px -20px ${accent}55`,
      }}
    >
      {children}
    </div>
  );

  const tile = (img: Img, extraStyle: React.CSSProperties = {}) => (
    <div key={img.url} style={{ overflow: "hidden", ...extraStyle }}>
      <img
        src={img.url}
        alt="product"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );

  if (count === 1) {
    const i = imgs[0];
    const aspect =
      i.orient === "landscape" ? "16 / 10" : i.orient === "portrait" ? "3 / 4" : "1 / 1";
    return wrap(
      "w-full",
      <div style={{ aspectRatio: aspect, background: "#0001" }}>
        {tile(i, { width: "100%", height: "100%" })}
      </div>,
    );
  }

  if (count === 2) {
    return wrap(
      "w-full",
      <div
        style={{
          display: "grid",
          gridTemplateColumns: dominant === "portrait" ? "1fr 1fr" : "1fr",
          gridAutoRows: dominant === "portrait" ? "1fr" : "180px",
          gap: 8,
          aspectRatio: dominant === "portrait" ? "3 / 2" : "4 / 5",
        }}
      >
        {imgs.map((i) => tile(i, { width: "100%", height: "100%" }))}
      </div>,
    );
  }

  if (count === 3) {
    return wrap(
      "w-full",
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 8,
          aspectRatio: "4 / 3",
        }}
      >
        <div style={{ gridRow: "span 2", overflow: "hidden" }}>
          {tile(imgs[0], { width: "100%", height: "100%" })}
        </div>
        {tile(imgs[1], { width: "100%", height: "100%" })}
        {tile(imgs[2], { width: "100%", height: "100%" })}
      </div>,
    );
  }

  if (count === 4) {
    return wrap(
      "w-full",
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 8,
          aspectRatio: "1 / 1",
        }}
      >
        {imgs.map((i) => tile(i, { width: "100%", height: "100%" }))}
      </div>,
    );
  }

  // 5+ : hero + masonry strip
  const [hero, ...rest] = imgs;
  return wrap(
    "w-full",
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
      <div
        style={{ aspectRatio: hero.orient === "portrait" ? "4 / 5" : "16 / 9", overflow: "hidden" }}
      >
        {tile(hero, { width: "100%", height: "100%" })}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(rest.length, 4)}, 1fr)`,
          gap: 8,
        }}
      >
        {rest.slice(0, 4).map((i) => (
          <div key={i.url} style={{ aspectRatio: "1 / 1", overflow: "hidden" }}>
            {tile(i, { width: "100%", height: "100%" })}
          </div>
        ))}
      </div>
    </div>,
  );
}
