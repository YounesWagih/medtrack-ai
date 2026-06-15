import { createClient, type RedisClientType } from "redis";
import { env } from "./env.js";
import { createRedisLogger } from "../logging/logger.js";

const logger = createRedisLogger();
const MAX_REDIS_RETRIES = 8;
const MAX_BACKOFF_MS = 30_000;
const HEALTHCHECK_TIMEOUT_MS = 2_000;

type RedisState = {
    degraded: boolean;
    retryCount: number;
    outageStartedAt: number | null;
};

const state: RedisState = {
    degraded: false,
    retryCount: 0,
    outageStartedAt: null,
};

function markRedisDegraded(): void {
    if (!state.degraded) {
        state.degraded = true;
        state.outageStartedAt = Date.now();

        logger.warn({ event: "redis.entered_degraded_mode" }, "Redis entered degraded mode");
    }
}

function markRedisRecovered(): void {
    const outageDuration =
        state.outageStartedAt != null
            ? Math.floor((Date.now() - state.outageStartedAt) / 1000)
            : 0;

    if (state.degraded) {
        logger.info(
            { event: "redis.recovered", outageDurationSeconds: outageDuration },
            `Redis recovered after ${outageDuration}s outage`,
        );
    }

    state.degraded = false;
    state.retryCount = 0;
    state.outageStartedAt = null;
}

export const redisClient: RedisClientType = createClient({
    url: env.REDIS_URL,

    // Critical for APIs/caches:
    // prevents memory blowups during outages
    disableOfflineQueue: true,

    socket: {
        connectTimeout: 5_000,

        reconnectStrategy(retries) {
            state.retryCount = retries;

            if (retries >= MAX_REDIS_RETRIES) {
                markRedisDegraded();

                return false;
            }

            // Exponential backoff with jitter
            const baseDelay = Math.min(2 ** retries * 100, MAX_BACKOFF_MS);

            const jitter = baseDelay * 0.2 * (Math.random() - 0.5);

            const delay = Math.max(100, Math.floor(baseDelay + jitter));

            logger.warn(
                { event: "redis.reconnect_attempt", retryCount: retries, delayMs: delay, maxRetries: MAX_REDIS_RETRIES },
                `Redis reconnect attempt #${retries} in ${delay}ms`,
            );

            return delay;
        },
    },
});

redisClient.on("connect", () => {
    logger.info({ event: "redis.socket_connected" }, "Redis socket connected");
});

redisClient.on("ready", () => {
    markRedisRecovered();
    logger.info({ event: "redis.ready" }, "Redis client ready");
});

redisClient.on("reconnecting", () => {
    if (!state.degraded) {
        logger.warn({ event: "redis.reconnecting" }, "Redis reconnecting...");
    }
});

redisClient.on("end", () => {
    logger.warn({ event: "redis.connection_closed" }, "Redis connection closed");
});

redisClient.on("error", (err) => {
    // Avoid log spam during prolonged outages
    if (!state.degraded) {
        logger.error(
            { event: "redis.error", error: { name: err?.name, message: err?.message, stack: err?.stack } },
            "Redis error",
        );
    }
});

let connectPromise: Promise<void> | null = null;

export async function connectRedis(): Promise<void> {
    if (redisClient.isReady) {
        return;
    }

    if (connectPromise) {
        return connectPromise;
    }

    connectPromise = (async () => {
        try {
            await redisClient.connect();

            logger.info({ event: "redis.connected_successfully" }, "Redis connected successfully");
        } catch (err) {
            markRedisDegraded();

            logger.warn(
                {
                    event: "redis.connection_failed",
                    error: {
                        name: err instanceof Error ? err.name : "UnknownError",
                        message: err instanceof Error ? err.message : String(err),
                    },
                },
                "Redis connection failed. Continuing without cache.",
            );
        } finally {
            connectPromise = null;
        }
    })();

    return connectPromise;
}

export function isRedisAvailable(): boolean {
    return redisClient.isReady && !state.degraded;
}

function timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Timeout after ${ms}ms`));
        }, ms);
    });
}

export async function checkRedisHealth(): Promise<boolean> {
    if (!redisClient.isOpen) return false; // don't mark degraded, just unavailable

    try {
        await Promise.race([
            redisClient.ping(),
            timeout(HEALTHCHECK_TIMEOUT_MS),
        ]);

        markRedisRecovered();

        return true;
    } catch {
        markRedisDegraded();

        return false;
    }
}

export async function disconnectRedis(): Promise<void> {
    try {
        if (redisClient.isOpen) {
            await redisClient.quit();

            logger.info({ event: "redis.disconnected_gracefully" }, "Redis disconnected gracefully");
        }
    } catch (err) {
        logger.warn(
            {
                event: "redis.disconnect_error",
                error: {
                    name: err instanceof Error ? err.name : "UnknownError",
                    message: err instanceof Error ? err.message : String(err),
                },
            },
            "Redis disconnect error",
        );

        try {
            redisClient.disconnect();
        } catch {
            // ignore hard disconnect errors
        }
    }
}

/**
 * Safe Redis operation wrapper.
 * Prevents Redis failures from crashing request handlers.
 */
export async function safeRedis<T>(
    operation: () => Promise<T>,
    fallback: T,
): Promise<T> {
    if (!isRedisAvailable()) {
        return fallback;
    }

    try {
        return await operation();
    } catch (err) {
        logger.warn(
            {
                event: "redis.operation_failed",
                error: {
                    name: err instanceof Error ? err.name : "UnknownError",
                    message: err instanceof Error ? err.message : String(err),
                },
            },
            "Redis operation failed",
        );

        return fallback;
    }
}
