import type { Connection } from "../../../tracking/connections";
import { createProgram, uniformLocator } from "../../core/program";
import { UNIT } from "../../core/units";
import type { Pass, Vec4 } from "../../types";
import { LINES_FS } from "./lines.frag";
import { LINES_VS } from "./lines.vert";

export interface LandmarkLinesOptions {
  color?: Vec4;
  width?: number;
}

function createEdgeVao(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  connections: readonly Connection[],
): WebGLVertexArrayObject | null {
  const edges = new Int32Array(connections.flatMap((c) => [c.start, c.end]));
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, edges, gl.STATIC_DRAW);
  const attr = gl.getAttribLocation(program, "a_edge");
  gl.enableVertexAttribArray(attr);
  gl.vertexAttribIPointer(attr, 2, gl.INT, 0, 0);
  gl.vertexAttribDivisor(attr, 1);
  gl.bindVertexArray(null);
  return vao;
}

export function landmarkLinesPass(
  connections: readonly Connection[],
  { color = [0, 1, 0.5, 1], width = 2 }: LandmarkLinesOptions = {},
): Pass {
  return {
    overlay: true,
    create(gl) {
      const program = createProgram(gl, LINES_VS, LINES_FS);
      const loc = uniformLocator(gl, program);
      gl.useProgram(program);
      gl.uniform1i(loc("u_landmarks"), UNIT.landmarks);
      gl.uniform4fv(loc("u_color"), color);
      gl.uniform1f(loc("u_width"), width);
      const vao = createEdgeVao(gl, program, connections);

      return (frame) => {
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.uniform2fv(loc("u_resolution"), frame.resolution);
        for (let face = 0; face < frame.faceCount; face++) {
          gl.uniform1i(loc("u_face"), face);
          gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, connections.length);
        }
      };
    },
  };
}
