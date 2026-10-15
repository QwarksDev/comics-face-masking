import { type ChangeEvent, type ReactNode, useReducer, useState } from "react";
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
import { useRemoteCommand } from "../../hooks/useRemoteCommand";
import { Field } from "./Field";
import { download } from "../../utils/dom";
import styles from "./DebugPanel.module.css";

const CUSTOM = "";

interface DebugPanelProps {
  title?: string;
  embedded?: boolean;
  onClose?: () => void;
  onConfigChange?: () => void;
  children?: ReactNode;
}

export function DebugPanel({
  title = "Debug",
  embedded = false,
  onClose,
  onConfigChange,
  children,
}: Readonly<DebugPanelProps>) {
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  const changed = () => {
    onConfigChange?.();
    refresh();
  };
  const [status, setStatus] = useState("");
  const sections = Object.keys(DEBUG_SCHEMA) as SectionName[];
  const preset = activePreset();
  useRemoteCommand(refresh);

  const update = (section: SectionName, key: string, value: unknown) => {
    setParam(section, key as never, value as never);
    changed();
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
    changed();
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
    <aside
      className={embedded ? `${styles.panel} ${styles.embedded}` : styles.panel}
    >
      <header className={styles.header}>
        <strong>{title}</strong>
        {onClose && (
          <button type="button" title="Close (D)" onClick={onClose}>
            ×
          </button>
        )}
      </header>
      <label className={styles.preset}>
        <span>Preset</span>
        <select
          value={preset ?? CUSTOM}
          onChange={(e) => {
            applyPreset(e.target.value);
            setStatus("");
            changed();
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
            changed();
          }}
        >
          Reset
        </button>
        {children}
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
