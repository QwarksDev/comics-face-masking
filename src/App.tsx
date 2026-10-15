import { useEffect } from "react";
import "./App.css";
import { ControlPage } from "./components/ControlPage/ControlPage";
import { DebugPanel } from "./components/DebugPanel/DebugPanel";
import { EffectsView } from "./components/EffectsView/EffectsView";
import { applyPreset, cyclePreset } from "./effects/config";
import { EFFECT_STACK } from "./effects/stack";
import { useDebugToggle } from "./hooks/useDebugToggle";
import { useRemoteCommand } from "./hooks/useRemoteCommand";
import type { RemoteCommand } from "./remote/protocol";
import { PAGE_ROLE, requestConfig, runSyncCommand } from "./remote/sync";
import { hasQueryFlag } from "./utils/dom";

const OUTPUT_MODE = hasQueryFlag("output");

function runCommand(command: RemoteCommand) {
  if (command.type === "preset") applyPreset(command.name);
  if (command.type === "cyclePreset") cyclePreset(command.step);
  runSyncCommand(command);
}

function EffectsPage() {
  const [debug, closeDebug] = useDebugToggle();
  return (
    <main className={OUTPUT_MODE ? "app output" : "app"}>
      <EffectsView passes={EFFECT_STACK} showOriginal={debug} />
      {debug && <DebugPanel onClose={closeDebug} />}
    </main>
  );
}

export default function App() {
  useRemoteCommand(runCommand);
  useEffect(requestConfig, []);
  return PAGE_ROLE === "control" ? <ControlPage /> : <EffectsPage />;
}
