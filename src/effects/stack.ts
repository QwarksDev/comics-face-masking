import { landmarkLinesPass } from "../gl/passes";
import type { Pass, Vec4 } from "../gl/types";
import { FACE_CONTOURS, IRISES } from "../tracking/connections";

const CONTOUR_COLORS: Vec4[] = [
  [0, 1, 0.53, 1],
  [0.2, 0.6, 1, 1],
  [1, 0.8, 0.1, 1],
  [0.8, 0.3, 1, 1],
];
const IRIS_COLORS: Vec4[] = [
  [1, 0.2, 0.4, 1],
  [1, 0.5, 0.1, 1],
];

export const EFFECT_STACK: readonly Pass[] = [
  landmarkLinesPass(FACE_CONTOURS, { color: CONTOUR_COLORS, width: 2 }),
  landmarkLinesPass(IRISES, { color: IRIS_COLORS, width: 2 }),
];
