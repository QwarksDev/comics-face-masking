import { useEffect, useState } from "react";
import { isTyping } from "../utils/dom";

export function useDebugToggle(key = "d"): [boolean, () => void] {
  const [open, setOpen] = useState(() =>
    new URLSearchParams(window.location.search).has("debug"),
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== key || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key]);

  return [open, () => setOpen(false)];
}
