import type {
  Classifications,
  FaceLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export const BLENDSHAPES = [
  "_neutral",
  "browDownLeft",
  "browDownRight",
  "browInnerUp",
  "browOuterUpLeft",
  "browOuterUpRight",
  "cheekPuff",
  "cheekSquintLeft",
  "cheekSquintRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeLookDownLeft",
  "eyeLookDownRight",
  "eyeLookInLeft",
  "eyeLookInRight",
  "eyeLookOutLeft",
  "eyeLookOutRight",
  "eyeLookUpLeft",
  "eyeLookUpRight",
  "eyeSquintLeft",
  "eyeSquintRight",
  "eyeWideLeft",
  "eyeWideRight",
  "jawForward",
  "jawLeft",
  "jawOpen",
  "jawRight",
  "mouthClose",
  "mouthDimpleLeft",
  "mouthDimpleRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "mouthFunnel",
  "mouthLeft",
  "mouthLowerDownLeft",
  "mouthLowerDownRight",
  "mouthPressLeft",
  "mouthPressRight",
  "mouthPucker",
  "mouthRight",
  "mouthRollLower",
  "mouthRollUpper",
  "mouthShrugLower",
  "mouthShrugUpper",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthStretchLeft",
  "mouthStretchRight",
  "mouthUpperUpLeft",
  "mouthUpperUpRight",
  "noseSneerLeft",
  "noseSneerRight",
] as const;

export type BlendshapeName = (typeof BLENDSHAPES)[number];

export const BLENDSHAPE = Object.fromEntries(
  BLENDSHAPES.map((name, i) => [name, i]),
) as Readonly<Record<BlendshapeName, number>>;

const INDEX_BY_NAME = new Map<string, number>(Object.entries(BLENDSHAPE));

export interface Detection {
  landmarks: readonly NormalizedLandmark[];
  blendshapes: Float32Array;
}

function blendshapeVector(classifications?: Classifications): Float32Array {
  const vector = new Float32Array(BLENDSHAPES.length);
  for (const { categoryName, score } of classifications?.categories ?? []) {
    const i = INDEX_BY_NAME.get(categoryName);
    if (i !== undefined) vector[i] = score;
  }
  return vector;
}

export function toDetections(result: FaceLandmarkerResult): Detection[] {
  return result.faceLandmarks.map((landmarks, i) => ({
    landmarks,
    blendshapes: blendshapeVector(result.faceBlendshapes[i]),
  }));
}
