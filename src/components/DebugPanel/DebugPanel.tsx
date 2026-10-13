import { type ChangeEvent, useReducer, useState } from "react";
import {
  activePreset,
  applyConfig,
  applyPreset,
  config,
  DEFAULT_CONFIG,
  PRESETS,
  resetConfig,
  type SectionName,
  serializeConfig,
  setParam,
} from "../../effects/config";
import type { Vec2, Vec4 } from "../../gl/types";
import { type AnyControl, DEBUG_SCHEMA } from "../../debug/schema";
import styles from "./DebugPanel.module.css";

const CUSTOM = "";

function humanize(key: string) {
  const words = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function toHex([r, g, b]: Vec4) {
  return `#${[r, g, b]
    .map((c) =>
      Math.round(Math.min(Math.max(c, 0), 1) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function fromHex(hex: string, alpha: number): Vec4 {
  const channel = (i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return [channel(0) / 255, channel(1) / 255, channel(2) / 255, alpha];
}

function round(value: number) {
  return Math.round(value * 1e4) / 1e4;
}

interface NumberInputProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function NumberInput({ value, min, max, step, onChange }: NumberInputProps) {
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

interface ColorInputProps {
  value: Vec4;
  onChange: (value: Vec4) => void;
}

function ColorInput({ value, onChange }: ColorInputProps) {
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

function ResetIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"
      />
      <path
        fill="currentColor"
        d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466"
      />
    </svg>
  );
}

function isSame(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

interface FieldProps {
  name: string;
  control: AnyControl;
  value: unknown;
  defaultValue: unknown;
  onChange: (value: unknown) => void;
}

function Field({ name, control, value, defaultValue, onChange }: FieldProps) {
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

interface FieldInputProps {
  control: AnyControl;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FieldInput({ control, value, onChange }: FieldInputProps) {
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

function download(text: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface DebugPanelProps {
  onClose: () => void;
}

export function DebugPanel({ onClose }: Readonly<DebugPanelProps>) {
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  const [status, setStatus] = useState("");
  const sections = Object.keys(DEBUG_SCHEMA) as SectionName[];
  const preset = activePreset();

  const update = (section: SectionName, key: string, value: unknown) => {
    setParam(section, key as never, value as never);
    refresh();
  };

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      applyConfig(JSON.parse(await file.text()));
      setStatus(`Loaded ${file.name}`);
    } catch (err) {
      setStatus(`Import failed: ${(err as Error).message}`);
    }
    refresh();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(serializeConfig());
      setStatus("Copied to clipboard");
    } catch {
      setStatus("Clipboard unavailable");
    }
  };

  return (
    <aside className={styles.panel}>
      <header className={styles.header}>
        <strong>Debug</strong>
        <button type="button" title="Close (D)" onClick={onClose}>
          ×
        </button>
      </header>
      <label className={styles.preset}>
        <span>Preset</span>
        <select
          value={preset ?? CUSTOM}
          onChange={(e) => {
            applyPreset(e.target.value);
            setStatus("");
            refresh();
          }}
        >
          {preset === null && (
            <option value={CUSTOM} disabled>
              Custom
            </option>
          )}
          {Object.keys(PRESETS).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() =>
            download(serializeConfig(), `${preset ?? "custom"}.json`)
          }
        >
          Export
        </button>
        <button type="button" onClick={copy}>
          Copy
        </button>
        <label className={styles.import}>
          Import
          <input type="file" accept="application/json" onChange={importFile} />
        </label>
        <button
          type="button"
          onClick={() => {
            resetConfig();
            setStatus("Reset to default");
            refresh();
          }}
        >
          Reset
        </button>
      </div>
      {status && <p className={styles.status}>{status}</p>}
      {sections.map((section) => {
        const params = config[section] as unknown as Record<string, unknown>;
        const defaults = DEFAULT_CONFIG[section] as unknown as Record<
          string,
          unknown
        >;
        const { label, fields } = DEBUG_SCHEMA[section];
        return (
          <details key={section} className={styles.section}>
            <summary>
              <input
                type="checkbox"
                checked={config[section].enabled}
                onChange={(e) => update(section, "enabled", e.target.checked)}
              />
              {label}
            </summary>
            {Object.entries(fields as Record<string, AnyControl>).map(
              ([key, control]) => (
                <Field
                  key={key}
                  name={key}
                  control={control}
                  value={params[key]}
                  defaultValue={defaults[key]}
                  onChange={(value) => update(section, key, value)}
                />
              ),
            )}
          </details>
        );
      })}
    </aside>
  );
}
