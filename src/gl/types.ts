
export type Vec2 = [number, number];
export type Vec4 = [number, number, number, number];

export interface Frame {
  resolution: Vec2;
  time: number;
  faceCount: number;
  input: WebGLTexture | null;
  output: WebGLFramebuffer;
}

export type Draw = (frame: Frame) => void;

export interface Pass {
  overlay?: boolean;
  enabled?: boolean;
  create(gl: WebGL2RenderingContext): Draw;
}
