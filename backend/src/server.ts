import app from "./app.js";
import { env } from "./config/env.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { connectDatabase } from "./db/db.js";
import { startMedicineExpiryJob, stopMedicineExpiryJob } from "./jobs/medicine-expiry.job.js";
import { createHttpLogger } from "./logging/logger.js";

const logger = createHttpLogger();

// DB is a hard dependency — fail fast if it cannot be reached
await connectDatabase();

// Connect to Redis before starting server
await connectRedis();

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
process.on("SIGTERM", async () => {
    logger.info({ event: "server.stopping", signal: "SIGTERM" }, "SIGTERM received: shutting down gracefully");
    stopMedicineExpiryJob();
    await disconnectRedis();
    server.close(() => {
        logger.info({ event: "server.closed" }, "Server closed");
        process.exit(0);
    });
});

process.on("SIGINT", async () => {
    logger.info({ event: "server.stopping", signal: "SIGINT" }, "SIGINT received: shutting down gracefully");
    stopMedicineExpiryJob();
    await disconnectRedis();
    server.close(() => {
        logger.info({ event: "server.closed" }, "Server closed");
        process.exit(0);
    });
});
