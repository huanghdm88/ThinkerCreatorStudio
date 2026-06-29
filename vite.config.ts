import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const staticDirs = ["Hoffman video", "videos", "posters"];

function contentType(file: string) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function thinkerStaticAssets(): Plugin {
  return {
    name: "thinker-static-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url?.split("?")[0] || "";
        const decodedUrl = decodeURI(rawUrl).replace(/^\//, "");
        const staticDir = staticDirs.find((dir) => decodedUrl === dir || decodedUrl.startsWith(`${dir}/`));
        if (!staticDir) return next();

        const safePath = path.normalize(decodedUrl);
        const absPath = path.join(rootDir, safePath);
        if (!absPath.startsWith(path.join(rootDir, staticDir))) return next();
        if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) return next();

        res.setHeader("Content-Type", contentType(absPath));
        fs.createReadStream(absPath).pipe(res);
      });
    },
    closeBundle() {
      const outDir = path.join(rootDir, "dist");
      for (const dir of staticDirs) {
        const from = path.join(rootDir, dir);
        const to = path.join(outDir, dir);
        if (fs.existsSync(from)) {
          fs.cpSync(from, to, { recursive: true, force: true });
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), thinkerStaticAssets()],
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
