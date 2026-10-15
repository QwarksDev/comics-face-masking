export const REMOTE_EVENT = "remote:command";

export type RemoteCommand =
  | { type: "zoom" }
  | { type: "preset"; name: string }
  | { type: "cyclePreset"; step: 1 | -1 };
