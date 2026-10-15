import { type FaceBox, faceBox } from "./faceBox";
import { matchFaces } from "./matchFaces";
import type { Detection } from "./detection";

export interface TrackedFace extends Detection {
  held: boolean;
  idle: boolean;
}

interface Track extends TrackedFace {
  box: FaceBox;
  lastSeen: number;
}

export interface FaceTrackerOptions {
  slots: number;
  graceMs: number;
  maxMatchDistance: number;
}

export class FaceTracker {
  private readonly tracks: (Track | null)[];

  constructor(private readonly options: FaceTrackerOptions) {
    this.tracks = new Array<Track | null>(options.slots).fill(null);
  }

  get slots(): readonly (TrackedFace | null)[] {
    return this.tracks;
  }

  update(detections: readonly Detection[], now: number) {
    const boxes = detections.map((d) => faceBox(d.landmarks));
    const assignment = matchFaces(
      boxes,
      this.tracks.map((t) => t?.box ?? null),
      this.options.maxMatchDistance,
    );

    const seen = new Set<number>();
    assignment.forEach((slot, d) => {
      if (slot < 0) return;
      this.tracks[slot] = this.track(detections[d], boxes[d], now);
      seen.add(slot);
    });

    this.tracks.forEach((track, slot) => {
      if (!track || seen.has(slot)) return;
      if (now - track.lastSeen > this.options.graceMs) this.tracks[slot] = null;
      else track.held = true;
    });

    assignment.forEach((slot, d) => {
      if (slot >= 0) return;
      const free = this.freeSlot(seen);
      if (free < 0) return;
      this.tracks[free] = this.track(detections[d], boxes[d], now);
      seen.add(free);
    });

    return this.slots;
  }

  private track(detection: Detection, box: FaceBox, now: number): Track {
    return { ...detection, box, lastSeen: now, held: false, idle: false };
  }

  private freeSlot(seen: ReadonlySet<number>): number {
    const empty = this.tracks.indexOf(null);
    if (empty >= 0) return empty;
    let oldest = -1;
    let oldestSeen = Infinity;
    this.tracks.forEach((track, slot) => {
      if (!track || seen.has(slot) || track.lastSeen >= oldestSeen) return;
      oldest = slot;
      oldestSeen = track.lastSeen;
    });
    return oldest;
  }
}
