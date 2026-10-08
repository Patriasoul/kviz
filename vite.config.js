import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Cloudflare Worker deploys this app at the domain root.
  // The old GitHub Pages path (/kviz/) caused assets to be requested
  // from /kviz/... and resulted in a blank page on workers.dev.
  base: "/",
});
