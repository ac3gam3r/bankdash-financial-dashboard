import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async () => {
  // Base plugins
  const basePlugins: PluginOption[] = [react()];

  // Load Replit plugins optionally (typed safely; no top-level await)
  const replPlugins: PluginOption[] = [];
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    const runtimeErrorOverlayMod = await import("@replit/vite-plugin-runtime-error-modal");
    replPlugins.push(cartographer(), runtimeErrorOverlayMod.default());
  }

  return {
    root: path.resolve(__dirname, "client"), // run Vite from client/
    plugins: [...basePlugins, ...replPlugins],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"), // @ => client/src
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: { strict: true, deny: ["**/.*"] },
    },
  };
});
