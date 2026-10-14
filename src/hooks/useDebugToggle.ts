import { useCallback, useState } from "react";
import { useKeyPress } from "./useKeyPress";

export function useDebugToggle(key = "d"): [boolean, () => void] {
  const [open, setOpen] = useState(() =>
    new URLSearchParams(window.location.search).has("debug"),
  );

  useKeyPress(
    key,
    useCallback(() => setOpen((o) => !o), []),
  );

  return [open, () => setOpen(false)];
}
