export const MOUTH_POSES = [
  "neutral",
  "smile",
  "grin",
  "open",
  "o",
  "frown",
  "smirk",
] as const;

export type MouthPose = (typeof MOUTH_POSES)[number];

export interface MouthSignals {
  open: number;
  smile: number;
  smirk: number;
  frown: number;
  round: number;
}

export function choosePose(s: MouthSignals): MouthPose {
  if (s.round > 0.4 && s.smile < 0.3) return "o";
  if (s.open > 0.12) return s.smile > 0.35 ? "grin" : "open";
  if (Math.abs(s.smirk) > Math.max(0.15, s.smile * 0.6)) return "smirk";
  if (s.smile > 0.3) return "smile";
  if (s.frown > 0.12) return "frown";
  return "neutral";
}
