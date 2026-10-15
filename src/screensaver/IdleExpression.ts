import { SCREENSAVER } from "../config/screensaver";
import type { Vec2 } from "../gl/types";
import { BLENDSHAPE, BLENDSHAPES } from "../tracking/detection";

export type Mood = "searching" | "surprised" | "happy";

function randomBetween([min, max]: readonly [number, number]) {
  return min + Math.random() * (max - min);
}

function randomGaze(): Vec2 {
  const [rangeX, rangeY] = SCREENSAVER.lookRange;
  return [randomBetween([-rangeX, rangeX]), randomBetween([-rangeY, rangeY])];
}

function setGaze(b: Float32Array, [x, y]: Vec2) {
  const right = Math.max(x, 0);
  const left = Math.max(-x, 0);
  const up = Math.max(y, 0);
  const down = Math.max(-y, 0);
  b[BLENDSHAPE.eyeLookInRight] = right;
  b[BLENDSHAPE.eyeLookOutLeft] = right;
  b[BLENDSHAPE.eyeLookOutRight] = left;
  b[BLENDSHAPE.eyeLookInLeft] = left;
  b[BLENDSHAPE.eyeLookUpRight] = up;
  b[BLENDSHAPE.eyeLookUpLeft] = up;
  b[BLENDSHAPE.eyeLookDownRight] = down;
  b[BLENDSHAPE.eyeLookDownLeft] = down;
}

function setBlink(b: Float32Array, amount: number) {
  b[BLENDSHAPE.eyeBlinkRight] = amount;
  b[BLENDSHAPE.eyeBlinkLeft] = amount;
}

function setMood(b: Float32Array, mood: Mood) {
  switch (mood) {
    case "searching":
      b[BLENDSHAPE.mouthSmileLeft] = 1;
      b[BLENDSHAPE.mouthSmileRight] = 1;
      break;
    case "surprised":
      b[BLENDSHAPE.mouthFunnel] = 1;
      b[BLENDSHAPE.eyeWideLeft] = 1;
      b[BLENDSHAPE.eyeWideRight] = 1;
      break;
    case "happy":
      b[BLENDSHAPE.mouthSmileLeft] = 1;
      b[BLENDSHAPE.mouthSmileRight] = 1;
      b[BLENDSHAPE.jawOpen] = 1;
      b[BLENDSHAPE.eyeSquintLeft] = 0.5;
      b[BLENDSHAPE.eyeSquintRight] = 0.5;
      break;
  }
}

export class IdleExpression {
  private readonly blendshapes = new Float32Array(BLENDSHAPES.length);
  private gaze: Vec2 = [0, 0];
  private nextLook: number;
  private nextBlink: number;
  private blinkStart = -Infinity;

  constructor(time: number) {
    this.nextLook = time + randomBetween(SCREENSAVER.lookInterval);
    this.nextBlink = time + randomBetween(SCREENSAVER.blinkInterval);
  }

  update(time: number, mood: Mood, lookAt: Vec2 | null): Float32Array {
    if (time >= this.nextLook) {
      this.gaze = randomGaze();
      this.nextLook = time + randomBetween(SCREENSAVER.lookInterval);
    }
    if (time >= this.nextBlink) {
      this.blinkStart = time;
      this.nextBlink = time + randomBetween(SCREENSAVER.blinkInterval);
    }

    const b = this.blendshapes;
    b.fill(0);
    setGaze(b, lookAt ?? this.gaze);
    setBlink(b, time - this.blinkStart < SCREENSAVER.blinkSeconds ? 1 : 0);
    setMood(b, mood);
    return b;
  }
}
