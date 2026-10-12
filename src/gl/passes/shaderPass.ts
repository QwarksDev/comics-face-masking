import { setUniform, type UniformValue } from "../core/uniforms";
import type { Frame, Pass } from "../types";
import { createFullscreenProgram, drawFullscreen } from "./fullscreenProgram";

export type UniformSource = UniformValue | ((frame: Frame) => UniformValue);

export function shaderPass(
  source: string,
  uniforms: Record<string, UniformSource> = {},
): Pass {
  return {
    create(gl) {
      const { loc, use } = createFullscreenProgram(gl, source);
      const custom = Object.entries(uniforms);

      return (frame) => {
        use(frame);
        for (const [name, value] of custom) {
          setUniform(
            gl,
            loc(name),
            typeof value === "function" ? value(frame) : value,
          );
        }
        drawFullscreen(gl);
      };
    },
  };
}
