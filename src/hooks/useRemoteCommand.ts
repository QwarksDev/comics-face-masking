import { useEffect } from "react";
import { REMOTE_EVENT, type RemoteCommand } from "../remote/protocol";

export function useRemoteCommand(onCommand: (command: RemoteCommand) => void) {
  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) return;
    hot.on(REMOTE_EVENT, onCommand);
    return () => hot.off(REMOTE_EVENT, onCommand);
  }, [onCommand]);
}
