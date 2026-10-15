import { useEffect, useState } from "react";
import { findCamera } from "../camera/findCamera";
import { VIDEO_CONSTRAINTS } from "../config/camera";
import { queryParam } from "../utils/dom";

const CAMERA_NAME = queryParam("camera");

interface VideoConstraintsState {
  constraints: MediaTrackConstraints | null;
  error: string | null;
}

const LOOKING_UP: VideoConstraintsState = { constraints: null, error: null };
const DEFAULT: VideoConstraintsState = {
  constraints: VIDEO_CONSTRAINTS,
  error: null,
};

function forDevice(deviceId: string): MediaTrackConstraints {
  return {
    ...VIDEO_CONSTRAINTS,
    facingMode: undefined,
    deviceId: { exact: deviceId },
  };
}

export function useVideoConstraints(): VideoConstraintsState {
  const [state, setState] = useState(CAMERA_NAME ? LOOKING_UP : DEFAULT);

  useEffect(() => {
    if (!CAMERA_NAME) return;
    let cancelled = false;

    findCamera(CAMERA_NAME)
      .then(({ camera, available }) => {
        if (cancelled) return;
        setState(
          camera
            ? { constraints: forDevice(camera.deviceId), error: null }
            : {
                constraints: null,
                error: `No camera matching "${CAMERA_NAME}". Available: ${available.join(", ") || "none"}`,
              },
        );
      })
      .catch((err: Error) => {
        if (!cancelled)
          setState({
            constraints: null,
            error: `Camera lookup failed: ${err.message}`,
          });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
