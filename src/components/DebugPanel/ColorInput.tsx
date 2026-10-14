import type { Vec4 } from "../../gl/types";
import { fromHex, toHex } from "../../utils/color";
import { NumberInput } from "./NumberInput";
import styles from "./DebugPanel.module.css";

interface ColorInputProps {
  value: Vec4;
  onChange: (value: Vec4) => void;
}

export function ColorInput({ value, onChange }: ColorInputProps) {
  return (
    <span className={styles.color}>
      <input
        type="color"
        value={toHex(value)}
        onChange={(e) => onChange(fromHex(e.target.value, value[3]))}
      />
      <NumberInput
        value={value[3]}
        min={0}
        max={1}
        step={0.01}
        onChange={(a) => onChange([value[0], value[1], value[2], a])}
      />
    </span>
  );
}
