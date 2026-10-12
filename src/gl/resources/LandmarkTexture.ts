import { TRACKING } from "../../config/tracking";
import { createTexture } from "../core/texture";
import type { ActiveFace, SlotFace } from "../types";

export const NUM_LANDMARKS = 478;
export const MAX_FACES = TRACKING.maxFaces;

export class LandmarkTexture {
  readonly texture: WebGLTexture;
  active: readonly ActiveFace[] = [];
  private readonly data = new Float32Array(NUM_LANDMARKS * MAX_FACES * 4);

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.texture = createTexture(gl, gl.NEAREST);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, NUM_LANDMARKS, MAX_FACES);
  }

  update(slots: readonly (SlotFace | null)[]) {
    const active: ActiveFace[] = [];
    for (let slot = 0; slot < MAX_FACES; slot++) {
      const face = slots[slot] ?? null;
      this.writeRow(slot, face);
      if (face) active.push({ slot, held: face.held });
    }
    this.active = active;

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      NUM_LANDMARKS,
      MAX_FACES,
      gl.RGBA,
      gl.FLOAT,
      this.data,
    );
  }

  dispose() {
    this.gl.deleteTexture(this.texture);
  }

  private writeRow(slot: number, face: SlotFace | null) {
    const data = this.data;
    let o = slot * NUM_LANDMARKS * 4;
    if (!face) {
      data.fill(0, o, o + NUM_LANDMARKS * 4);
      return;
    }
    for (let i = 0; i < NUM_LANDMARKS; i++) {
      const p = face.landmarks[i];
      data[o++] = p.x;
      data[o++] = p.y;
      data[o++] = p.z;
      data[o++] = 1;
    }
  }
}
