import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { FaceCamera } from "../../camera/FaceCamera";
import { VIDEO_CONSTRAINTS } from "../../config/camera";
import { ZOOM } from "../../config/zoom";
import type { Pass } from "../../gl/types";
import { useFaceLandmarker } from "../../hooks/useFaceLandmarker";
import { useKeyPress } from "../../hooks/useKeyPress";
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
  const [camera] = useState(() => new FaceCamera());

  useKeyPress(
    ZOOM.key,
    useCallback(() => camera.toggle(), [camera]),
  );
  useRenderLoop(canvasRef, webcamRef, landmarker, passes, camera);

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
