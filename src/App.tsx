import "./App.css";
import { DebugPanel } from "./components/DebugPanel/DebugPanel";
import { EffectsView } from "./components/EffectsView/EffectsView";
import { applyPreset, cyclePreset } from "./effects/config";
import { EFFECT_STACK } from "./effects/stack";
import { useDebugToggle } from "./hooks/useDebugToggle";
import { useRemoteCommand } from "./hooks/useRemoteCommand";
import type { RemoteCommand } from "./remote/protocol";
import { hasQueryFlag } from "./utils/dom";

const OUTPUT_MODE = hasQueryFlag("output");

function runPresetCommand(command: RemoteCommand) {
  if (command.type === "preset") applyPreset(command.name);
  if (command.type === "cyclePreset") cyclePreset(command.step);
}

export default function App() {
  const [debug, closeDebug] = useDebugToggle();
  useRemoteCommand(runPresetCommand);
  return (
    <main className={OUTPUT_MODE ? "app output" : "app"}>
      <EffectsView passes={EFFECT_STACK} showOriginal={debug} />
      {debug && <DebugPanel onClose={closeDebug} />}
    </main>
  );
}
