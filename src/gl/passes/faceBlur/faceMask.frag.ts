export const MAX_POLY = 64;

export const FACE_MASK_FS = /* glsl */ `
#define MAX_POLY ${MAX_POLY}
uniform sampler2D u_blurred;
uniform int u_poly[MAX_POLY];
uniform int u_polyCount;
uniform float u_padding;
uniform float u_feather;

float segmentDist2(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  vec2 d = pa - ba * h;
  return dot(d, d);
}

float faceMask(vec2 p, int face) {
  float d2 = 1e20;
  bool inside = false;
  vec2 prev = landmark(u_poly[u_polyCount - 1], face).xy * u_resolution;
  for (int i = 0; i < u_polyCount; i++) {
    vec2 cur = landmark(u_poly[i], face).xy * u_resolution;
    d2 = min(d2, segmentDist2(p, prev, cur));
    if ((cur.y > p.y) != (prev.y > p.y) &&
        p.x < (prev.x - cur.x) * (p.y - cur.y) / (prev.y - cur.y) + cur.x) {
      inside = !inside;
    }
    prev = cur;
  }
  float sd = inside ? -sqrt(d2) : sqrt(d2);

  float size = distance(landmark(10, face).xy * u_resolution, landmark(152, face).xy * u_resolution);
  float pad = u_padding * size;
  return 1.0 - smoothstep(pad, pad + max(u_feather * size, 1.0), sd);
}

void main() {
  vec2 p = v_uv * u_resolution;
  float mask = u_faceCount == 0 ? 1.0 : 0.0;
  for (int f = 0; f < u_faceSlots; f++) {
    if (faceActive(f)) mask = max(mask, faceMask(p, f));
  }
  vec4 base = texture(u_input, v_uv);
  outColor = mask > 0.0 ? mix(base, texture(u_blurred, v_uv), mask) : base;
}`;
