import { MAX_FACES } from "../../resources/LandmarkTexture";

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export function slotSmoother() {
  const states: (Float32Array | null)[] = new Array(MAX_FACES).fill(null);
  return (
    slot: number,
    target: Float32Array,
    smoothing: number,
  ): Float32Array => {
    const state = states[slot];
    if (!state) return (states[slot] = target.slice());
    for (let i = 0; i < state.length; i++)
      state[i] += (target[i] - state[i]) * (1 - smoothing);
    return state;
  };
}
