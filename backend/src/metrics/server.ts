import { createServer, type Server } from "node:http";
import { env } from "../config/env.js";
import { createMetricsLogger } from "../logging/logger.js";
import { metricsRegistry } from "./metrics.js";

const logger = createMetricsLogger();

export async function startMetricsServer(): Promise<Server | null> {
    if (!env.METRICS_ENABLED) return null;

    const server = createServer(async (req, res) => {
        if (req.method !== "GET" || req.url !== "/metrics") {
            res.writeHead(404).end();
            return;
        }

        try {
            const body = await metricsRegistry.metrics();
            res.writeHead(200, { "Content-Type": metricsRegistry.contentType });
            res.end(body);
        } catch (error) {
            logger.warn(
                { event: "metrics.exposition_failed", error: error instanceof Error ? error.message : String(error) },
                "metrics exposition failed",
            );
            if (!res.headersSent) res.writeHead(500);
            res.end();
        }
    });

    return new Promise((resolve) => {
        server.once("error", (error) => {
            logger.warn(
                { event: "metrics.server_failed", port: env.METRICS_PORT, error: error.message },
                "metrics server failed to start; continuing without exposition",
            );
            resolve(null);
        });
        server.listen(env.METRICS_PORT, "0.0.0.0", () => {
            logger.info(
                { event: "metrics.server_listening", port: env.METRICS_PORT },
                "internal metrics server listening",
            );
            resolve(server);
        });
    });
}

export async function stopMetricsServer(server: Server | null): Promise<void> {
    if (!server?.listening) return;
    await new Promise<void>((resolve) => server.close(() => resolve()));
}
