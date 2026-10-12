import { createTexture } from "../core/texture";

export class VideoTexture {
  texture: WebGLTexture;
  width = 0;
  height = 0;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.texture = createTexture(gl);
  }

  upload(video: HTMLVideoElement): boolean {
    const gl = this.gl;
    const { videoWidth: width, videoHeight: height } = video;
    if (!width || !height) return false;

    if (width !== this.width || height !== this.height) {
      gl.deleteTexture(this.texture);
      this.texture = createTexture(gl);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);
      this.width = width;
      this.height = height;
    }

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
    return true;
  }

  dispose() {
    this.gl.deleteTexture(this.texture);
  }
}
