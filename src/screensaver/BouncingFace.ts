import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { SCREENSAVER } from "../config/screensaver";
import type { Vec2 } from "../gl/types";
import type { TrackedFace } from "../tracking/FaceTracker";
import { randomBetween, randomSign } from "../utils/random";
import { type FaceTemplate, frontalize } from "./frontalize";
import { IdleExpression } from "./IdleExpression";

interface LastFace {
  slot: number;
  landmarks: readonly NormalizedLandmark[];
}

interface Bounce {
  template: FaceTemplate;
  position: Vec2;
  velocity: Vec2;
  expression: IdleExpression;
  happyUntil: number;
}

export class BouncingFace {
  private last: LastFace | null = null;
  private bounce: Bounce | null = null;
  private lastUpdate: number | null = null;

  update(
    faces: readonly (TrackedFace | null)[],
    now: number,
    resolution: Vec2,
  ): readonly (TrackedFace | null)[] {
    const elapsed =
      this.lastUpdate === null ? 0 : (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    const live = faces.findIndex((face) => face !== null && !face.held);
    if (live >= 0) {
      this.last = { slot: live, landmarks: faces[live]!.landmarks };
      this.bounce = null;
      return faces;
    }
    if (!this.last || faces.some((face) => face !== null)) return faces;

    const time = now / 1000;
    const bounce = (this.bounce ??= this.start(
      this.last.landmarks,
      resolution,
      time,
    ));
    const hitCorner = this.step(
      bounce,
      Math.min(elapsed, SCREENSAVER.maxStepSeconds),
      resolution,
    );
    if (hitCorner && time >= bounce.happyUntil)
      bounce.happyUntil = time + SCREENSAVER.happySeconds;

    const slots = [...faces];
    slots[this.last.slot] = this.face(
      bounce,
      resolution,
      this.expression(bounce, resolution, time),
    );
    return slots;
  }

  private start(
    landmarks: readonly NormalizedLandmark[],
    resolution: Vec2,
    time: number,
  ): Bounce {
    const template = frontalize(landmarks, resolution, SCREENSAVER.faceHeight);
    const speed = SCREENSAVER.speed * resolution[1];
    return {
      template,
      position: this.randomPosition(template, resolution),
      velocity: [speed * randomSign(), speed * randomSign()],
      expression: new IdleExpression(time),
      happyUntil: -Infinity,
    };
  }

  private randomPosition(template: FaceTemplate, resolution: Vec2): Vec2 {
    const [x, y] = [0, 1].map((axis) => {
      const min = template.halfSize[axis];
      return randomBetween([min, Math.max(min, resolution[axis] - min)]);
    });
    return [x, y];
  }

  private step(bounce: Bounce, seconds: number, resolution: Vec2): boolean {
    const bounced = [0, 1].filter((axis) => {
      const [min, max] = this.limits(bounce, resolution, axis);
      bounce.position[axis] += bounce.velocity[axis] * seconds;
      if (bounce.position[axis] <= min) {
        bounce.position[axis] = min;
        bounce.velocity[axis] = Math.abs(bounce.velocity[axis]);
        return true;
      }
      if (bounce.position[axis] >= max) {
        bounce.position[axis] = max;
        bounce.velocity[axis] = -Math.abs(bounce.velocity[axis]);
        return true;
      }
      return false;
    });
    const tolerance = SCREENSAVER.cornerTolerance * resolution[1];
    return bounced.some(
      (axis) => this.wallGap(bounce, resolution, 1 - axis) <= tolerance,
    );
  }

  private expression(
    bounce: Bounce,
    resolution: Vec2,
    time: number,
  ): Float32Array {
    if (time < bounce.happyUntil)
      return bounce.expression.update(time, "happy", null);
    const [dx, dy] = this.toHeadingCorner(bounce, resolution);
    const distance = Math.hypot(dx, dy);
    if (distance >= SCREENSAVER.cornerWarning * resolution[1])
      return bounce.expression.update(time, "searching", null);
    const unit = Math.max(distance, 1e-6);
    return bounce.expression.update(time, "surprised", [dx / unit, -dy / unit]);
  }

  private toHeadingCorner(bounce: Bounce, resolution: Vec2): Vec2 {
    const [dx, dy] = [0, 1].map((axis) => {
      const [min, max] = this.limits(bounce, resolution, axis);
      const corner = bounce.velocity[axis] > 0 ? max : min;
      return corner - bounce.position[axis];
    });
    return [dx, dy];
  }

  private limits(bounce: Bounce, resolution: Vec2, axis: number): Vec2 {
    const min = bounce.template.halfSize[axis];
    return [min, resolution[axis] - min];
  }

  private wallGap(bounce: Bounce, resolution: Vec2, axis: number): number {
    const [min, max] = this.limits(bounce, resolution, axis);
    const position = bounce.position[axis];
    return Math.min(position - min, max - position);
  }

  private face(
    { template, position: [px, py] }: Bounce,
    [width, height]: Vec2,
    blendshapes: Float32Array,
  ): TrackedFace {
    return {
      landmarks: template.points.map(([x, y, z]) => ({
        x: (px + x) / width,
        y: (py + y) / height,
        z: z / width,
        visibility: 1,
      })),
      blendshapes,
      held: false,
      idle: true,
    };
  }
}
