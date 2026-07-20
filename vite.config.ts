import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const isPages = mode === "pages";
  const repoName = "Dotrent";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    base: isPages ? `/${repoName}/` : "/",
    build: {
      target: "es2023",
      outDir: "dist",
    },
    server: {
      proxy: {
        "/api/scraper": {
          target: "https://4khdhub.one",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/scraper/, ""),
        },
        "/api/hd4u": {
          target: "https://new3.hdhub4u.cl",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/hd4u/, ""),
        },
      },
    },
  };
});
