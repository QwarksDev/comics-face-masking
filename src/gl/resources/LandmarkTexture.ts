import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { createTexture } from "../core/texture";

export const NUM_LANDMARKS = 478;
export const MAX_FACES = 4;

export class LandmarkTexture {
  readonly texture: WebGLTexture;
  faceCount = 0;
  private readonly data = new Float32Array(NUM_LANDMARKS * MAX_FACES * 4);

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.texture = createTexture(gl, gl.NEAREST);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, NUM_LANDMARKS, MAX_FACES);
  }

  update(faces: NormalizedLandmark[][]) {
    const count = Math.min(faces.length, MAX_FACES);
    this.faceCount = count;
    if (count === 0) return;

    const data = this.data;
    for (let f = 0; f < count; f++) {
      const face = faces[f];
      let o = f * NUM_LANDMARKS * 4;
      for (let i = 0; i < NUM_LANDMARKS; i++) {
        const p = face[i];
        data[o++] = p.x;
        data[o++] = p.y;
        data[o++] = p.z;
        data[o++] = 1;
      }
    }

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      NUM_LANDMARKS,
      count,
      gl.RGBA,
      gl.FLOAT,
      data,
    );
  }

  dispose() {
    this.gl.deleteTexture(this.texture);
  }
}
