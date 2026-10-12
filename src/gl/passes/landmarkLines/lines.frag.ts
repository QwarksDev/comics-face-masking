export const LINES_FS = /* glsl */ `#version 300 es
precision highp float;

in float v_dist;
uniform vec4 u_color;
uniform float u_width;
out vec4 outColor;

void main() {
  float coverage = clamp(u_width * 0.5 + 0.5 - abs(v_dist), 0.0, 1.0);
  outColor = vec4(u_color.rgb, u_color.a * coverage);
}`;
