import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { RenderTarget } from "./core/target";

export type Vec2 = [number, number];
export type Vec4 = [number, number, number, number];

export interface SlotFace {
  landmarks: readonly NormalizedLandmark[];
  blendshapes: Float32Array;
  held: boolean;
}

export interface ActiveFace {
  slot: number;
  held: boolean;
  blendshapes: Float32Array;
}

export interface Frame {
  resolution: Vec2;
  time: number;
  faces: readonly ActiveFace[];
  input: WebGLTexture | null;
  output: WebGLFramebuffer;
  scratch: (key: symbol, scale?: number) => RenderTarget;
}

export type Draw = (frame: Frame) => void;

export interface Pass {
  overlay?: boolean;
  enabled?: boolean;
  create(gl: WebGL2RenderingContext): Draw;
}
