import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// 環境変数 "PAGE" を取得（指定がなければ 'title' をデフォルトに）
const page = process.env.PAGE || "title";

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    // ページごとに上書きされないよう出力先フォルダを分ける
    outDir: `dist/${page}`,
    emptyOutDir: true,
    rollupOptions: {
      // 複数を指定するのではなく、1つだけ指定する
      input: resolve(__dirname, `${page}.html`),
    },
  },
});
