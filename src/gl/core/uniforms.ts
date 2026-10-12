export type UniformValue = number | readonly number[];

export function setUniform(
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation | null,
  value: UniformValue,
) {
  if (location === null) return;
  if (typeof value === "number") gl.uniform1f(location, value);
  else if (value.length === 2) gl.uniform2fv(location, value);
  else if (value.length === 3) gl.uniform3fv(location, value);
  else if (value.length === 4) gl.uniform4fv(location, value);
}
