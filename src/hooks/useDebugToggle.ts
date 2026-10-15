import { useCallback, useState } from "react";
import { hasQueryFlag } from "../utils/dom";
import { useKeyPress } from "./useKeyPress";

export function useDebugToggle(key = "d"): [boolean, () => void] {
  const [open, setOpen] = useState(() => hasQueryFlag("debug"));

  useKeyPress(
    key,
    useCallback(() => setOpen((o) => !o), []),
  );

  return [open, () => setOpen(false)];
}
