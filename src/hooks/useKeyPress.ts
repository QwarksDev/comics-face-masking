import { useEffect } from "react";
import { isTyping } from "../utils/dom";

export function useKeyPress(key: string, onPress: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== key || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      onPress();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, onPress]);
}
