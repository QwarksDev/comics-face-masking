import "./App.css";
import { EffectsView } from "./components/EffectsView/EffectsView";
import { EFFECT_STACK } from "./effects/stack";

export default function App() {
  return (
    <main className="app">
      <EffectsView passes={EFFECT_STACK} />
    </main>
  );
}
