import "dotenv/config";
import express from "express";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import loginHandler from "./api/tools/login";
import verifyHandler from "./api/tools/verify";
import logoutHandler from "./api/tools/logout";

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "32kb" }));

  // Workestra MongoDB Atlas Auth Routes
  app.post("/api/tools/login", (req, res) => void loginHandler(req, res));
  app.post("/api/tools/verify", (req, res) => void verifyHandler(req, res));
  app.post("/api/tools/logout", (req, res) => void logoutHandler(req, res));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Workestra Tools server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Workestra Tools server:", err);
  process.exit(1);
});
