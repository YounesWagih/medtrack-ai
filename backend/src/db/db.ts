import { prisma } from "./PrismaClient.js";
import { createDbLogger } from "../logging/logger.js";

const logger = createDbLogger();
const MAX_DB_RETRIES = 5;
const BASE_DELAY_MS = 2_000;

export async function connectDatabase(): Promise<void> {
    for (let attempt = 1; attempt <= MAX_DB_RETRIES; attempt++) {
        try {
            await prisma.$connect();
            logger.info(
                { event: "db.connected", attempt },
                `Database connected successfully (attempt ${attempt})`,
            );
            return;
        } catch (err) {
            if (attempt < MAX_DB_RETRIES) {
                const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), 30_000);
                logger.warn(
                    {
                        event: "db.connect_retry",
                        attempt,
                        maxRetries: MAX_DB_RETRIES,
                        delayMs: delay,
                        error: {
                            name: err instanceof Error ? err.name : "UnknownError",
                            message: err instanceof Error ? err.message : String(err),
                        },
                    },
                    `Database connection attempt ${attempt}/${MAX_DB_RETRIES} failed`,
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                logger.error(
                    { event: "db.connect_failed", maxRetries: MAX_DB_RETRIES },
                    "Database failed to connect after all retries. Exiting.",
                );
                process.exit(1);
            }
        }
    }
}
