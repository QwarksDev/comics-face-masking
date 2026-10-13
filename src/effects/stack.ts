import {
  cartoonEyesPass,
  cartoonMouthPass,
  faceBlurPass,
  landmarkLinesPass,
  posterizePass,
} from "../gl/passes";
import type { Pass } from "../gl/types";
import { FACE_CONTOURS, FACE_OVAL, IRISES } from "../tracking/connections";
import { config } from "./config";

function toggleable(section: { enabled: boolean }, pass: Pass): Pass {
  return {
    overlay: pass.overlay,
    create: (gl) => pass.create(gl),
    get enabled() {
      return section.enabled;
    },
  };
}

export const EFFECT_STACK: readonly Pass[] = [
  toggleable(config.faceBlur, faceBlurPass(FACE_OVAL, config.faceBlur)),
  toggleable(config.posterize, posterizePass(config.posterize)),
  toggleable(
    config.contourLines,
    landmarkLinesPass(FACE_CONTOURS, config.contourLines),
  ),
  toggleable(config.irisLines, landmarkLinesPass(IRISES, config.irisLines)),
  toggleable(config.cartoonEyes, cartoonEyesPass(config.cartoonEyes)),
  toggleable(config.cartoonMouth, cartoonMouthPass(config.cartoonMouth)),
];
