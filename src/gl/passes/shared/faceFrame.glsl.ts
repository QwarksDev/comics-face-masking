export const FACE_FRAME_GLSL = /* glsl */ `
vec3 point(int i) {
  vec4 l = texelFetch(u_landmarks, ivec2(i, u_face), 0);
  return vec3(l.x, 1.0 - l.y, l.z) * u_resolution.xyx;
}

vec3 safeNormalize(vec3 v, vec3 fallback) {
  float len = length(v);
  return len > 1e-4 ? v / len : fallback;
}

struct FaceFrame {
  vec3 x;
  vec3 y;
  vec3 forward;
  float span;
  float screenSpan;
  vec2 screenX;
  vec2 screenY;
};

FaceFrame faceFrame() {
  FaceFrame f;
  vec3 across = point(263) - point(33);
  vec3 up = point(10) - point(152);
  f.span = length(across);
  f.screenSpan = length(across.xy);
  f.x = safeNormalize(across, vec3(1.0, 0.0, 0.0));
  f.y = safeNormalize(up - f.x * dot(up, f.x), vec3(0.0, 1.0, 0.0));
  f.forward = cross(f.x, f.y);
  if (f.forward.z > 0.0) f.forward = -f.forward;
  f.screenX = f.screenSpan > 1e-4 ? across.xy / f.screenSpan : vec2(1.0, 0.0);
  f.screenY = vec2(-f.screenX.y, f.screenX.x);
  if (dot(f.screenY, up.xy) < 0.0) f.screenY = -f.screenY;
  return f;
}
`;
