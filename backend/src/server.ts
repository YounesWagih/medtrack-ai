import app from "./app.js";
import { env } from "./config/env.js";
import { startMedicineExpiryJob, stopMedicineExpiryJob } from "./jobs/medicine-expiry.job.js";

// Start medicine expiry cron job
startMedicineExpiryJob();

const server = app.listen(env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
    console.log(
        `health check is avaliable on http://localhost:${process.env.PORT}/health`,
    );
});

// Graceful shutdown: stop cron job before exit
process.on("SIGTERM", () => {
    console.log("SIGTERM received: shutting down gracefully");
    stopMedicineExpiryJob();
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});

process.on("SIGINT", () => {
    console.log("SIGINT received: shutting down gracefully");
    stopMedicineExpiryJob();
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});
