const KEY_CANVAS = "adcraft:canvas-doc";
const KEY_PRESET = "adcraft:canvas-preset";

const isBrowser = () => typeof window !== "undefined";

export const editorDocumentStore = {
  saveCanvasJson: (json: string) => isBrowser() && localStorage.setItem(KEY_CANVAS, json),
  getCanvasJson: (): string | null => {
    if (!isBrowser()) return null;
    return localStorage.getItem(KEY_CANVAS);
  },
  savePresetId: (id: string) => isBrowser() && localStorage.setItem(KEY_PRESET, id),
  getPresetId: (): string | null => {
    if (!isBrowser()) return null;
    return localStorage.getItem(KEY_PRESET);
  },
  clear: () => {
    if (!isBrowser()) return;
    localStorage.removeItem(KEY_CANVAS);
    localStorage.removeItem(KEY_PRESET);
  },
};
