import { DrawingUtils, FaceLandmarker } from "@mediapipe/tasks-vision";
import { type RefObject, useEffect } from "react";
import type Webcam from "react-webcam";

const IRISES = [
  ...FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
  ...FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
];

export function useRenderLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  webcamRef: RefObject<Webcam | null>,
  landmarker: FaceLandmarker | null,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !landmarker) return;

    const drawing = new DrawingUtils(ctx);
    let lastVideoTime = -1;
    let rafId = 0;

    const tick = () => {
      const video = webcamRef.current?.video;
      if (
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.currentTime !== lastVideoTime
      ) {
        lastVideoTime = video.currentTime;
        if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
        if (canvas.height !== video.videoHeight)
          canvas.height = video.videoHeight;

        const { faceLandmarks } = landmarker.detectForVideo(
          video,
          performance.now(),
        );
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const landmarks of faceLandmarks) {
          drawing.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_CONTOURS,
            { color: "#00FF88", lineWidth: 2 },
          );
          drawing.drawConnectors(landmarks, IRISES, {
            color: "#FF3366",
            lineWidth: 2,
          });
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [canvasRef, webcamRef, landmarker]);
}
