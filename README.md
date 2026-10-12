# comics-face-masking

Webcam feed with MediaPipe face tracking, rendered through a stack of WebGL2 effects.

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build in dist/
npm run lint
```

## Layout

```
src/
  main.tsx                 entry point
  App.tsx                  page layout
  effects/stack.ts         the effect stack: add, remove, reorder passes here
  config/                  camera constraints, MediaPipe model/runtime URLs
  tracking/                face landmarker setup, connection sets
  hooks/                   useFaceLandmarker, useRenderLoop
  components/EffectsView/  hidden webcam + output canvas
  gl/
    Renderer.ts            runs the pass stack and presents to the canvas
    types.ts               Pass / Frame contracts
    core/                  WebGL helpers (programs, textures, targets, uniforms)
    resources/             video texture, landmark texture, render target pool
    shaders/               shared GLSL (fullscreen triangle, pass header)
    passes/                one folder per effect, GLSL in *.frag.ts / *.vert.ts
```

## Writing a pass

A `Pass` has `create(gl)` returning a `draw(frame)` function, compiled once.

- Regular passes read `frame.input` and draw into `frame.output`.
- `overlay: true` passes blend directly onto the current image (no input).

The quickest way is `shaderPass(glsl, uniforms)`; see `shaders/passHeader.ts` for
what's in scope (`u_input`, `video(uv)`, `landmark(i, face)`, `u_time`, ...).
