import type { Pass } from "../../types";
import { shaderPass } from "../shaderPass";
import { POSTERIZE_FS } from "./posterize.frag";

export interface PosterizeParams {
  levels: number;
}

export const POSTERIZE_DEFAULTS: PosterizeParams = { levels: 6 };

export function posterizePass(
  params: PosterizeParams = { ...POSTERIZE_DEFAULTS },
): Pass {
  return shaderPass(POSTERIZE_FS, { u_levels: () => params.levels });
}
