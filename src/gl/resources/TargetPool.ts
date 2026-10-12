import { createTarget, deleteTarget, type RenderTarget } from "../core/target";

export class TargetPool {
  private pair: [RenderTarget, RenderTarget] | null = null;
  private width = 0;
  private height = 0;

  constructor(private readonly gl: WebGL2RenderingContext) {}

  resize(width: number, height: number) {
    if (this.pair && width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.pair?.forEach((t) => deleteTarget(this.gl, t));
    this.pair = [
      createTarget(this.gl, width, height),
      createTarget(this.gl, width, height),
    ];
  }

  pingPong(): [RenderTarget, RenderTarget] {
    if (!this.pair) throw new Error("TargetPool used before resize()");
    return [...this.pair];
  }

  dispose() {
    this.pair?.forEach((t) => deleteTarget(this.gl, t));
    this.pair = null;
  }
}
