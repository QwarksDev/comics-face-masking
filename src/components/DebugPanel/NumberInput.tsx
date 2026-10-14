import type { ChangeEvent } from "react";
import { round } from "../../utils/format";
import styles from "./DebugPanel.module.css";

interface NumberInputProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function NumberInput({
  value,
  min,
  max,
  step,
  onChange,
}: NumberInputProps) {
  const commit = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.valueAsNumber;
    if (Number.isFinite(next)) onChange(round(next));
  };
  return (
    <span className={styles.number}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={commit}
      />
      <input type="number" step={step} value={value} onChange={commit} />
    </span>
  );
}
