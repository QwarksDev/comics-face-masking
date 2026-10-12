import { createTexture } from "../../core/texture";

export type Sprite = string | TexImageSource;

function upload(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  source: TexImageSource,
) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
}

export function createSpriteTexture(
  gl: WebGL2RenderingContext,
  source: Sprite,
  placeholder?: () => TexImageSource,
): WebGLTexture {
  const texture = createTexture(gl);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  );
  if (typeof source !== "string") {
    upload(gl, texture, source);
    return texture;
  }
  if (placeholder) upload(gl, texture, placeholder());
  else
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(4),
    );
  const image = new Image();
  image.onload = () => upload(gl, texture, image);
  image.src = source;
  return texture;
}
