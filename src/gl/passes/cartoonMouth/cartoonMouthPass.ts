import { BLENDSHAPE, type BlendshapeName } from "../../../tracking/detection";
import { createProgram, uniformLocator } from "../../core/program";
import { UNIT } from "../../core/units";
import { MAX_FACES } from "../../resources/LandmarkTexture";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { ActiveFace, Pass, Vec2 } from "../../types";
import { slotSmoother, smoothstep } from "../shared/expression";
import { createSpriteTexture, type Sprite } from "../shared/spriteTexture";
import { MOUTH_FS } from "./mouth.frag";
import { MOUTH_VS } from "./mouth.vert";
import { choosePose, MOUTH_POSES, type MouthPose } from "./poses";

export type MouthArt = Record<MouthPose, Sprite>;

export interface CartoonMouthOptions {
  art?: Partial<MouthArt>;
  size?: number;
  offset?: Vec2;
  openRange?: Vec2;
  openSquash?: Vec2;
  stretchGain?: number;
  tiltGain?: number;
  shiftGain?: number;
  holdTime?: number;
  fadeTime?: number;
  smoothing?: number;
  swapSides?: boolean;
  debug?: boolean;
}

const ART_DIR = `${import.meta.env.BASE_URL}mouth/`;

type SidedName<T extends string> = T extends `${infer Base}Right`
  ? Base
  : never;

const UPPER_LIP = 13;
const LOWER_LIP = 14;
const RIGHT_EYE = 33;
const LEFT_EYE = 263;

function lipGap(landmarks: readonly NormalizedLandmark[], [w, h]: Vec2) {
  const span = (a: number, b: number) =>
    Math.hypot(
      (landmarks[a].x - landmarks[b].x) * w,
      (landmarks[a].y - landmarks[b].y) * h,
    );
  return span(UPPER_LIP, LOWER_LIP) / Math.max(span(RIGHT_EYE, LEFT_EYE), 1e-6);
}

const OPEN = 0;
const SMILE = 1;
const SMIRK = 2;
const FROWN = 3;
const ROUND = 4;
const PUCKER = 5;
const STRETCH = 6;
const TILT = 7;
const SHIFT = 8;

interface PoseState {
  pose: MouthPose;
  flip: boolean;
  previous: MouthPose;
  previousFlip: boolean;
  changedAt: number;
  candidate: MouthPose;
  candidateFlip: boolean;
  candidateSince: number;
}

export function cartoonMouthPass({
  art = {},
  size = 1,
  offset = [0, -0.28],
  openRange = [0.02, 0.25],
  openSquash = [0.45, 1.2],
  stretchGain = 0.25,
  tiltGain = 0.35,
  shiftGain = 0.3,
  holdTime = 0.04,
  fadeTime = 0.08,
  smoothing = 0.35,
  swapSides = false,
  debug = false,
}: CartoonMouthOptions = {}): Pass {
  const sprites = Object.fromEntries(
    MOUTH_POSES.map((pose) => [pose, art[pose] ?? `${ART_DIR}${pose}.png`]),
  ) as MouthArt;
  const smooth = slotSmoother(smoothing);
  const scratch = new Float32Array(9);
  const poses: (PoseState | null)[] = new Array(MAX_FACES).fill(null);
  let lastLog = -Infinity;

  const signals = (
    { landmarks, blendshapes: b }: ActiveFace,
    resolution: Vec2,
    out: Float32Array,
  ) => {
    const sides = (base: SidedName<BlendshapeName>): Vec2 => {
      const right = b[BLENDSHAPE[`${base}Right`]];
      const left = b[BLENDSHAPE[`${base}Left`]];
      return swapSides ? [left, right] : [right, left];
    };
    const [smileR, smileL] = sides("mouthSmile");
    const [frownR, frownL] = sides("mouthFrown");
    const [stretchR, stretchL] = sides("mouthStretch");
    const [moveR, moveL] = sides("mouth");
    const [dimpleR, dimpleL] = sides("mouthDimple");
    const pucker = b[BLENDSHAPE.mouthPucker];
    const funnel = b[BLENDSHAPE.mouthFunnel];
    out[OPEN] = smoothstep(
      openRange[0],
      openRange[1],
      lipGap(landmarks, resolution),
    );
    out[SMILE] = (smileR + smileL) / 2;
    out[SMIRK] = smileL - smileR + (dimpleL - dimpleR) + (moveL - moveR) * 0.5;
    out[FROWN] = (frownR + frownL) / 2 + b[BLENDSHAPE.mouthShrugLower] * 0.5;
    out[ROUND] = Math.max(pucker, funnel);
    out[PUCKER] = pucker;
    out[STRETCH] = (stretchR + stretchL) / 2;
    out[TILT] = smileL - frownL - (smileR - frownR);
    out[SHIFT] = moveL - moveR;
    return out;
  };

  const updatePose = (
    slot: number,
    pose: MouthPose,
    flip: boolean,
    time: number,
  ): PoseState => {
    let state = poses[slot];
    if (!state) {
      state = {
        pose,
        flip,
        previous: pose,
        previousFlip: flip,
        changedAt: -Infinity,
        candidate: pose,
        candidateFlip: flip,
        candidateSince: time,
      };
      poses[slot] = state;
      return state;
    }
    if (pose === state.pose && flip === state.flip) {
      state.candidate = pose;
      state.candidateFlip = flip;
    } else if (pose !== state.candidate || flip !== state.candidateFlip) {
      state.candidate = pose;
      state.candidateFlip = flip;
      state.candidateSince = time;
    } else if (time - state.candidateSince >= holdTime) {
      state.previous = state.pose;
      state.previousFlip = state.flip;
      state.pose = pose;
      state.flip = flip;
      state.changedAt = time;
    }
    return state;
  };

  const transform = (s: Float32Array, pose: MouthPose): number[] => {
    const scaleX = Math.min(
      Math.max(1 + s[STRETCH] * stretchGain - s[PUCKER] * 0.25, 0.6),
      1.4,
    );
    let scaleY = 1;
    if (pose === "open" || pose === "grin")
      scaleY = openSquash[0] + (openSquash[1] - openSquash[0]) * s[OPEN];
    else if (pose === "o") scaleY = 0.85 + 0.3 * s[ROUND];
    const tilt = s[TILT] * tiltGain * (pose === "smirk" ? 0.3 : 1);
    return [scaleX, scaleY, tilt, s[SHIFT] * shiftGain];
  };

  return {
    overlay: true,
    create(gl) {
      const program = createProgram(gl, MOUTH_VS, MOUTH_FS);
      const loc = uniformLocator(gl, program);
      const textures = Object.fromEntries(
        MOUTH_POSES.map((pose) => [
          pose,
          createSpriteTexture(gl, sprites[pose]),
        ]),
      ) as Record<MouthPose, WebGLTexture>;

      gl.useProgram(program);
      gl.uniform1i(loc("u_landmarks"), UNIT.landmarks);
      gl.uniform1i(loc("u_current"), UNIT.aux);
      gl.uniform1i(loc("u_previous"), UNIT.aux2);
      gl.uniform1f(loc("u_size"), size);
      gl.uniform2fv(loc("u_offset"), offset);

      return (frame) => {
        gl.useProgram(program);
        gl.uniform2fv(loc("u_resolution"), frame.resolution);
        for (const face of frame.faces) {
          const { slot } = face;
          const s = smooth(slot, signals(face, frame.resolution, scratch));
          const mouth = {
            open: s[OPEN],
            smile: s[SMILE],
            smirk: s[SMIRK],
            frown: s[FROWN],
            round: s[ROUND],
          };
          const wanted = choosePose(mouth);
          const state = updatePose(
            slot,
            wanted,
            wanted === "smirk" && s[SMIRK] > 0,
            frame.time,
          );
          if (debug && frame.time - lastLog > 0.25) {
            lastLog = frame.time;
            console.debug(
              `mouth[${slot}] ${state.pose}`,
              Object.entries(mouth)
                .map(([k, v]) => `${k}=${v.toFixed(2)}`)
                .join(" "),
            );
          }
          const fade =
            fadeTime > 0
              ? Math.min((frame.time - state.changedAt) / fadeTime, 1)
              : 1;

          gl.activeTexture(gl.TEXTURE0 + UNIT.aux);
          gl.bindTexture(gl.TEXTURE_2D, textures[state.pose]);
          gl.activeTexture(gl.TEXTURE0 + UNIT.aux2);
          gl.bindTexture(gl.TEXTURE_2D, textures[state.previous]);

          gl.uniform1i(loc("u_face"), slot);
          gl.uniform4fv(loc("u_transform"), transform(s, state.pose));
          gl.uniform2f(
            loc("u_flip"),
            state.flip ? 1 : -1,
            state.previousFlip ? 1 : -1,
          );
          gl.uniform1f(loc("u_fade"), fade);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      };
    },
  };
}
