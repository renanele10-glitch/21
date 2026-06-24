import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Discord exige que requisições passem por /.proxy/
      "/.proxy": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/.proxy/, ""),
      },
    },
  },
  envPrefix: "VITE_",
});
