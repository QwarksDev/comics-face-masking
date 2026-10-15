import { broadcastConfig, sendRemoteCommand } from "../../remote/sync";
import { DebugPanel } from "../DebugPanel/DebugPanel";

export function ControlPage() {
  return (
    <main className="app control">
      <DebugPanel title="OBS control" embedded onConfigChange={broadcastConfig}>
        <button
          type="button"
          onClick={() => sendRemoteCommand({ type: "zoom" })}
        >
          Toggle zoom
        </button>
      </DebugPanel>
    </main>
  );
}
