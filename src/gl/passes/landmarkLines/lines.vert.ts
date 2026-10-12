export const LINES_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;

in ivec2 a_edge;

uniform sampler2D u_landmarks;
uniform vec2 u_resolution;
uniform float u_width;
uniform int u_face;

out float v_dist;

const vec2 CORNERS[6] = vec2[6](
  vec2(0.0, -1.0), vec2(1.0, -1.0), vec2(0.0, 1.0),
  vec2(0.0,  1.0), vec2(1.0, -1.0), vec2(1.0, 1.0)
);

void main() {
  vec2 a = texelFetch(u_landmarks, ivec2(a_edge.x, u_face), 0).xy * u_resolution;
  vec2 b = texelFetch(u_landmarks, ivec2(a_edge.y, u_face), 0).xy * u_resolution;

  vec2 d = b - a;
  vec2 dir = length(d) > 1e-4 ? normalize(d) : vec2(1.0, 0.0);
  vec2 normal = vec2(-dir.y, dir.x);

  float halfW = u_width * 0.5 + 1.0;
  vec2 c = CORNERS[gl_VertexID];
  vec2 p = mix(a, b, c.x) + normal * c.y * halfW + dir * (c.x * 2.0 - 1.0) * u_width * 0.5;

  v_dist = c.y * halfW;
  vec2 clip = p / u_resolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;
