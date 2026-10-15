import type { Plugin } from "vite";
import { REMOTE_EVENT, type RemoteCommand } from "../src/remote/protocol";

const ROUTE = "/remote";

function parseCommand(url: string): RemoteCommand | null {
  const [action, arg] = url.split("?")[0].split("/").filter(Boolean);
  switch (action) {
    case "zoom":
      return { type: "zoom" };
    case "next-preset":
      return { type: "cyclePreset", step: 1 };
    case "previous-preset":
      return { type: "cyclePreset", step: -1 };
    case "preset":
      return arg ? { type: "preset", name: decodeURIComponent(arg) } : null;
    default:
      return null;
  }
}

export function remoteControl(): Plugin {
  return {
    name: "remote-control",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(ROUTE, (req, res) => {
        const command = parseCommand(req.url ?? "");
        if (command) server.ws.send(REMOTE_EVENT, command);
        res.statusCode = command ? 204 : 404;
        res.end();
      });
    },
  };
}
