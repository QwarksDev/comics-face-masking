import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { FACE_LANDMARKER } from "../config/mediapipe";

export async function createFaceLandmarker(): Promise<FaceLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(FACE_LANDMARKER.wasmUrl);
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: FACE_LANDMARKER.modelUrl, delegate: "GPU" },
    runningMode: "VIDEO",
    numFaces: FACE_LANDMARKER.numFaces,
  });
}
