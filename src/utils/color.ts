import type { Vec4 } from "../gl/types";

export function toHex([r, g, b]: Vec4) {
  return `#${[r, g, b]
    .map((c) =>
      Math.round(Math.min(Math.max(c, 0), 1) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function fromHex(hex: string, alpha: number): Vec4 {
  const channel = (i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return [channel(0) / 255, channel(1) / 255, channel(2) / 255, alpha];
}
