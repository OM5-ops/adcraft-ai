import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActiveSelection,
  Canvas,
  Circle,
  FabricImage,
  FabricText,
  Gradient,
  Group,
  Line,
  Rect,
  Triangle,
  filters,
  type FabricObject,
} from "fabric";
import type { AdConcept, AdStyle } from "@/lib/adTypes";
import { buildCanvasFromAd } from "../buildInitialCanvas";
import { CANVAS_PRESETS } from "../constants";
import { editorDocumentStore } from "../editorDocumentStore";
import { exportFabricCanvas } from "../exportCanvas";
import { attachCanvasSnapping } from "../snapping";
import type { ExportFormat, LayerItem } from "../types";

const MAX_HISTORY = 40;

function layerName(obj: FabricObject): string {
  const n = (obj as FabricObject & { name?: string }).name;
  if (n) return n;
  const role = obj.get("adRole") as string | undefined;
  if (role) return role;
  return obj.type ?? "Object";
}

export function useFabricEditor(
  canvasEl: HTMLCanvasElement | null,
  concept: AdConcept,
  style: AdStyle,
  images: string[],
) {
  const canvasRef = useRef<Canvas | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const savingRef = useRef(false);

  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoom, setZoomState] = useState(100);
  const [presetId, setPresetId] = useState(() => editorDocumentStore.getPresetId() ?? "square");
  const [ready, setReady] = useState(false);

  const preset = CANVAS_PRESETS.find((p) => p.id === presetId) ?? CANVAS_PRESETS[0];

  const refreshLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const items: LayerItem[] = canvas
      .getObjects()
      .slice()
      .reverse()
      .map((obj, i) => ({
        id: `${i}-${obj.type}`,
        name: layerName(obj),
        type: obj.type ?? "object",
        visible: obj.visible !== false,
        locked: obj.lockMovementX === true,
      }));
    setLayers(items);
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || savingRef.current) return;
    const json = JSON.stringify(canvas.toJSON());
    const stack = historyRef.current.slice(0, historyIndexRef.current + 1);
    stack.push(json);
    if (stack.length > MAX_HISTORY) stack.shift();
    historyRef.current = stack;
    historyIndexRef.current = stack.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
    editorDocumentStore.saveCanvasJson(json);
    refreshLayers();
  }, [refreshLayers]);

  const loadHistoryIndex = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      const json = historyRef.current[index];
      if (!canvas || !json) return;
      savingRef.current = true;
      canvas
        .loadFromJSON(json)
        .then(() => {
          canvas.renderAll();
          historyIndexRef.current = index;
          setCanUndo(index > 0);
          setCanRedo(index < historyRef.current.length - 1);
          refreshLayers();
        })
        .finally(() => {
          savingRef.current = false;
        });
    },
    [refreshLayers],
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    loadHistoryIndex(historyIndexRef.current - 1);
  }, [loadHistoryIndex]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    loadHistoryIndex(historyIndexRef.current + 1);
  }, [loadHistoryIndex]);

  const initRef = useRef({ concept, style, images });
  initRef.current = { concept, style, images };

  useEffect(() => {
    if (!canvasEl) return;

    const currentPreset =
      CANVAS_PRESETS.find((p) => p.id === (editorDocumentStore.getPresetId() ?? "square")) ??
      CANVAS_PRESETS[0];

    const canvas = new Canvas(canvasEl, {
      width: currentPreset.width,
      height: currentPreset.height,
      preserveObjectStacking: true,
      selection: true,
    });
    canvasRef.current = canvas;

    let cancelled = false;

    void (async () => {
      const { concept: c, style: s, images: imgs } = initRef.current;
      const saved = editorDocumentStore.getCanvasJson();
      if (saved) {
        try {
          await canvas.loadFromJSON(saved);
          canvas.renderAll();
        } catch {
          await buildCanvasFromAd(canvas, c, s, imgs, currentPreset);
        }
      } else {
        await buildCanvasFromAd(canvas, c, s, imgs, currentPreset);
      }
      if (cancelled) return;

      pushHistory();
      const detachSnap = attachCanvasSnapping(canvas);

      canvas.on("selection:created", (e) => setSelectedObject(e.selected?.[0] ?? null));
      canvas.on("selection:updated", (e) => setSelectedObject(e.selected?.[0] ?? null));
      canvas.on("selection:cleared", () => setSelectedObject(null));
      canvas.on("object:modified", () => pushHistory());
      canvas.on("object:added", () => {
        if (!savingRef.current) pushHistory();
      });
      canvas.on("object:removed", () => pushHistory());

      setReady(true);
      refreshLayers();

      return () => {
        detachSnap();
      };
    })();

    return () => {
      cancelled = true;
      canvas.dispose();
      canvasRef.current = null;
      setReady(false);
    };
  }, [canvasEl, pushHistory, refreshLayers]);

  const getCanvas = () => canvasRef.current;

  const withSelected = (fn: (obj: FabricObject) => void) => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (obj) fn(obj);
    canvas?.renderAll();
    pushHistory();
  };

  const duplicateSelected = () => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    void obj.clone().then((cloned) => {
      cloned.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      pushHistory();
    });
  };

  const deleteSelected = () => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj || obj.get("adRole") === "background") return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.renderAll();
    pushHistory();
  };

  const bringForward = () => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      canvas.bringObjectForward(obj);
      pushHistory();
    }
  };

  const sendBackward = () => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      canvas.sendObjectBackwards(obj);
      pushHistory();
    }
  };

  const bringToFront = () => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (canvas && obj) {
      canvas.bringObjectToFront(obj);
      pushHistory();
    }
  };

  const sendToBack = () => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (canvas && obj && obj.get("adRole") !== "background") {
      canvas.sendObjectToBack(obj);
      const bg = canvas.getObjects().find((o) => o.get("adRole") === "background");
      if (bg) canvas.sendObjectToBack(bg);
      pushHistory();
    }
  };

  const toggleLockSelected = () => {
    withSelected((obj) => {
      const locked = !obj.lockMovementX;
      obj.set({
        lockMovementX: locked,
        lockMovementY: locked,
        lockScalingX: locked,
        lockScalingY: locked,
        lockRotation: locked,
        hasControls: !locked,
      });
    });
  };

  const groupSelected = () => {
    const canvas = getCanvas();
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== "activeselection") return;
    const objects = (active as ActiveSelection).getObjects();
    if (objects.length < 2) return;
    const group = new Group(objects);
    objects.forEach((o) => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    pushHistory();
  };

  const ungroupSelected = () => {
    const canvas = getCanvas();
    const obj = canvas?.getActiveObject();
    if (!canvas || !(obj instanceof Group)) return;
    const items = obj.getObjects();
    canvas.remove(obj);
    items.forEach((item) => {
      item.setCoords();
      canvas.add(item);
    });
    canvas.renderAll();
    pushHistory();
  };

  const addText = (text = "New text") => {
    const canvas = getCanvas();
    if (!canvas) return;
    const t = new FabricText(text, {
      left: canvas.getWidth() / 2 - 80,
      top: canvas.getHeight() / 2,
      fontSize: 32,
      fill: style.textColor,
      fontFamily: `${style.fontFamily}, sans-serif`,
      width: 400,
    });
    t.set("adRole", "decoration");
    (t as FabricObject & { name?: string }).name = "Text";
    canvas.add(t);
    canvas.setActiveObject(t);
    canvas.renderAll();
    pushHistory();
  };

  const addShape = (shape: "rect" | "circle" | "triangle" | "line") => {
    const canvas = getCanvas();
    if (!canvas) return;
    const cx = canvas.getWidth() / 2;
    const cy = canvas.getHeight() / 2;
    let obj: FabricObject;
    if (shape === "rect") {
      obj = new Rect({
        left: cx - 60,
        top: cy - 40,
        width: 120,
        height: 80,
        fill: style.accentColor,
      });
    } else if (shape === "circle") {
      obj = new Circle({ left: cx - 50, top: cy - 50, radius: 50, fill: style.accentColor });
    } else if (shape === "triangle") {
      obj = new Triangle({
        left: cx - 50,
        top: cy - 50,
        width: 100,
        height: 100,
        fill: style.accentColor,
      });
    } else {
      obj = new Line([cx - 60, cy, cx + 60, cy], {
        stroke: style.accentColor,
        strokeWidth: 4,
      });
    }
    obj.set("adRole", "shape");
    (obj as FabricObject & { name?: string }).name = shape;
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
    pushHistory();
  };

  const addImageFromUrl = async (url: string) => {
    const canvas = getCanvas();
    if (!canvas) return;
    const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
    const maxW = canvas.getWidth() * 0.4;
    const scale = maxW / (img.width || maxW);
    img.set({
      left: canvas.getWidth() / 2 - maxW / 2,
      top: canvas.getHeight() / 3,
      scaleX: scale,
      scaleY: scale,
    });
    img.set("adRole", "product-image");
    (img as FabricObject & { name?: string }).name = "Image";
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
    pushHistory();
  };

  const addImageFromFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      await addImageFromUrl(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const setBackgroundColor = (color: string) => {
    const canvas = getCanvas();
    if (!canvas) return;
    const bg = canvas.getObjects().find((o) => o.get("adRole") === "background");
    if (bg && bg instanceof Rect) {
      bg.set("fill", color);
      canvas.backgroundColor = color;
      canvas.renderAll();
      pushHistory();
    }
  };

  const setBackgroundGradient = (from: string, to: string) => {
    const canvas = getCanvas();
    if (!canvas) return;
    const bg = canvas.getObjects().find((o) => o.get("adRole") === "background");
    const W = canvas.getWidth();
    const H = canvas.getHeight();
    if (bg && bg instanceof Rect) {
      bg.fill = new Gradient({
        type: "linear",
        coords: { x1: 0, y1: 0, x2: W, y2: H },
        colorStops: [
          { offset: 0, color: from },
          { offset: 1, color: to },
        ],
      });
      canvas.renderAll();
      pushHistory();
    }
  };

  const setBackgroundImage = async (url: string) => {
    const canvas = getCanvas();
    if (!canvas) return;
    const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
    const scale = Math.max(
      canvas.getWidth() / (img.width || 1),
      canvas.getHeight() / (img.height || 1),
    );
    img.set({
      left: 0,
      top: 0,
      scaleX: scale,
      scaleY: scale,
      selectable: false,
      evented: false,
    });
    img.set("adRole", "background");
    const oldBg = canvas.getObjects().find((o) => o.get("adRole") === "background");
    if (oldBg) canvas.remove(oldBg);
    canvas.insertAt(0, img);
    canvas.renderAll();
    pushHistory();
  };

  const applyImageFilter = (
    type: "brightness" | "contrast" | "saturation" | "grayscale",
    value: number,
  ) => {
    withSelected((obj) => {
      if (!(obj instanceof FabricImage)) return;
      obj.filters = obj.filters ?? [];
      if (type === "brightness") {
        obj.filters = [new filters.Brightness({ brightness: value })];
      } else if (type === "contrast") {
        obj.filters = [new filters.Contrast({ contrast: value })];
      } else if (type === "saturation") {
        obj.filters = [new filters.Saturation({ saturation: value })];
      } else {
        obj.filters = [new filters.Grayscale()];
      }
      obj.applyFilters();
    });
  };

  const removeBackgroundApprox = () => {
    withSelected((obj) => {
      if (!(obj instanceof FabricImage)) return;
      obj.filters = [
        new filters.RemoveColor({
          distance: 0.25,
          color: "#ffffff",
        }),
      ];
      obj.applyFilters();
    });
  };

  const exportDesign = async (format: ExportFormat, quality = 0.92) => {
    const canvas = getCanvas();
    if (!canvas) return;
    await exportFabricCanvas(canvas, format, { multiplier: 2, quality });
  };

  const setZoom = (z: number) => {
    setZoomState(z);
    const canvas = getCanvas();
    if (!canvas) return;
    const wrapper = canvas.getElement().parentElement;
    if (wrapper) {
      wrapper.style.transform = `scale(${z / 100})`;
      wrapper.style.transformOrigin = "top center";
    }
  };

  const resetFromAd = async () => {
    const canvas = getCanvas();
    if (!canvas) return;
    await buildCanvasFromAd(canvas, concept, style, images, preset);
    pushHistory();
  };

  const resizePreset = async (newPresetId: string) => {
    setPresetId(newPresetId);
    editorDocumentStore.savePresetId(newPresetId);
    const canvas = getCanvas();
    const p = CANVAS_PRESETS.find((x) => x.id === newPresetId) ?? CANVAS_PRESETS[0];
    if (canvas) {
      canvas.setDimensions({ width: p.width, height: p.height });
      canvas.renderAll();
      pushHistory();
    }
  };

  const updateSelectedText = (patch: Record<string, unknown>) => {
    withSelected((obj) => {
      if (obj instanceof FabricText) obj.set(patch);
    });
  };

  const selectLayer = (index: number) => {
    const canvas = getCanvas();
    if (!canvas) return;
    const objs = canvas.getObjects().slice().reverse();
    const obj = objs[index];
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
      setSelectedObject(obj);
    }
  };

  return {
    ready,
    preset,
    presetId,
    resizePreset,
    selectedObject,
    layers,
    canUndo,
    canRedo,
    zoom,
    setZoom,
    undo,
    redo,
    duplicateSelected,
    deleteSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    toggleLockSelected,
    groupSelected,
    ungroupSelected,
    addText,
    addShape,
    addImageFromUrl,
    addImageFromFile,
    setBackgroundColor,
    setBackgroundGradient,
    setBackgroundImage,
    applyImageFilter,
    removeBackgroundApprox,
    exportDesign,
    resetFromAd,
    refreshLayers,
    updateSelectedText,
    selectLayer,
    getCanvas,
  };
}
