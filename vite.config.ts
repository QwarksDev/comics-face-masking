import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { remoteControl } from "./plugins/remoteControl";

export default defineConfig({
  plugins: [react(), remoteControl()],
});
