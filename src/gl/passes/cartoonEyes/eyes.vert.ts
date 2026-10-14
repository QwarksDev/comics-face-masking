import { FACE_FRAME_GLSL } from "../shared/faceFrame.glsl";

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
uniform float u_depth;
uniform int u_front;

out vec2 v_local;
flat out int v_eye;

const ivec2 EYE_CORNERS[2] = ivec2[2](ivec2(33, 133), ivec2(362, 263));

const vec2 CORNERS[6] = vec2[6](
  vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
  vec2(-1.0,  1.0), vec2(1.0, -1.0), vec2(1.0,  1.0)
);

${FACE_FRAME_GLSL}
void main() {
  int eye = gl_InstanceID == 0 ? 1 - u_front : u_front;
  FaceFrame f = faceFrame();
  float width = mix(f.span, f.screenSpan, u_foreshortening) * u_size;

  float outward = eye == 0 ? -1.0 : 1.0;
  vec3 center = (point(EYE_CORNERS[eye].x) + point(EYE_CORNERS[eye].y)) * 0.5
    + (f.x * u_offset.x * outward + f.y * u_offset.y) * width
    + f.forward * u_depth * f.span;

  vec2 extent = vec2(width, width * u_aspect * (1.0 + u_wide[eye])) * 0.5;
  vec2 c = CORNERS[gl_VertexID];
  vec2 p = center.xy + f.screenX * c.x * extent.x + f.screenY * c.y * extent.y;

  v_local = c;
  v_eye = eye;
  gl_Position = vec4(p / u_resolution * 2.0 - 1.0, 0.0, 1.0);
}`;
