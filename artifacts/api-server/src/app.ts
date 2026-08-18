import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const app: Express = express();

// Trust reverse proxy (Nginx, Cloudflare, AWS ALB) for client IP and HTTPS detection
app.set("trust proxy", 1);

// Build allowed origins list from static defaults and environment variables
const extraOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || process.env.APP_BASE_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [
  "https://sefi-eyedonation.onrender.com",
  /^https:\/\/.*\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  "https://localhost",
  "http://localhost",
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  ...extraOrigins,
];

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser requests (curl, PM2, health checks)
      const isAllowed = ALLOWED_ORIGINS.some((allowed) =>
        typeof allowed === "string" ? allowed === origin : allowed.test(origin),
      );
      callback(null, isAllowed ? origin : false);
    },
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health Check Endpoint (Used by PM2, Nginx, Docker, Kubernetes, uptime monitors)
const healthHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbLatencyMs = Date.now() - startTime;

    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      node: process.version,
      database: {
        status: "connected",
        latencyMs: dbLatencyMs,
      },
      memory: process.memoryUsage(),
    });
  } catch (err: any) {
    logger.error({ err }, "Health check failed: database unreachable");
    res.status(503).json({
      status: "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: "disconnected",
        error: err?.message || "Database connection error",
      },
    });
  }
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// Mount API routes
app.use("/api", router);

// Static frontend serving in production
// Locates the built Vite frontend SPA and serves it with client-side routing fallback
const possibleStaticDirs = [
  path.resolve(process.cwd(), "artifacts/sankara-eye/dist/public"),
  path.resolve(process.cwd(), "dist/public"),
  path.resolve(process.cwd(), "public"),
];

let staticDir: string | null = null;
for (const dir of possibleStaticDirs) {
  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, "index.html"))) {
    staticDir = dir;
    break;
  }
}

if (staticDir) {
  logger.info({ staticDir }, "Serving static frontend SPA");
  app.use(express.static(staticDir, { maxAge: "1d", etag: true }));

  // SPA fallback for HTML5 history API navigation (Express 5 compatible)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET" && !req.path.startsWith("/api") && req.path !== "/health") {
      res.sendFile(path.join(staticDir!, "index.html"));
      return;
    }
    next();
  });
}

// Centralized error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled server exception");
  const statusCode = Number(err.status || err.statusCode) || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === "production" ? "Internal Server Error" : (err.message || "Unknown error"),
  });
});

export default app;
