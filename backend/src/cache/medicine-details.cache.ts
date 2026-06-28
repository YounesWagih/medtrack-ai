import { createHash } from "node:crypto";
import { redisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import { createRedisLogger } from "../logging/logger.js";
import {
    MedicineDetailsResult,
} from "../schemas/external-api.schema.js";
import { getSafeErrorFields } from "../utils/error-utils.js";
import { cacheOperationsTotal, recordMetric } from "../metrics/metrics.js";
import { withSpan } from "../tracing/spans.js";

const redisLogger = createRedisLogger();

const CACHE_NAMESPACE = "medicine-details";
const CACHE_SCAN_COUNT = 100;

function hashSlug(slug: string): string {
    return createHash("sha256").update(slug).digest("hex").slice(0, 16);
}

function getCacheKey(slug: string): string {
    return `${CACHE_NAMESPACE}:${hashSlug(slug)}`;
}

function getScanPattern(): string {
    return `${CACHE_NAMESPACE}:*`;
}

async function scanMedicineDetailsKeys(): Promise<string[]> {
    const keys: string[] = [];

    for await (const key of redisClient.scanIterator({
        MATCH: getScanPattern(),
        COUNT: CACHE_SCAN_COUNT,
    })) {
        keys.push(key);
    }

    return keys;
}

export async function getMedicineDetailsFromCache(
    slug: string,
): Promise<MedicineDetailsResult | null> {
    return await withSpan(
        "cache.medicine_details.read",
        {
            "cache.namespace": CACHE_NAMESPACE,
            "cache.operation": "read",
        },
        async (span) => {
    const cacheKey = getCacheKey(slug);

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached) as MedicineDetailsResult;
                redisLogger.debug(
                    {
                        event: "cache.hit",
                        cacheNamespace: CACHE_NAMESPACE,
                        slug,
                    },
                    "cache hit for medicine details",
                );
                recordMetric(() => cacheOperationsTotal.inc({ namespace: CACHE_NAMESPACE, operation: "read", outcome: "hit" }));
                span.setAttribute("cache.outcome", "hit");
                return parsed;
            } catch (parseErr) {
                redisLogger.warn(
                    {
                        event: "cache.read_failed",
                        cacheNamespace: CACHE_NAMESPACE,
                        slug,
                        error: { message: (parseErr as Error).message },
                    },
                    "corrupted cache entry, fetching from API",
                );
                recordMetric(() => cacheOperationsTotal.inc({ namespace: CACHE_NAMESPACE, operation: "read", outcome: "corrupt" }));
                span.setAttribute("cache.outcome", "corrupt");
                return null;
            }
        }

        redisLogger.debug(
            {
                event: "cache.miss",
                cacheNamespace: CACHE_NAMESPACE,
                slug,
            },
            "cache miss for medicine details",
        );
        recordMetric(() => cacheOperationsTotal.inc({ namespace: CACHE_NAMESPACE, operation: "read", outcome: "miss" }));
        span.setAttribute("cache.outcome", "miss");
        return null;
    } catch (err) {
        redisLogger.warn(
            {
                event: "cache.read_failed",
                cacheNamespace: CACHE_NAMESPACE,
                slug,
                error: getSafeErrorFields(err),
            },
            "cache read failed",
        );
        recordMetric(() => cacheOperationsTotal.inc({ namespace: CACHE_NAMESPACE, operation: "read", outcome: "failure" }));
        span.setAttribute("cache.outcome", "failure");
        return null;
    }
        },
    );
}

export async function setMedicineDetailsInCache(
    slug: string,
    result: MedicineDetailsResult,
): Promise<void> {
    await withSpan(
        "cache.medicine_details.write",
        {
            "cache.namespace": CACHE_NAMESPACE,
            "cache.operation": "write",
        },
        async (span) => {
    const cacheKey = getCacheKey(slug);

    try {
        await redisClient.set(cacheKey, JSON.stringify(result), {
            EX: env.MEDICINE_DETAILS_CACHE_TTL,
        });
        redisLogger.debug(
            {
                event: "cache.set",
                cacheNamespace: CACHE_NAMESPACE,
                slug,
                ttl: env.MEDICINE_DETAILS_CACHE_TTL,
            },
            "medicine details cached",
        );
        recordMetric(() => cacheOperationsTotal.inc({ namespace: CACHE_NAMESPACE, operation: "write", outcome: "success" }));
        span.setAttribute("cache.outcome", "success");
    } catch (err) {
        redisLogger.warn(
            {
                event: "cache.write_failed",
                cacheNamespace: CACHE_NAMESPACE,
                slug,
                error: getSafeErrorFields(err),
            },
            "cache write failed",
        );
        recordMetric(() => cacheOperationsTotal.inc({ namespace: CACHE_NAMESPACE, operation: "write", outcome: "failure" }));
        span.setAttribute("cache.outcome", "failure");
    }
        },
    );
}

export async function clearMedicineDetailsCacheEntry(
    slug: string,
): Promise<boolean> {
    try {
        const result = await redisClient.del(getCacheKey(slug));
        redisLogger.info(
            {
                event: "cache.cleared",
                cacheNamespace: CACHE_NAMESPACE,
                slug,
            },
            "medicine details cache entry cleared",
        );
        recordMetric(() => cacheOperationsTotal.inc({ namespace: CACHE_NAMESPACE, operation: "clear", outcome: "success" }));
        return result > 0;
    } catch (err) {
        redisLogger.warn(
            {
                event: "cache.clear_failed",
                cacheNamespace: CACHE_NAMESPACE,
                slug,
                error: getSafeErrorFields(err),
            },
            "cache clear failed",
        );
        recordMetric(() => cacheOperationsTotal.inc({ namespace: CACHE_NAMESPACE, operation: "clear", outcome: "failure" }));
        return false;
    }
}

export async function clearAllMedicineDetailsCacheEntries(): Promise<void> {
    try {
        const keys = await scanMedicineDetailsKeys();
        if (keys.length > 0) {
            await redisClient.del(keys);
            redisLogger.info(
                {
                    event: "cache.cleared",
                    cacheNamespace: CACHE_NAMESPACE,
                    clearedCount: keys.length,
                },
                "all medicine details cache cleared",
            );
        }
    } catch (err) {
        redisLogger.warn(
            {
                event: "cache.clear_failed",
                cacheNamespace: CACHE_NAMESPACE,
                error: getSafeErrorFields(err),
            },
            "cache clear failed",
        );
    }
}

export async function getStats(): Promise<{ keys: number }> {
    try {
        const keys = await scanMedicineDetailsKeys();
        return { keys: keys.length };
    } catch (err) {
        redisLogger.warn(
            {
                event: "cache.stats_failed",
                cacheNamespace: CACHE_NAMESPACE,
                error: getSafeErrorFields(err),
            },
            "cache stats failed",
        );
        return { keys: 0 };
    }
}
