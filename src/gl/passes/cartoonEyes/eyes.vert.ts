export const EYES_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_landmarks;
uniform vec2 u_resolution;
uniform int u_face;
uniform float u_size;
uniform float u_aspect;
uniform vec2 u_offset;
uniform vec2 u_wide;

out vec2 v_local;
flat out int v_eye;

const ivec2 EYE_CORNERS[2] = ivec2[2](ivec2(33, 133), ivec2(362, 263));

const vec2 CORNERS[6] = vec2[6](
  vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
  vec2(-1.0,  1.0), vec2(1.0, -1.0), vec2(1.0,  1.0)
);

vec2 point(int i) {
  vec4 l = texelFetch(u_landmarks, ivec2(i, u_face), 0);
  return vec2(l.x, 1.0 - l.y) * u_resolution;
}

void main() {
  int eye = gl_InstanceID;
  vec2 a = point(EYE_CORNERS[eye].x);
  vec2 b = point(EYE_CORNERS[eye].y);

  vec2 d = b - a;
  vec2 xAxis = length(d) > 1e-4 ? normalize(d) : vec2(1.0, 0.0);
  vec2 yAxis = vec2(-xAxis.y, xAxis.x);
  if (dot(yAxis, point(10) - point(152)) < 0.0) yAxis = -yAxis;

  float width = distance(point(33), point(263)) * u_size;
  vec2 extent = vec2(width, width * u_aspect * (1.0 + u_wide[eye])) * 0.5;
  float outward = eye == 0 ? -1.0 : 1.0;
  vec2 center = (a + b) * 0.5 + (xAxis * u_offset.x * outward + yAxis * u_offset.y) * width;

  vec2 c = CORNERS[gl_VertexID];
  vec2 p = center + xAxis * c.x * extent.x + yAxis * c.y * extent.y;

  v_local = c;
  v_eye = eye;
  gl_Position = vec4(p / u_resolution * 2.0 - 1.0, 0.0, 1.0);
}`;
