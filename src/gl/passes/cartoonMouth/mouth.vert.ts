import { FACE_FRAME_GLSL } from "../shared/faceFrame.glsl";

export const MOUTH_VS = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D u_landmarks;
uniform vec2 u_resolution;
uniform int u_face;
uniform float u_size;
uniform vec2 u_offset;
uniform vec4 u_transform;
uniform float u_foreshortening;
uniform float u_depth;

out vec2 v_local;

const vec2 CORNERS[6] = vec2[6](
  vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
  vec2(-1.0,  1.0), vec2(1.0, -1.0), vec2(1.0,  1.0)
);

${FACE_FRAME_GLSL}
void main() {
  FaceFrame f = faceFrame();
  float iod = mix(f.span, f.screenSpan, u_foreshortening);

  vec2 c = CORNERS[gl_VertexID];
  vec2 s = c * u_transform.xy;
  float cs = cos(u_transform.z);
  float sn = sin(u_transform.z);
  vec2 local = vec2(s.x * cs - s.y * sn + u_transform.w, s.x * sn + s.y * cs);

  vec3 center = point(2)
    + (f.x * u_offset.x + f.y * u_offset.y) * iod
    + f.forward * u_depth * f.span;
  vec2 p = center.xy + (f.screenX * local.x + f.screenY * local.y) * iod * u_size * 0.5;

  v_local = c;
  gl_Position = vec4(p / u_resolution * 2.0 - 1.0, 0.0, 1.0);
}`;
