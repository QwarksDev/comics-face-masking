import { BLENDSHAPE } from "../../../tracking/detection";
import { createProgram, uniformLocator } from "../../core/program";
import { UNIT } from "../../core/units";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { ActiveFace, Pass, Vec2, Vec4 } from "../../types";
import { EYES_FS } from "./eyes.frag";
import { EYES_VS } from "./eyes.vert";
import { slotSmoother, smoothstep } from "../shared/expression";
import { createSpriteTexture, type Sprite } from "../shared/spriteTexture";

export interface EyeArt {
  sclera: Sprite;
  pupil: Sprite;
  outline: Sprite;
  closed: Sprite;
}

export interface CartoonEyesParams {
  size: number;
  aspect: number;
  foreshortening: number;
  depth: number;
  offset: Vec2;
  pupilSize: Vec2;
  gazeRange: Vec2;
  gazeGain: Vec2;
  blinkRange: Vec2;
  squintRange: Vec2;
  wideGain: number;
  closedLid: number;
  lidCurve: number;
  squintLid: number;
  lowerLidCurve: number;
  lidWidth: number;
  lidColor: Vec4;
  shutBlend: number;
  smoothing: number;
  mirror: boolean;
  swapSides: boolean;
}

export const CARTOON_EYES_DEFAULTS: CartoonEyesParams = {
  size: 0.5,
  aspect: 1.35,
  foreshortening: 0,
  depth: 0,
  offset: [0, 0],
  pupilSize: [0.42, 0.5],
  gazeRange: [0.45, 0.4],
  gazeGain: [1.8, 1.8],
  blinkRange: [0.25, 0.6],
  squintRange: [0.2, 0.7],
  wideGain: 0.25,
  closedLid: -0.1,
  lidCurve: 0.3,
  squintLid: -0.35,
  lowerLidCurve: 0.15,
  lidWidth: 0.07,
  lidColor: [0, 0, 0, 1],
  shutBlend: 0.1,
  smoothing: 0.4,
  mirror: true,
  swapSides: false,
};

const ART_DIR = `${import.meta.env.BASE_URL}eyes/`;

const DEFAULT_ART: EyeArt = {
  sclera: `${ART_DIR}sclera.png`,
  pupil: `${ART_DIR}pupil.png`,
  outline: `${ART_DIR}outline.png`,
  closed: `${ART_DIR}closed.png`,
};

const RIGHT = {
  blink: BLENDSHAPE.eyeBlinkRight,
  squint: BLENDSHAPE.eyeSquintRight,
  wide: BLENDSHAPE.eyeWideRight,
  in: BLENDSHAPE.eyeLookInRight,
  out: BLENDSHAPE.eyeLookOutRight,
  up: BLENDSHAPE.eyeLookUpRight,
  down: BLENDSHAPE.eyeLookDownRight,
};
const LEFT = {
  blink: BLENDSHAPE.eyeBlinkLeft,
  squint: BLENDSHAPE.eyeSquintLeft,
  wide: BLENDSHAPE.eyeWideLeft,
  in: BLENDSHAPE.eyeLookInLeft,
  out: BLENDSHAPE.eyeLookOutLeft,
  up: BLENDSHAPE.eyeLookUpLeft,
  down: BLENDSHAPE.eyeLookDownLeft,
};

const EYE_LANDMARKS = [
  [33, 133],
  [362, 263],
] as const;

function eyeDepth(landmarks: readonly NormalizedLandmark[], eye: 0 | 1) {
  const [a, b] = EYE_LANDMARKS[eye];
  return landmarks[a].z + landmarks[b].z;
}

const OPEN_R = 0;
const OPEN_L = 1;
const GAZE_X = 2;
const GAZE_Y = 3;
const WIDE_R = 4;
const WIDE_L = 5;
const SQUINT_R = 6;
const SQUINT_L = 7;

export function cartoonEyesPass(
  params: CartoonEyesParams = { ...CARTOON_EYES_DEFAULTS },
  art: Partial<EyeArt> = {},
): Pass {
  const sprites: EyeArt = { ...DEFAULT_ART, ...art };
  const smooth = slotSmoother();

  const target = (b: Float32Array, out: Float32Array) => {
    const { gazeGain, blinkRange, squintRange, wideGain, swapSides } = params;
    const [right, left] = swapSides ? [LEFT, RIGHT] : [RIGHT, LEFT];
    let gx = (b[right.in] - b[right.out] + b[left.out] - b[left.in]) / 2;
    let gy = (b[right.up] - b[right.down] + b[left.up] - b[left.down]) / 2;
    gx *= gazeGain[0];
    gy *= gazeGain[1];
    const length = Math.hypot(gx, gy);
    if (length > 1) {
      gx /= length;
      gy /= length;
    }
    out[OPEN_R] = 1 - smoothstep(blinkRange[0], blinkRange[1], b[right.blink]);
    out[OPEN_L] = 1 - smoothstep(blinkRange[0], blinkRange[1], b[left.blink]);
    out[GAZE_X] = gx;
    out[GAZE_Y] = gy;
    out[WIDE_R] = b[right.wide] * wideGain;
    out[WIDE_L] = b[left.wide] * wideGain;
    out[SQUINT_R] = smoothstep(squintRange[0], squintRange[1], b[right.squint]);
    out[SQUINT_L] = smoothstep(squintRange[0], squintRange[1], b[left.squint]);
    return out;
  };

  const scratch = new Float32Array(8);
  const expression = ({ slot, blendshapes }: ActiveFace): Float32Array =>
    smooth(slot, target(blendshapes, scratch), params.smoothing);

  return {
    overlay: true,
    create(gl) {
      const program = createProgram(gl, EYES_VS, EYES_FS);
      const loc = uniformLocator(gl, program);
      const textures = [
        { unit: UNIT.aux, uniform: "u_sclera", key: "sclera" },
        { unit: UNIT.aux2, uniform: "u_pupil", key: "pupil" },
        { unit: UNIT.aux3, uniform: "u_outline", key: "outline" },
        { unit: UNIT.aux4, uniform: "u_closed", key: "closed" },
      ] as const;
      const bound = textures.map(({ unit, uniform, key }) => ({
        unit,
        uniform,
        texture: createSpriteTexture(gl, sprites[key]),
      }));

      gl.useProgram(program);
      gl.uniform1i(loc("u_landmarks"), UNIT.landmarks);
      for (const { unit, uniform } of bound) gl.uniform1i(loc(uniform), unit);

      const applyParams = () => {
        gl.uniform1f(loc("u_size"), params.size);
        gl.uniform1f(loc("u_aspect"), params.aspect);
        gl.uniform1f(loc("u_foreshortening"), params.foreshortening);
        gl.uniform1f(loc("u_depth"), params.depth);
        gl.uniform2fv(loc("u_offset"), params.offset);
        gl.uniform2fv(loc("u_pupilSize"), params.pupilSize);
        gl.uniform2fv(loc("u_gazeRange"), params.gazeRange);
        gl.uniform1f(loc("u_closedLid"), params.closedLid);
        gl.uniform1f(loc("u_lidCurve"), params.lidCurve);
        gl.uniform1f(loc("u_squintLid"), params.squintLid);
        gl.uniform1f(loc("u_lowerLidCurve"), params.lowerLidCurve);
        gl.uniform1f(loc("u_lidWidth"), params.lidWidth);
        gl.uniform4fv(loc("u_lidColor"), params.lidColor);
        gl.uniform1f(loc("u_shutBlend"), params.shutBlend);
        gl.uniform1i(loc("u_mirror"), params.mirror ? 1 : 0);
      };

      return (frame) => {
        gl.useProgram(program);
        applyParams();
        for (const { unit, texture } of bound) {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, texture);
        }
        gl.uniform2fv(loc("u_resolution"), frame.resolution);
        for (const face of frame.faces) {
          const e = expression(face);
          gl.uniform1i(loc("u_face"), face.slot);
          gl.uniform1i(
            loc("u_front"),
            eyeDepth(face.landmarks, 0) < eyeDepth(face.landmarks, 1) ? 0 : 1,
          );
          gl.uniform2f(loc("u_open"), e[OPEN_R], e[OPEN_L]);
          gl.uniform2f(loc("u_gaze"), e[GAZE_X], e[GAZE_Y]);
          gl.uniform2f(loc("u_wide"), e[WIDE_R], e[WIDE_L]);
          gl.uniform2f(loc("u_squint"), e[SQUINT_R], e[SQUINT_L]);
          gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 2);
        }
      };
    },
  };
}
