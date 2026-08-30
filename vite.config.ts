import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/UWSWOK-Resources/",
  server: { host: true, port: 5173 },
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
