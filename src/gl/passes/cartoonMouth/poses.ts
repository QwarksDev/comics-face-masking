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

export interface PoseThresholds {
  round: number;
  roundMaxSmile: number;
  open: number;
  grinSmile: number;
  smirk: number;
  smirkSmileRatio: number;
  smile: number;
  frown: number;
}

export const POSE_THRESHOLD_DEFAULTS: PoseThresholds = {
  round: 0.4,
  roundMaxSmile: 0.3,
  open: 0.12,
  grinSmile: 0.35,
  smirk: 0.15,
  smirkSmileRatio: 0.6,
  smile: 0.3,
  frown: 0.12,
};

export function choosePose(s: MouthSignals, t: PoseThresholds): MouthPose {
  if (s.round > t.round && s.smile < t.roundMaxSmile) return "o";
  if (s.open > t.open) return s.smile > t.grinSmile ? "grin" : "open";
  if (Math.abs(s.smirk) > Math.max(t.smirk, s.smile * t.smirkSmileRatio))
    return "smirk";
  if (s.smile > t.smile) return "smile";
  if (s.frown > t.frown) return "frown";
  return "neutral";
}
