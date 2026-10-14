import type { Vec2, Vec4 } from "../../gl/types";
import type { AnyControl } from "../../debug/schema";
import { ColorInput } from "./ColorInput";
import { NumberInput } from "./NumberInput";
import styles from "./DebugPanel.module.css";

interface FieldInputProps {
  control: AnyControl;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FieldInput({ control, value, onChange }: FieldInputProps) {
  switch (control.kind) {
    case "boolean":
      return (
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "number":
      return (
        <NumberInput {...control} value={value as number} onChange={onChange} />
      );
    case "vec2": {
      const vec = value as Vec2;
      return (
        <span className={styles.stack}>
          {vec.map((v, i) => (
            <NumberInput
              key={i}
              {...control}
              value={v}
              onChange={(next) =>
                onChange(i === 0 ? [next, vec[1]] : [vec[0], next])
              }
            />
          ))}
        </span>
      );
    }
    case "color":
      return <ColorInput value={value as Vec4} onChange={onChange} />;
    case "colors": {
      const list = value as readonly Vec4[];
      return (
        <span className={styles.stack}>
          {list.map((c, i) => (
            <span key={i} className={styles.listItem}>
              <ColorInput
                value={c}
                onChange={(next) =>
                  onChange(list.map((old, j) => (j === i ? next : old)))
                }
              />
              <button
                type="button"
                title="Remove"
                onClick={() => onChange(list.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([...list, list.at(-1) ?? [1, 1, 1, 1]])}
          >
            Add color
          </button>
        </span>
      );
    }
    case "group":
      return null;
  }
}
