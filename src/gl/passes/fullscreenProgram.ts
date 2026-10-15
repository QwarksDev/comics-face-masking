import {
  createProgram,
  type UniformLocator,
  uniformLocator,
} from "../core/program";
import { UNIT } from "../core/units";
import { MAX_FACES } from "../resources/LandmarkTexture";
import { FULLSCREEN_VS } from "../shaders/fullscreen.vert";
import { PASS_HEADER } from "../shaders/passHeader";
import type { Frame } from "../types";

export interface FullscreenProgram {
  program: WebGLProgram;
  loc: UniformLocator;
  use(frame: Frame): void;
}

export function createFullscreenProgram(
  gl: WebGL2RenderingContext,
  source: string,
): FullscreenProgram {
  const program = createProgram(gl, FULLSCREEN_VS, `${PASS_HEADER}\n${source}`);
  const loc = uniformLocator(gl, program);
  gl.useProgram(program);
  gl.uniform1i(loc("u_input"), UNIT.input);
  gl.uniform1i(loc("u_video"), UNIT.video);
  gl.uniform1i(loc("u_landmarks"), UNIT.landmarks);
  gl.uniform1i(loc("u_faceSlots"), MAX_FACES);

  const use = (frame: Frame) => {
    gl.useProgram(program);
    gl.uniform2fv(loc("u_resolution"), frame.resolution);
    gl.uniform1f(loc("u_time"), frame.time);
    gl.uniform1i(
      loc("u_faceCount"),
      frame.faces.filter((face) => !face.idle).length,
    );
  };
  return { program, loc, use };
}

export function drawFullscreen(gl: WebGL2RenderingContext) {
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
