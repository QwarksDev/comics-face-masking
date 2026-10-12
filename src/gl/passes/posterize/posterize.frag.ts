export const POSTERIZE_FS = /* glsl */ `
uniform float u_levels;

void main() {
  vec3 c = texture(u_input, v_uv).rgb;
  outColor = vec4(floor(c * u_levels + 0.5) / u_levels, 1.0);
}`;
