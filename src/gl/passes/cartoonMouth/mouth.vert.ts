export const MOUTH_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_landmarks;
uniform vec2 u_resolution;
uniform int u_face;
uniform float u_size;
uniform vec2 u_offset;
uniform vec4 u_transform;

out vec2 v_local;

const vec2 CORNERS[6] = vec2[6](
  vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
  vec2(-1.0,  1.0), vec2(1.0, -1.0), vec2(1.0,  1.0)
);

vec2 point(int i) {
  vec4 l = texelFetch(u_landmarks, ivec2(i, u_face), 0);
  return vec2(l.x, 1.0 - l.y) * u_resolution;
}

void main() {
  vec2 d = point(263) - point(33);
  float iod = length(d);
  vec2 xAxis = iod > 1e-4 ? d / iod : vec2(1.0, 0.0);
  vec2 yAxis = vec2(-xAxis.y, xAxis.x);
  if (dot(yAxis, point(10) - point(152)) < 0.0) yAxis = -yAxis;

  vec2 c = CORNERS[gl_VertexID];
  vec2 s = c * u_transform.xy;
  float cs = cos(u_transform.z);
  float sn = sin(u_transform.z);
  vec2 local = vec2(s.x * cs - s.y * sn + u_transform.w, s.x * sn + s.y * cs);

  vec2 center = point(2) + (xAxis * u_offset.x + yAxis * u_offset.y) * iod;
  vec2 p = center + (xAxis * local.x + yAxis * local.y) * iod * u_size * 0.5;

  v_local = c;
  gl_Position = vec4(p / u_resolution * 2.0 - 1.0, 0.0, 1.0);
}`;
