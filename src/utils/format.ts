export function humanize(key: string) {
  const words = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function round(value: number) {
  return Math.round(value * 1e4) / 1e4;
}
