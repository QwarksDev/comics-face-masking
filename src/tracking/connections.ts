import { FaceLandmarker } from "@mediapipe/tasks-vision";

export interface Connection {
  start: number;
  end: number;
}

export const FACE_CONTOURS: readonly Connection[] =
  FaceLandmarker.FACE_LANDMARKS_CONTOURS;
export const IRISES: readonly Connection[] = [
  ...FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
  ...FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
];
