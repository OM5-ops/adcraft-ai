import type { Canvas, FabricObject } from "fabric";
import { SNAP_THRESHOLD } from "./constants";

export function attachCanvasSnapping(canvas: Canvas): () => void {
  const onMoving = (e: { target?: FabricObject }) => {
    const obj = e.target;
    if (!obj || obj.get("adRole") === "background") return;

    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const centerX = w / 2;
    const centerY = h / 2;
    const objW = obj.getScaledWidth();
    const objH = obj.getScaledHeight();
    const left = obj.left ?? 0;
    const top = obj.top ?? 0;
    const objCenterX = left + objW / 2;
    const objCenterY = top + objH / 2;

    let snapLeft = left;
    let snapTop = top;

    if (Math.abs(objCenterX - centerX) < SNAP_THRESHOLD) {
      snapLeft = centerX - objW / 2;
    }
    if (Math.abs(objCenterY - centerY) < SNAP_THRESHOLD) {
      snapTop = centerY - objH / 2;
    }
    if (Math.abs(left - 0) < SNAP_THRESHOLD) snapLeft = 0;
    if (Math.abs(top - 0) < SNAP_THRESHOLD) snapTop = 0;
    if (Math.abs(left + objW - w) < SNAP_THRESHOLD) snapLeft = w - objW;
    if (Math.abs(top + objH - h) < SNAP_THRESHOLD) snapTop = h - objH;

    obj.set({ left: snapLeft, top: snapTop });
    obj.setCoords();
  };

  canvas.on("object:moving", onMoving);
  return () => canvas.off("object:moving", onMoving);
}
