import type { CanvasPreset } from "./types";

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: "square", label: "Instagram Square (1080×1080)", width: 1080, height: 1080 },
  { id: "story", label: "Story (1080×1920)", width: 1080, height: 1920 },
  { id: "facebook", label: "Facebook (1200×628)", width: 1200, height: 628 },
  { id: "twitter", label: "Twitter/X (1200×675)", width: 1200, height: 675 },
  { id: "linkedin", label: "LinkedIn (1200×627)", width: 1200, height: 627 },
];

export const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Bebas Neue",
  "Oswald",
  "Lora",
  "Space Grotesk",
  "DM Serif Display",
  "Archivo Black",
];

export const SHAPE_STICKERS = [
  { id: "star", label: "★", char: "★" },
  { id: "spark", label: "✦", char: "✦" },
  { id: "heart", label: "♥", char: "♥" },
  { id: "check", label: "✓", char: "✓" },
  { id: "arrow", label: "→", char: "→" },
];

export const PATTERN_BACKGROUNDS = [
  { id: "dots", label: "Dots" },
  { id: "grid", label: "Grid" },
  { id: "diagonal", label: "Diagonal" },
];

export const SNAP_THRESHOLD = 8;
