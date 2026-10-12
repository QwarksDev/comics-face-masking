import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { useEffect, useState } from "react";
import { createFaceLandmarker } from "../tracking/createFaceLandmarker";

export function useFaceLandmarker(): FaceLandmarker | null {
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);

  useEffect(() => {
    let cancelled = false;
    let instance: FaceLandmarker | null = null;

    createFaceLandmarker()
      .then((created) => {
        if (cancelled) {
          created.close();
          return;
        }
        instance = created;
        setLandmarker(created);
      })
      .catch((err) => console.error("Failed to init FaceLandmarker", err));

    return () => {
      cancelled = true;
      instance?.close();
    };
  }, []);

  return landmarker;
}
