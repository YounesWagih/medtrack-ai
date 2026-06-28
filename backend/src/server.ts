import "dotenv/config";
import { startTracing, stopTracing } from "./tracing/tracing.js";

startTracing();

const [
    { default: app },
    { env },
    { connectRedis, disconnectRedis },
    { connectDatabase },
    { startMedicineExpiryJob, stopMedicineExpiryJob },
    { createHttpLogger },
    { startMetricsServer, stopMetricsServer },
] = await Promise.all([
    import("./app.js"),
    import("./config/env.js"),
    import("./config/redis.js"),
    import("./db/db.js"),
    import("./jobs/medicine-expiry.job.js"),
    import("./logging/logger.js"),
    import("./metrics/server.js"),
]);

const logger = createHttpLogger();

// DB is a hard dependency: fail fast if it cannot be reached.
await connectDatabase();

// Connect to Redis before starting server.
await connectRedis();

const metricsServer = await startMetricsServer();

// Start medicine expiry cron job.
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
    await stopTracing();
    logger.info({ event: "server.closed" }, "Server closed");
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
