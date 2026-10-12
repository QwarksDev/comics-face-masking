export const PASS_HEADER = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_input;
uniform sampler2D u_video;
uniform sampler2D u_landmarks;
uniform int u_faceCount;
uniform int u_faceSlots;
uniform vec2 u_resolution;
uniform float u_time;

vec4 video(vec2 uv) { return texture(u_video, vec2(uv.x, 1.0 - uv.y)); }

bool faceActive(int face) {
  return texelFetch(u_landmarks, ivec2(0, face), 0).w > 0.0;
}

vec3 landmark(int i, int face) {
  vec4 l = texelFetch(u_landmarks, ivec2(i, face), 0);
  return vec3(l.x, 1.0 - l.y, l.z);
}
`;
