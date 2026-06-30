import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const page = process.env.PAGE || "title";

const pageFiles: Record<string, string> = {
  title: "anime-title.html",
  progress: "anime-progress.html",
};

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: `dist/${page}`,
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, pageFiles[page]),
    },
  },
});
