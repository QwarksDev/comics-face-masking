import type { Connection } from "../../../tracking/connections";
import { UNIT } from "../../core/units";
import type { Frame, Pass } from "../../types";
import {
  createFullscreenProgram,
  drawFullscreen,
  type FullscreenProgram,
} from "../fullscreenProgram";
import { FACE_MASK_FS, MAX_POLY } from "./faceMask.frag";
import { GAUSSIAN_BLUR_FS } from "./gaussianBlur.frag";

export interface FaceBlurParams {
  sigma: number;
  padding: number;
  feather: number;
  downsample: number;
}

export const FACE_BLUR_DEFAULTS: FaceBlurParams = {
  sigma: 24,
  padding: 0.1,
  feather: 0.25,
  downsample: 0.5,
};

export function faceBlurPass(
  polygon: readonly Connection[],
  params: FaceBlurParams = { ...FACE_BLUR_DEFAULTS },
): Pass {
  const indices = polygon.map((c) => c.start);
  if (indices.length > MAX_POLY)
    throw new Error(`Polygon exceeds ${MAX_POLY} points`);

  return {
    create(gl) {
      const blur = createFullscreenProgram(gl, GAUSSIAN_BLUR_FS);
      const mask = createFullscreenProgram(gl, FACE_MASK_FS);
      gl.useProgram(mask.program);
      gl.uniform1i(mask.loc("u_blurred"), UNIT.aux);
      gl.uniform1iv(mask.loc("u_poly"), new Int32Array(indices));
      gl.uniform1i(mask.loc("u_polyCount"), indices.length);

      const blurred = gaussianBlur(gl, blur, params);

      return (frame) => {
        const texture = blurred(frame);
        gl.activeTexture(gl.TEXTURE0 + UNIT.input);
        gl.bindTexture(gl.TEXTURE_2D, frame.input);
        gl.activeTexture(gl.TEXTURE0 + UNIT.aux);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.viewport(0, 0, frame.resolution[0], frame.resolution[1]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, frame.output);
        mask.use(frame);
        gl.uniform1f(mask.loc("u_padding"), params.padding);
        gl.uniform1f(mask.loc("u_feather"), params.feather);
        drawFullscreen(gl);
      };
    },
  };
}

function gaussianBlur(
  gl: WebGL2RenderingContext,
  blur: FullscreenProgram,
  params: FaceBlurParams,
) {
  const keyH = Symbol("blurH");
  const keyV = Symbol("blurV");

  return (frame: Frame): WebGLTexture => {
    const { sigma, downsample } = params;
    const h = frame.scratch(keyH, downsample);
    const v = frame.scratch(keyV, downsample);
    gl.viewport(0, 0, h.width, h.height);
    blur.use(frame);
    gl.uniform1f(blur.loc("u_sigma"), sigma * downsample);
    gl.activeTexture(gl.TEXTURE0 + UNIT.input);

    gl.bindFramebuffer(gl.FRAMEBUFFER, h.framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, frame.input);
    gl.uniform2f(blur.loc("u_dir"), 1 / h.width, 0);
    drawFullscreen(gl);

    gl.bindFramebuffer(gl.FRAMEBUFFER, v.framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, h.texture);
    gl.uniform2f(blur.loc("u_dir"), 0, 1 / v.height);
    drawFullscreen(gl);

    return v.texture;
  };
}
