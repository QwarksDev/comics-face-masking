import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { createProgram } from "./core/program";
import type { RenderTarget } from "./core/target";
import { UNIT } from "./core/units";
import { LandmarkTexture } from "./resources/LandmarkTexture";
import { TargetPool } from "./resources/TargetPool";
import { VideoTexture } from "./resources/VideoTexture";
import { COPY_VIDEO_FS } from "./shaders/copyVideo.frag";
import { FULLSCREEN_VS } from "./shaders/fullscreen.vert";
import type { Draw, Frame, Pass } from "./types";

function createContext(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
  });
  if (!gl) throw new Error("WebGL2 not supported");
  return gl;
}

export class Renderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly video: VideoTexture;
  private readonly landmarks: LandmarkTexture;
  private readonly targets: TargetPool;
  private readonly compiled = new Map<Pass, Draw>();
  private readonly emptyVao: WebGLVertexArrayObject | null;
  private readonly copyProgram: WebGLProgram;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = (this.gl = createContext(canvas));
    this.video = new VideoTexture(gl);
    this.landmarks = new LandmarkTexture(gl);
    this.targets = new TargetPool(gl);
    this.emptyVao = gl.createVertexArray();
    this.copyProgram = createProgram(gl, FULLSCREEN_VS, COPY_VIDEO_FS);
    gl.useProgram(this.copyProgram);
    gl.uniform1i(
      gl.getUniformLocation(this.copyProgram, "u_video"),
      UNIT.video,
    );
  }

  setFaces(faces: NormalizedLandmark[][]) {
    this.landmarks.update(faces);
  }

  render(source: HTMLVideoElement, passes: readonly Pass[], time: number) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + UNIT.video);
    if (!this.video.upload(source)) return;
    const { width, height } = this.video;
    this.resize(width, height);

    gl.activeTexture(gl.TEXTURE0 + UNIT.landmarks);
    gl.bindTexture(gl.TEXTURE_2D, this.landmarks.texture);
    gl.viewport(0, 0, width, height);
    gl.bindVertexArray(this.emptyVao);

    let [src, dst] = this.targets.pingPong();
    gl.bindFramebuffer(gl.FRAMEBUFFER, src.framebuffer);
    gl.useProgram(this.copyProgram);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const frame: Frame = {
      resolution: [width, height],
      time,
      faceCount: this.landmarks.faceCount,
      input: null,
      output: src.framebuffer,
    };

    for (const pass of passes) {
      if (pass.enabled === false) continue;
      if (pass.overlay) {
        this.drawOverlay(pass, frame, src);
      } else {
        this.drawEffect(pass, frame, src, dst);
        [src, dst] = [dst, src];
      }
      gl.bindVertexArray(this.emptyVao);
    }

    this.present(src);
  }

  dispose() {
    this.video.dispose();
    this.landmarks.dispose();
    this.targets.dispose();
    this.gl.deleteProgram(this.copyProgram);
    this.gl.deleteVertexArray(this.emptyVao);
  }

  private resize(width: number, height: number) {
    if (this.canvas.width !== width) this.canvas.width = width;
    if (this.canvas.height !== height) this.canvas.height = height;
    this.targets.resize(width, height);
  }

  private drawEffect(
    pass: Pass,
    frame: Frame,
    src: RenderTarget,
    dst: RenderTarget,
  ) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + UNIT.input);
    gl.bindTexture(gl.TEXTURE_2D, src.texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.framebuffer);
    frame.input = src.texture;
    frame.output = dst.framebuffer;
    this.compile(pass)(frame);
  }

  private drawOverlay(pass: Pass, frame: Frame, target: RenderTarget) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + UNIT.input);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    frame.input = null;
    frame.output = target.framebuffer;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    this.compile(pass)(frame);
    gl.disable(gl.BLEND);
  }

  private present(target: RenderTarget) {
    const gl = this.gl;
    const { width, height } = target;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, target.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(
      0,
      0,
      width,
      height,
      0,
      0,
      width,
      height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private compile(pass: Pass): Draw {
    let draw = this.compiled.get(pass);
    if (!draw) {
      draw = pass.create(this.gl);
      this.compiled.set(pass, draw);
    }
    return draw;
  }
}
