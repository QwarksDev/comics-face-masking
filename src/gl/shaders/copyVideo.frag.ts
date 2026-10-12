import { PASS_HEADER } from "./passHeader";

export const COPY_VIDEO_FS = /* glsl */ `${PASS_HEADER}
void main() { outColor = video(v_uv); }`;
