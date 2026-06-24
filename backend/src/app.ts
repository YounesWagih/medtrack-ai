import "dotenv/config";
import express, { Express, Request, Response } from "express";
import globalExceptionHandler from "./middlewares/globalExceptionHandler.js";
import router from "./routes/index.js";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { env } from "./config/env.js";
import { checkRedisHealth } from "./config/redis.js";
import { requestIdMiddleware } from "./middlewares/requestId.js";
import { httpLoggerMiddleware } from "./middlewares/httpLogger.js";
import { httpMetricsMiddleware } from "./middlewares/httpMetrics.js";

const app: Express = express();

app.use(helmet());
app.use(compression());
app.use(
    cors({
        origin: env.FRONTEND_URL || "http://localhost:5173",
    }),
);

app.use(requestIdMiddleware);
app.use(httpMetricsMiddleware);
app.use(httpLoggerMiddleware);

app.use(express.json());

app.use("/api/v1", router);

app.get("/health", async (_req: Request, res: Response) => {
    const redisHealthy = await checkRedisHealth();
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        dependencies: {
            redis: redisHealthy ? "connected" : "disconnected",
        },
    });
});

app.use(globalExceptionHandler);

export default app;
