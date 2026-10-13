import { useRef } from "react";
import Webcam from "react-webcam";
import { VIDEO_CONSTRAINTS } from "../../config/camera";
import type { Pass } from "../../gl/types";
import { useFaceLandmarker } from "../../hooks/useFaceLandmarker";
import { useRenderLoop } from "../../hooks/useRenderLoop";
import styles from "./EffectsView.module.css";

interface EffectsViewProps {
  passes: readonly Pass[];
  showOriginal?: boolean;
}

export function EffectsView({
  passes,
  showOriginal = false,
}: Readonly<EffectsViewProps>) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarker = useFaceLandmarker();

  useRenderLoop(canvasRef, webcamRef, landmarker, passes);

  return (
    <>
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={VIDEO_CONSTRAINTS}
        className={showOriginal ? styles.originalVideo : styles.hiddenVideo}
      />
      <canvas ref={canvasRef} className={styles.canvas} />
    </>
  );
}
