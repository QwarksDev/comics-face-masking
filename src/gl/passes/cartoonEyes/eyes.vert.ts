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
uniform float u_foreshortening;
uniform int u_front;

out vec2 v_local;
flat out int v_eye;

const ivec2 EYE_CORNERS[2] = ivec2[2](ivec2(33, 133), ivec2(362, 263));

const vec2 CORNERS[6] = vec2[6](
  vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
  vec2(-1.0,  1.0), vec2(1.0, -1.0), vec2(1.0,  1.0)
);

vec3 point(int i) {
  vec4 l = texelFetch(u_landmarks, ivec2(i, u_face), 0);
  return vec3(l.x, 1.0 - l.y, l.z) * u_resolution.xyx;
}

vec3 safeNormalize(vec3 v, vec3 fallback) {
  float len = length(v);
  return len > 1e-4 ? v / len : fallback;
}

void main() {
  int eye = gl_InstanceID == 0 ? 1 - u_front : u_front;
  vec3 across = point(263) - point(33);
  float span = mix(length(across), length(across.xy), u_foreshortening);
  float width = span * u_size;

  vec3 xAxis3 = safeNormalize(across, vec3(1.0, 0.0, 0.0));
  vec3 up = point(10) - point(152);
  vec3 yAxis3 = safeNormalize(up - xAxis3 * dot(up, xAxis3), vec3(0.0, 1.0, 0.0));
  float outward = eye == 0 ? -1.0 : 1.0;
  vec3 center = (point(EYE_CORNERS[eye].x) + point(EYE_CORNERS[eye].y)) * 0.5
    + (xAxis3 * u_offset.x * outward + yAxis3 * u_offset.y) * width;

  vec2 xAxis = length(across.xy) > 1e-4 ? normalize(across.xy) : vec2(1.0, 0.0);
  vec2 yAxis = vec2(-xAxis.y, xAxis.x);
  if (dot(yAxis, up.xy) < 0.0) yAxis = -yAxis;

  vec2 extent = vec2(width, width * u_aspect * (1.0 + u_wide[eye])) * 0.5;
  vec2 c = CORNERS[gl_VertexID];
  vec2 p = center.xy + xAxis * c.x * extent.x + yAxis * c.y * extent.y;

  v_local = c;
  v_eye = eye;
  gl_Position = vec4(p / u_resolution * 2.0 - 1.0, 0.0, 1.0);
}`;
