import { boxDistance, type FaceBox } from "./faceBox";

export function matchFaces(
  detections: readonly FaceBox[],
  tracks: readonly (FaceBox | null)[],
  maxDistance: number,
): number[] {
  let bestCost = Infinity;
  let best: number[] = [];
  const current: number[] = [];
  const used = new Set<number>();

  const search = (d: number, cost: number) => {
    if (cost >= bestCost) return;
    if (d === detections.length) {
      bestCost = cost;
      best = [...current];
      return;
    }
    current[d] = -1;
    search(d + 1, cost + maxDistance);

    tracks.forEach((track, slot) => {
      if (!track || used.has(slot)) return;
      const distance = boxDistance(detections[d], track);
      if (distance >= maxDistance) return;
      used.add(slot);
      current[d] = slot;
      search(d + 1, cost + distance);
      used.delete(slot);
    });
  };

  search(0, 0);
  return best;
}
