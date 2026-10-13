import type { EffectsConfig, SectionName } from "../effects/config";
import type { Vec2, Vec4 } from "../gl/types";

interface Range {
  min: number;
  max: number;
  step: number;
}

export type Control<T> = T extends boolean
  ? { kind: "boolean" }
  : T extends number
    ? { kind: "number" } & Range
    : T extends Vec2
      ? { kind: "vec2" } & Range
      : T extends Vec4
        ? { kind: "color" }
        : T extends readonly Vec4[]
          ? { kind: "colors" }
          : T extends object
            ? { kind: "group"; fields: Fields<T> }
            : never;

export type Fields<T> = { [K in keyof T]: Control<T[K]> };

export type AnyControl =
  | ({ kind: "number" | "vec2" } & Range)
  | { kind: "boolean" | "color" | "colors" }
  | { kind: "group"; fields: Record<string, AnyControl> };

type SectionSchema<S extends SectionName> = {
  label: string;
  fields: Fields<Omit<EffectsConfig[S], "enabled">>;
};

const num = (min: number, max: number, step: number) =>
  ({ kind: "number", min, max, step }) as const;
const vec2 = (min: number, max: number, step: number) =>
  ({ kind: "vec2", min, max, step }) as const;
const bool = { kind: "boolean" } as const;
const color = { kind: "color" } as const;
const colors = { kind: "colors" } as const;

const lines: SectionSchema<"contourLines">["fields"] = {
  colors,
  width: num(0.5, 10, 0.5),
};

export const DEBUG_SCHEMA: { [S in SectionName]: SectionSchema<S> } = {
  faceBlur: {
    label: "Face blur",
    fields: {
      sigma: num(0, 100, 1),
      padding: num(-0.5, 1, 0.01),
      feather: num(0, 2, 0.01),
      downsample: num(0.1, 1, 0.05),
    },
  },
  posterize: {
    label: "Posterize",
    fields: { levels: num(2, 32, 1) },
  },
  contourLines: { label: "Contour lines", fields: lines },
  irisLines: { label: "Iris lines", fields: lines },
  cartoonEyes: {
    label: "Cartoon eyes",
    fields: {
      size: num(0.1, 2, 0.01),
      aspect: num(0.5, 3, 0.01),
      offset: vec2(-1, 1, 0.01),
      pupilSize: vec2(0, 1, 0.01),
      gazeRange: vec2(0, 1, 0.01),
      gazeGain: vec2(0, 5, 0.05),
      blinkRange: vec2(0, 1, 0.01),
      squintRange: vec2(0, 1, 0.01),
      wideGain: num(0, 1, 0.01),
      closedLid: num(-1, 1, 0.01),
      lidCurve: num(-1, 1, 0.01),
      squintLid: num(-1, 1, 0.01),
      lowerLidCurve: num(-1, 1, 0.01),
      lidWidth: num(0, 0.3, 0.005),
      lidColor: color,
      shutBlend: num(0, 1, 0.01),
      smoothing: num(0, 0.99, 0.01),
      mirror: bool,
      swapSides: bool,
    },
  },
  cartoonMouth: {
    label: "Cartoon mouth",
    fields: {
      size: num(0.1, 3, 0.01),
      offset: vec2(-1, 1, 0.01),
      openRange: vec2(0, 1, 0.005),
      openSquash: vec2(0, 2, 0.01),
      stretchGain: num(0, 1, 0.01),
      tiltGain: num(0, 2, 0.01),
      shiftGain: num(0, 1, 0.01),
      holdTime: num(0, 0.5, 0.01),
      fadeTime: num(0, 0.5, 0.01),
      smoothing: num(0, 0.99, 0.01),
      swapSides: bool,
      debug: bool,
      thresholds: {
        kind: "group",
        fields: {
          round: num(0, 1, 0.01),
          roundMaxSmile: num(0, 1, 0.01),
          open: num(0, 1, 0.01),
          grinSmile: num(0, 1, 0.01),
          smirk: num(0, 1, 0.01),
          smirkSmileRatio: num(0, 2, 0.01),
          smile: num(0, 1, 0.01),
          frown: num(0, 1, 0.01),
        },
      },
    },
  },
};
