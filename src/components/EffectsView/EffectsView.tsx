import Webcam from "react-webcam";
import { VIDEO_CONSTRAINTS } from "../../config/camera";
import styles from "./EffectsView.module.css";

export function EffectsView() {
  return (
    <Webcam
      audio={false}
      videoConstraints={VIDEO_CONSTRAINTS}
      className={styles.video}
    />
  );
}
