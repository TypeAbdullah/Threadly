import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    port: 5175,
    cors: true,
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Threadly",
      fileName: () => "widget.js",
      formats: ["iife", "es"],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
});
