export const EYES_FS = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_local;
flat in int v_eye;

uniform sampler2D u_sclera;
uniform sampler2D u_pupil;
uniform sampler2D u_outline;
uniform sampler2D u_closed;
uniform vec2 u_open;
uniform vec2 u_squint;
uniform vec2 u_gaze;
uniform vec2 u_gazeRange;
uniform vec2 u_pupilSize;
uniform float u_closedLid;
uniform float u_lidCurve;
uniform float u_squintLid;
uniform float u_lowerLidCurve;
uniform float u_lidWidth;
uniform vec4 u_lidColor;
uniform float u_shutBlend;
uniform bool u_mirror;

out vec4 outColor;

vec4 sprite(sampler2D s, vec2 p) {
  vec4 c = texture(s, vec2(p.x, -p.y) * 0.5 + 0.5);
  return all(lessThanEqual(abs(p), vec2(1.0))) ? c : vec4(0.0);
}

vec4 over(vec4 dst, vec4 src) { return src + dst * (1.0 - src.a); }

float upperLid(float x, float open) {
  return mix(u_closedLid, 1.0, open) - u_lidCurve * x * x * (1.0 - open);
}

float lowerLid(float x, float squint, float upper) {
  return min(mix(-1.0, u_squintLid, squint) + u_lowerLidCurve * squint * (1.0 - x * x), upper);
}

float lidLine(float y, float lid, float aa) {
  return 1.0 - smoothstep(u_lidWidth - aa, u_lidWidth + aa, abs(y - lid));
}

void main() {
  vec2 p = v_local;
  vec2 flip = vec2(u_mirror && v_eye == 0 ? 1.0 : -1.0, 1.0);

  vec4 sclera = sprite(u_sclera, p * flip);
  vec4 pupil = sprite(u_pupil, (p - u_gaze * u_gazeRange) * flip / u_pupilSize);
  vec4 outline = sprite(u_outline, p * flip);
  vec4 closed = sprite(u_closed, p * flip);

  float open = u_open[v_eye];
  float squint = u_squint[v_eye];
  float upper = upperLid(p.x, open);
  float lower = lowerLid(p.x, squint, upper);
  float aa = fwidth(p.y);

  vec4 color = over(sclera, pupil * sclera.a);
  color = over(color, outline);
  color *= smoothstep(upper + aa, upper - aa, p.y) * smoothstep(lower - aa, lower + aa, p.y);

  float inside = max(sclera.a, outline.a);
  float line = lidLine(p.y, upper, aa) * (1.0 - smoothstep(0.95, 1.0, open));
  line = max(line, lidLine(p.y, lower, aa) * smoothstep(0.0, 0.05, squint));
  color = over(color, vec4(u_lidColor.rgb * u_lidColor.a, u_lidColor.a) * line * inside);

  float centerUpper = upperLid(0.0, open);
  float gap = centerUpper - lowerLid(0.0, squint, centerUpper);
  float shut = 1.0 - smoothstep(0.0, u_shutBlend, min(open, gap));
  color = mix(color, closed, shut);

  outColor = color.a > 0.0 ? vec4(color.rgb / color.a, color.a) : vec4(0.0);
}`;
