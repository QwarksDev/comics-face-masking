import {
  CARTOON_EYES_DEFAULTS,
  CARTOON_MOUTH_DEFAULTS,
  type CartoonEyesParams,
  type CartoonMouthParams,
  FACE_BLUR_DEFAULTS,
  type FaceBlurParams,
  LANDMARK_LINES_DEFAULTS,
  type LandmarkLinesParams,
  POSTERIZE_DEFAULTS,
  type PosterizeParams,
} from "../gl/passes";

interface Toggle {
  enabled: boolean;
}

export interface EffectsConfig {
  faceBlur: Toggle & FaceBlurParams;
  posterize: Toggle & PosterizeParams;
  contourLines: Toggle & LandmarkLinesParams;
  irisLines: Toggle & LandmarkLinesParams;
  cartoonEyes: Toggle & CartoonEyesParams;
  cartoonMouth: Toggle & CartoonMouthParams;
}

export type SectionName = keyof EffectsConfig;

const DEFAULTS: EffectsConfig = {
  faceBlur: { enabled: true, ...FACE_BLUR_DEFAULTS },
  posterize: { enabled: false, ...POSTERIZE_DEFAULTS },
  contourLines: { enabled: false, ...LANDMARK_LINES_DEFAULTS },
  irisLines: { enabled: false, ...LANDMARK_LINES_DEFAULTS },
  cartoonEyes: { enabled: true, ...CARTOON_EYES_DEFAULTS },
  cartoonMouth: { enabled: true, ...CARTOON_MOUTH_DEFAULTS },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function merge<T>(base: T, override: unknown): T {
  if (!isRecord(base) || !isRecord(override))
    return structuredClone(override === undefined ? base : override) as T;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(base))
    out[key] = merge(base[key], override[key]);
  return out as T;
}

const FILES = import.meta.glob<unknown>("../config/effects/*.json", {
  eager: true,
  import: "default",
});

export const DEFAULT_PRESET = "default";

export const PRESETS: Readonly<Record<string, EffectsConfig>> =
  Object.fromEntries(
    Object.entries(FILES)
      .map(([path, json]): [string, EffectsConfig] => [
        path.slice(path.lastIndexOf("/") + 1, -".json".length),
        merge(DEFAULTS, json),
      ])
      .sort(([a], [b]) =>
        a === DEFAULT_PRESET
          ? -1
          : b === DEFAULT_PRESET
            ? 1
            : a.localeCompare(b),
      ),
  );

export const DEFAULT_CONFIG: EffectsConfig =
  PRESETS[DEFAULT_PRESET] ?? merge(DEFAULTS, {});

export const config: EffectsConfig = merge(DEFAULTS, DEFAULT_CONFIG);

let active: string | null = PRESETS[DEFAULT_PRESET] ? DEFAULT_PRESET : null;

export function activePreset(): string | null {
  return active;
}

export function setParam<
  S extends SectionName,
  K extends keyof EffectsConfig[S],
>(section: S, key: K, value: EffectsConfig[S][K]) {
  config[section][key] = value;
  active = null;
}

export function applyConfig(source: unknown, preset: string | null = null) {
  const next = merge(DEFAULTS, source);
  for (const section of Object.keys(config) as SectionName[])
    Object.assign(config[section], next[section]);
  active = preset;
}

export function applyPreset(name: string) {
  applyConfig(PRESETS[name], name);
}

export function resetConfig() {
  applyConfig(DEFAULT_CONFIG, DEFAULT_PRESET);
}

export function serializeConfig(): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}
