export type CanvasPresetId = "square" | "story" | "facebook" | "twitter" | "linkedin" | "custom";

export type CanvasPreset = {
  id: CanvasPresetId;
  label: string;
  width: number;
  height: number;
};

export type ExportFormat = "png" | "jpg" | "pdf";

export type EditorObjectRole =
  | "background"
  | "headline"
  | "subheadline"
  | "body"
  | "cta"
  | "product-image"
  | "shape"
  | "icon"
  | "sticker"
  | "frame"
  | "pattern"
  | "decoration";

export type LayerItem = {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
};
