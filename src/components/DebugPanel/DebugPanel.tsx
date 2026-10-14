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
import { type AnyControl, DEBUG_SCHEMA } from "../../debug/schema";
import { Field } from "./Field";
import { download } from "../../utils/dom";
import styles from "./DebugPanel.module.css";

const CUSTOM = "";

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
