import app from "./app.js";
import { env } from "./config/env.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { startMedicineExpiryJob, stopMedicineExpiryJob } from "./jobs/medicine-expiry.job.js";

// Connect to Redis before starting server
await connectRedis();

// Start medicine expiry cron job
startMedicineExpiryJob();

const server = app.listen(env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
    console.log(
        `health check is avaliable on http://localhost:${process.env.PORT}/health`,
    );
});

// Graceful shutdown: stop cron job and disconnect Redis before exit
process.on("SIGTERM", async () => {
    console.log("SIGTERM received: shutting down gracefully");
    stopMedicineExpiryJob();
    await disconnectRedis();
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});

process.on("SIGINT", async () => {
    console.log("SIGINT received: shutting down gracefully");
    stopMedicineExpiryJob();
    await disconnectRedis();
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});
