import { TRACKING } from "./tracking";

export const FACE_LANDMARKER = {
  wasmUrl: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm",
  modelUrl:
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  numFaces: TRACKING.maxFaces,
} as const;
