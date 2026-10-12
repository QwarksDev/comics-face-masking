import { useRef } from "react";
import Webcam from "react-webcam";
import { VIDEO_CONSTRAINTS } from "../../config/camera";
import { useFaceLandmarker } from "../../hooks/useFaceLandmarker";
import { useRenderLoop } from "../../hooks/useRenderLoop";
import styles from "./EffectsView.module.css";

export function EffectsView() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarker = useFaceLandmarker();

  useRenderLoop(canvasRef, webcamRef, landmarker);

  return (
    <div className={styles.stage}>
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={VIDEO_CONSTRAINTS}
        className={styles.video}
      />
      <canvas ref={canvasRef} className={styles.overlay} />
    </div>
  );
}
