import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { type RefObject, useEffect } from "react";
import type Webcam from "react-webcam";
import { TRACKING } from "../config/tracking";
import { Renderer } from "../gl/Renderer";
import type { Pass } from "../gl/types";
import { toDetections } from "../tracking/detection";
import { FaceTracker } from "../tracking/FaceTracker";

export function useRenderLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  webcamRef: RefObject<Webcam | null>,
  landmarker: FaceLandmarker | null,
  passes: readonly Pass[],
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarker) return;

    const renderer = new Renderer(canvas);
    const tracker = new FaceTracker({
      slots: TRACKING.maxFaces,
      graceMs: TRACKING.graceMs,
      maxMatchDistance: TRACKING.maxMatchDistance,
    });
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
        const now = performance.now();
        const result = landmarker.detectForVideo(video, now);
        renderer.setFaces(tracker.update(toDetections(result), now));
        renderer.render(video, passes, now / 1000);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
    };
  }, [canvasRef, webcamRef, landmarker, passes]);
}
