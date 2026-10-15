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
  hooks/                   useFaceLandmarker, useRenderLoop, useRemoteCommand
  remote/protocol.ts       remote control commands shared by server and page
  remote/sync.ts           settings sync between the control page and outputs
  components/EffectsView/  hidden webcam + output canvas
  components/ControlPage/  ?control page driving the OBS output
  gl/
    Renderer.ts            runs the pass stack and presents to the canvas
    types.ts               Pass / Frame contracts
    core/                  WebGL helpers (programs, textures, targets, uniforms)
    resources/             video texture, landmark texture, render target pool
    shaders/               shared GLSL (fullscreen triangle, pass header)
    passes/                one folder per effect, GLSL in *.frag.ts / *.vert.ts
plugins/
  remoteControl.ts         dev-server endpoint relaying remote commands to the page
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

## Using it as a webcam (OBS)

Open the page with `?output` for a clean feed: transparent background, canvas
fitted to the window (combine with `?debug` if needed).

1. Run `npm run dev`.
2. Launch OBS with media access so browser sources can use the webcam:
   `open -a OBS --args --enable-media-stream`.
3. Add a **Browser Source** with URL `http://localhost:5173/?output`, size
   1920×1080. Prefer it over capturing a Chrome window, which throttles
   rendering when hidden.
4. Click **Start Virtual Camera**; other apps can now pick _OBS Virtual Camera_.

### Control page

OBS browser sources are awkward to interact with, so open
`http://localhost:5173/?control` in a regular browser next to OBS. It shows the
debug panel full-page, without the webcam, and every change is sent live to all
open output pages (the OBS source included):

- presets, toggles and parameters apply immediately in OBS;
- **Toggle zoom** zooms on the face;
- opening the control page pulls the current settings from OBS, and reloading
  the OBS source pulls them back from the control page.

Like remote control, this needs `npm run dev`.

## Remote control (Stream Deck)

The dev server accepts GET requests that are forwarded to every open copy of
the page, OBS browser source included:

| URL (`http://localhost:5173/remote/…`) | Effect                                   |
| -------------------------------------- | ---------------------------------------- |
| `zoom`                                 | toggle zoom on the face (same as `Z`)    |
| `preset/<name>`                        | apply a preset, e.g. `preset/round-eyes` |
| `next-preset` / `previous-preset`      | cycle through presets                    |

On a Stream Deck, use **System → Website** with one of these URLs and tick
**GET request in background**. Only available with `npm run dev`, not with
`vite preview` or a production build.

## Writing a pass

A `Pass` has `create(gl)` returning a `draw(frame)` function, compiled once.

- Regular passes read `frame.input` and draw into `frame.output`.
- `overlay: true` passes blend directly onto the current image (no input).
- Multi-step passes can use `frame.scratch(key, scale)` for intermediate targets.

The quickest way is `shaderPass(glsl, uniforms)`; see `shaders/passHeader.ts` for
what's in scope (`u_input`, `video(uv)`, `landmark(i, face)`, `u_time`, ...).
