import { landmarkLinesPass } from "../gl/passes";
import type { Pass } from "../gl/types";
import { FACE_CONTOURS, IRISES } from "../tracking/connections";

export const EFFECT_STACK: readonly Pass[] = [
  landmarkLinesPass(FACE_CONTOURS, { color: [0, 1, 0.53, 1], width: 2 }),
  landmarkLinesPass(IRISES, { color: [1, 0.2, 0.4, 1], width: 2 }),
];
