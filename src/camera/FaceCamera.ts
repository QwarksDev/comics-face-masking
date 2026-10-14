import { ZOOM } from "../config/zoom";
import type { Vec4 } from "../gl/types";
import type { TrackedFace } from "../tracking/FaceTracker";
import { faceBox } from "../tracking/faceBox";

interface View {
  cx: number;
  cy: number;
  scale: number;
}

const FULL_VIEW: View = { cx: 0.5, cy: 0.5, scale: 1 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function framing(face: TrackedFace): View {
  const { cx, cy, size } = faceBox(face.landmarks);
  return {
    cx,
    cy,
    scale: clamp(ZOOM.faceHeightRatio / size, 1, ZOOM.maxScale),
  };
}

function toUvRect({ cx, cy, scale }: View): Vec4 {
  const size = 1 / scale;
  const x = clamp(cx - size / 2, 0, 1 - size);
  const y = clamp(1 - cy - size / 2, 0, 1 - size);
  return [x, y, size, size];
}

export class FaceCamera {
  private slot: number | null = null;
  private faces: readonly (TrackedFace | null)[] = [];
  private view: View = FULL_VIEW;
  private lastUpdate: number | null = null;

  toggle() {
    if (this.slot !== null) {
      this.slot = null;
      return;
    }
    const first = this.faces.findIndex((face) => face !== null);
    if (first >= 0) this.slot = first;
  }

  update(faces: readonly (TrackedFace | null)[], now: number): Vec4 {
    this.faces = faces;
    const face = this.slot === null ? null : faces[this.slot];
    if (!face) this.slot = null;

    const target = face ? framing(face) : FULL_VIEW;
    const elapsed = this.lastUpdate === null ? 0 : now - this.lastUpdate;
    this.lastUpdate = now;
    const t = 1 - Math.exp(-elapsed / ZOOM.smoothingMs);
    this.view = {
      cx: lerp(this.view.cx, target.cx, t),
      cy: lerp(this.view.cy, target.cy, t),
      scale: lerp(this.view.scale, target.scale, t),
    };
    return toUvRect(this.view);
  }
}
