import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { FaceCamera } from "../../camera/FaceCamera";
import { ZOOM } from "../../config/zoom";
import type { Pass } from "../../gl/types";
import { useFaceLandmarker } from "../../hooks/useFaceLandmarker";
import { useKeyPress } from "../../hooks/useKeyPress";
import { useRemoteCommand } from "../../hooks/useRemoteCommand";
import { useRenderLoop } from "../../hooks/useRenderLoop";
import { useVideoConstraints } from "../../hooks/useVideoConstraints";
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
  const { constraints, error } = useVideoConstraints();
  const [mediaError, setMediaError] = useState<string | null>(null);

  useKeyPress(
    ZOOM.key,
    useCallback(() => camera.toggle(), [camera]),
  );
  useRemoteCommand(
    useCallback(
      (command) => {
        if (command.type === "zoom") camera.toggle();
      },
      [camera],
    ),
  );
  useRenderLoop(canvasRef, webcamRef, landmarker, passes, camera);

  return (
    <>
      {constraints && (
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={constraints}
          onUserMediaError={(err) =>
            setMediaError(`Webcam unavailable: ${String(err)}`)
          }
          className={showOriginal ? styles.originalVideo : styles.hiddenVideo}
        />
      )}
      {(error ?? mediaError) && (
        <p className={styles.error}>{error ?? mediaError}</p>
      )}
      <canvas ref={canvasRef} className={styles.canvas} />
    </>
  );
}
