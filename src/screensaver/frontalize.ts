import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Vec2 } from "../gl/types";
import {
  cross,
  dot,
  length,
  normalize,
  scale,
  sub,
  type Vec3,
} from "../utils/vector";

const RIGHT_EYE = 33;
const LEFT_EYE = 263;
const FOREHEAD = 10;
const CHIN = 152;

export interface FaceTemplate {
  points: Vec3[];
  halfSize: Vec2;
}

function centered(points: Vec3[]): FaceTemplate {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const p of points)
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], p[axis]);
      max[axis] = Math.max(max[axis], p[axis]);
    }
  const center = scale(
    [min[0] + max[0], min[1] + max[1], min[2] + max[2]],
    0.5,
  );
  return {
    points: points.map((p) => sub(p, center)),
    halfSize: [(max[0] - min[0]) / 2, (max[1] - min[1]) / 2],
  };
}

export function frontalize(
  landmarks: readonly NormalizedLandmark[],
  [width, height]: Vec2,
  faceHeight: number,
): FaceTemplate {
  const points = landmarks.map(({ x, y, z }): Vec3 => [
    x * width,
    y * height,
    z * width,
  ]);
  const across = sub(points[LEFT_EYE], points[RIGHT_EYE]);
  const up = sub(points[FOREHEAD], points[CHIN]);
  const xAxis = normalize(across);
  const yAxis = normalize(sub(up, scale(xAxis, dot(up, xAxis))));
  const zAxis = cross(xAxis, yAxis);
  const s = (faceHeight * height) / Math.max(length(up), 1e-6);
  return centered(
    points.map((p): Vec3 => [
      dot(p, xAxis) * s,
      -dot(p, yAxis) * s,
      -dot(p, zAxis) * s,
    ]),
  );
}
