export interface CameraLookup {
  camera: MediaDeviceInfo | null;
  available: string[];
}

async function videoInputs() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "videoinput");
}

async function labelledVideoInputs() {
  const cameras = await videoInputs();
  if (cameras.some((camera) => camera.label)) return cameras;
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  stream.getTracks().forEach((track) => track.stop());
  return videoInputs();
}

export async function findCamera(name: string): Promise<CameraLookup> {
  const cameras = await labelledVideoInputs();
  const query = name.toLowerCase();
  return {
    camera:
      cameras.find((camera) => camera.label.toLowerCase().includes(query)) ??
      null,
    available: cameras.map((camera) => camera.label),
  };
}
