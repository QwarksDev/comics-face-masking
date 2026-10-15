export function randomBetween([min, max]: readonly [number, number]) {
  return min + Math.random() * (max - min);
}

export function randomSign() {
  return Math.random() < 0.5 ? -1 : 1;
}
