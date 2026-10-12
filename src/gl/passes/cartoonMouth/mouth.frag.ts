export const MOUTH_FS = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_local;

uniform sampler2D u_current;
uniform sampler2D u_previous;
uniform vec2 u_flip;
uniform float u_fade;

out vec4 outColor;

vec4 sprite(sampler2D s, vec2 p) {
  return texture(s, vec2(p.x, -p.y) * 0.5 + 0.5);
}

void main() {
  vec4 current = sprite(u_current, v_local * vec2(u_flip.x, 1.0));
  vec4 previous = sprite(u_previous, v_local * vec2(u_flip.y, 1.0));
  vec4 color = mix(previous, current, u_fade);
  outColor = color.a > 0.0 ? vec4(color.rgb / color.a, color.a) : vec4(0.0);
}`;
