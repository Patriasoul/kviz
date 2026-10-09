import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this project from /kviz/.
// Cloudflare Workers serves it from the domain root.
const base = process.env.GITHUB_ACTIONS === "true" ? "/kviz/" : "/";

export default defineConfig({
  plugins: [react()],
  base,
});
