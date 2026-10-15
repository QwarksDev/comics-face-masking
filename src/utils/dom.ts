export function download(text: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function hasQueryFlag(name: string) {
  return new URLSearchParams(window.location.search).has(name);
}

export function queryParam(name: string) {
  return new URLSearchParams(window.location.search).get(name);
}
