import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface FaceBox {
  cx: number;
  cy: number;
  size: number;
}

export function faceBox(landmarks: readonly NormalizedLandmark[]): FaceBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { x, y } of landmarks) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    size: Math.max(maxX - minX, maxY - minY, 1e-6),
  };
}

export function boxDistance(a: FaceBox, b: FaceBox): number {
  return Math.hypot(a.cx - b.cx, a.cy - b.cy) / Math.max(a.size, b.size);
}
