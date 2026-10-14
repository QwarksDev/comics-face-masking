export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function merge<T>(base: T, override: unknown): T {
  if (!isRecord(base) || !isRecord(override))
    return structuredClone(override === undefined ? base : override) as T;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(base))
    out[key] = merge(base[key], override[key]);
  return out as T;
}

export function isSame(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}
