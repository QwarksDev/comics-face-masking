import "./App.css";
import { DebugPanel } from "./components/DebugPanel/DebugPanel";
import { EffectsView } from "./components/EffectsView/EffectsView";
import { EFFECT_STACK } from "./effects/stack";
import { useDebugToggle } from "./hooks/useDebugToggle";

export default function App() {
  const [debug, closeDebug] = useDebugToggle();
  return (
    <main className="app">
      <EffectsView passes={EFFECT_STACK} showOriginal={debug} />
      {debug && <DebugPanel onClose={closeDebug} />}
    </main>
  );
}
