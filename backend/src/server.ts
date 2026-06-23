import app from "./app.js";
import { env } from "./config/env.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { connectDatabase } from "./db/db.js";
import { startMedicineExpiryJob, stopMedicineExpiryJob } from "./jobs/medicine-expiry.job.js";
import { createHttpLogger } from "./logging/logger.js";
import { startMetricsServer, stopMetricsServer } from "./metrics/server.js";

const logger = createHttpLogger();

// DB is a hard dependency — fail fast if it cannot be reached
await connectDatabase();

// Connect to Redis before starting server
await connectRedis();

const metricsServer = await startMetricsServer();

// Start medicine expiry cron job
startMedicineExpiryJob();

const server = app.listen(env.PORT, () => {
    logger.info(
        { event: "server.listening", port: env.PORT },
        `server is running on port ${env.PORT}`,
    );
    logger.info(
        { event: "server.health", url: `http://localhost:${env.PORT}/health` },
        `health check is available on http://localhost:${env.PORT}/health`,
    );
});

// Graceful shutdown: stop cron job and disconnect Redis before exit
let shuttingDown = false;

async function shutdown(signal: "SIGTERM" | "SIGINT"): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ event: "server.stopping", signal }, `${signal} received: shutting down gracefully`);
    stopMedicineExpiryJob();
    await Promise.all([
        stopMetricsServer(metricsServer),
        new Promise<void>((resolve) => server.close(() => resolve())),
    ]);
    await disconnectRedis();
    logger.info({ event: "server.closed" }, "Server closed");
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
