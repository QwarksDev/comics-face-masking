import type { AnyControl } from "../../debug/schema";
import { ResetIcon } from "../../icons/ResetIcon";
import { humanize } from "../../utils/format";
import { isSame } from "../../utils/object";
import { FieldInput } from "./FieldInput";
import styles from "./DebugPanel.module.css";

interface FieldProps {
  name: string;
  control: AnyControl;
  value: unknown;
  defaultValue: unknown;
  onChange: (value: unknown) => void;
}

export function Field({
  name,
  control,
  value,
  defaultValue,
  onChange,
}: FieldProps) {
  const label = humanize(name);

  if (control.kind === "group") {
    const group = value as Record<string, unknown>;
    const defaults = defaultValue as Record<string, unknown>;
    return (
      <fieldset className={styles.group}>
        <legend>{label}</legend>
        {Object.entries(control.fields).map(([key, child]) => (
          <Field
            key={key}
            name={key}
            control={child}
            value={group[key]}
            defaultValue={defaults[key]}
            onChange={(next) => onChange({ ...group, [key]: next })}
          />
        ))}
      </fieldset>
    );
  }

  return (
    <div className={styles.row}>
      <span>{label}</span>
      <FieldInput control={control} value={value} onChange={onChange} />
      <button
        type="button"
        className={styles.reset}
        title="Reset to default"
        disabled={isSame(value, defaultValue)}
        onClick={() => onChange(structuredClone(defaultValue))}
      >
        <ResetIcon />
      </button>
    </div>
  );
}
