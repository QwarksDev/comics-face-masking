export const PRESENT_FS = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_input;
uniform vec4 u_view;

void main() { outColor = texture(u_input, u_view.xy + v_uv * u_view.zw); }`;
