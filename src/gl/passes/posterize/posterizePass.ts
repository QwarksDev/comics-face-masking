import type { Pass } from "../../types";
import { shaderPass } from "../shaderPass";
import { POSTERIZE_FS } from "./posterize.frag";

export function posterizePass(levels = 6): Pass {
  return shaderPass(POSTERIZE_FS, { u_levels: levels });
}
