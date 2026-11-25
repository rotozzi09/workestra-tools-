import "dotenv/config";
import express from "express";
import { createServer as createHttpServer } from "node:http";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import toolsAuthHandler from "./api/tools/[action]";

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);

  app.use(express.json({ limit: "32kb" }));

  // Workestra MongoDB Atlas Auth Routes
  app.all("/api/tools/:action", (req, res) => void toolsAuthHandler(req, res));

  if (!isProduction) {
    const enableHmr = process.env.ENABLE_HMR === "true";
    if (!enableHmr) {
      process.env.DISABLE_HMR = "true";
    }

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: enableHmr ? { server: httpServer } : false,
        ws: enableHmr ? { server: httpServer } : false,
      },
      appType: "spa",
    });

    if (!enableHmr) {
      app.get("/@vite/client", async (_req, res, next) => {
        try {
          const result = await vite.transformRequest("/@vite/client");
          if (result?.code) {
            const noWsCode = result.code.replace(
              /let wsTransport = createWebSocketModuleRunnerTransport\(\{[\s\S]*?\}\);/,
              "let wsTransport = { async connect() {}, async disconnect() {}, send() {} };"
            );
            res.setHeader("Content-Type", "application/javascript; charset=utf-8");
            res.send(noWsCode);
            return;
          }
        } catch {
          // Fall back to Vite middleware if transform fails
        }
        next();
      });
    }

    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Workestra Tools server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Workestra Tools server:", err);
  process.exit(1);
});
