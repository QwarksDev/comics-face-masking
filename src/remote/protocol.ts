export const REMOTE_EVENT = "remote:command";

export type PageRole = "control" | "output";

export type RemoteCommand =
  | { type: "zoom" }
  | { type: "preset"; name: string }
  | { type: "cyclePreset"; step: 1 | -1 }
  | { type: "config"; config: unknown; preset: string | null; from: PageRole }
  | { type: "requestConfig"; from: PageRole };
