export const GAUSSIAN_BLUR_FS = /* glsl */ `
uniform vec2 u_dir;
uniform float u_sigma;

float gauss(float x) { return exp(-0.5 * x * x / (u_sigma * u_sigma)); }

void main() {
  int n = min(int(ceil(u_sigma * 3.0)), 64);
  vec4 sum = texture(u_input, v_uv);
  float total = 1.0;
  for (int i = 1; i <= n; i += 2) {
    float w1 = gauss(float(i));
    float w2 = gauss(float(i + 1));
    float w = w1 + w2;
    vec2 offset = u_dir * (float(i) * w1 + float(i + 1) * w2) / w;
    sum += (texture(u_input, v_uv + offset) + texture(u_input, v_uv - offset)) * w;
    total += 2.0 * w;
  }
  outColor = sum / total;
}`;
