import { activePreset, applyConfig, config } from "../effects/config";
import { hasQueryFlag } from "../utils/dom";
import { REMOTE_EVENT, type PageRole, type RemoteCommand } from "./protocol";

export const PAGE_ROLE: PageRole = hasQueryFlag("control")
  ? "control"
  : "output";

export function sendRemoteCommand(command: RemoteCommand) {
  import.meta.hot?.send(REMOTE_EVENT, command);
}

export function broadcastConfig() {
  sendRemoteCommand({
    type: "config",
    config,
    preset: activePreset(),
    from: PAGE_ROLE,
  });
}

export function requestConfig() {
  sendRemoteCommand({ type: "requestConfig", from: PAGE_ROLE });
}

export function runSyncCommand(command: RemoteCommand) {
  if (command.type === "config" && command.from !== PAGE_ROLE)
    applyConfig(command.config, command.preset);
  if (command.type === "requestConfig" && command.from !== PAGE_ROLE)
    broadcastConfig();
}
