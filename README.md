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
  effects/config.ts        live pass settings and presets from config/effects/
  config/                  camera constraints, MediaPipe model/runtime URLs
  config/effects/          effect presets (default.json + any others)
  debug/schema.ts          debug panel controls (ranges/steps per setting)
  tracking/                face landmarker setup, stable face slots (FaceTracker), connection sets
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

## Tuning settings

Pass settings live in `src/config/effects/`. Every `*.json` file there is a
preset named after the file; `default.json` is loaded at startup. Press `D` (or
open the page with `?debug`) to show the debug panel:

- **Preset** switches between the files; editing anything switches it to _Custom_.
- Every pass can be toggled and all of its parameters edited live; the ↺ button
  next to a setting restores its `default.json` value.
- **Export** downloads the current settings (`<preset>.json` or `custom.json`);
  drop the file into `src/config/effects/` to add or update a preset.
- **Copy** puts the same JSON on the clipboard, **Import** loads a file,
  **Reset** reverts everything to `default.json`.

A preset file only needs the values it changes; anything missing falls back to
the pass's built-in defaults.

## Writing a pass

A `Pass` has `create(gl)` returning a `draw(frame)` function, compiled once.

- Regular passes read `frame.input` and draw into `frame.output`.
- `overlay: true` passes blend directly onto the current image (no input).
- Multi-step passes can use `frame.scratch(key, scale)` for intermediate targets.

The quickest way is `shaderPass(glsl, uniforms)`; see `shaders/passHeader.ts` for
what's in scope (`u_input`, `video(uv)`, `landmark(i, face)`, `u_time`, ...).
