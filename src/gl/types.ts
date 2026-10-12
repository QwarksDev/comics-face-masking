import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type Vec2 = [number, number];
export type Vec4 = [number, number, number, number];

export interface SlotFace {
  landmarks: readonly NormalizedLandmark[];
  held: boolean;
}

export interface ActiveFace {
  slot: number;
  held: boolean;
}

export interface Frame {
  resolution: Vec2;
  time: number;
  faces: readonly ActiveFace[];
  input: WebGLTexture | null;
  output: WebGLFramebuffer;
}

export type Draw = (frame: Frame) => void;

export interface Pass {
  overlay?: boolean;
  enabled?: boolean;
  create(gl: WebGL2RenderingContext): Draw;
}
