import { createTarget, deleteTarget, type RenderTarget } from "../core/target";

export class TargetPool {
  private pair: [RenderTarget, RenderTarget] | null = null;
  private readonly scratchTargets = new Map<symbol, RenderTarget>();
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

  scratch(key: symbol, scale = 1): RenderTarget {
    const width = Math.max(1, Math.round(this.width * scale));
    const height = Math.max(1, Math.round(this.height * scale));
    let target = this.scratchTargets.get(key);
    if (target?.width !== width || target.height !== height) {
      deleteTarget(this.gl, target);
      target = createTarget(this.gl, width, height);
      this.scratchTargets.set(key, target);
    }
    return target;
  }

  dispose() {
    this.pair?.forEach((t) => deleteTarget(this.gl, t));
    this.scratchTargets.forEach((t) => deleteTarget(this.gl, t));
    this.scratchTargets.clear();
    this.pair = null;
  }
}
