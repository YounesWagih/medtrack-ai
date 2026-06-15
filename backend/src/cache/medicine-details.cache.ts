import { createHash } from "node:crypto";
import { redisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import { createRedisLogger } from "../logging/logger.js";
import {
    MedicineDetailsResult,
} from "../schemas/external-api.schema.js";
import { getSafeErrorFields } from "../utils/error-utils.js";

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
    const slugHash = hashSlug(slug);
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
                        slugHash,
                    },
                    "cache hit for medicine details",
                );
                return parsed;
            } catch (parseErr) {
                redisLogger.warn(
                    {
                        event: "cache.read_failed",
                        cacheNamespace: CACHE_NAMESPACE,
                        slugHash,
                        error: { message: (parseErr as Error).message },
                    },
                    "corrupted cache entry, fetching from API",
                );
                return null;
            }
        }

        redisLogger.debug(
            {
                event: "cache.miss",
                cacheNamespace: CACHE_NAMESPACE,
                slugHash,
            },
            "cache miss for medicine details",
        );
        return null;
    } catch (err) {
        redisLogger.warn(
            {
                event: "cache.read_failed",
                cacheNamespace: CACHE_NAMESPACE,
                slugHash,
                error: getSafeErrorFields(err),
            },
            "cache read failed",
        );
        return null;
    }
}

export async function setMedicineDetailsInCache(
    slug: string,
    result: MedicineDetailsResult,
): Promise<void> {
    const slugHash = hashSlug(slug);
    const cacheKey = getCacheKey(slug);

    try {
        await redisClient.set(cacheKey, JSON.stringify(result), {
            EX: env.MEDICINE_DETAILS_CACHE_TTL,
        });
        redisLogger.debug(
            {
                event: "cache.set",
                cacheNamespace: CACHE_NAMESPACE,
                slugHash,
                ttl: env.MEDICINE_DETAILS_CACHE_TTL,
            },
            "medicine details cached",
        );
    } catch (err) {
        redisLogger.warn(
            {
                event: "cache.write_failed",
                cacheNamespace: CACHE_NAMESPACE,
                slugHash,
                error: getSafeErrorFields(err),
            },
            "cache write failed",
        );
    }
}

export async function clearMedicineDetailsCacheEntry(
    slug: string,
): Promise<boolean> {
    const slugHash = hashSlug(slug);

    try {
        const result = await redisClient.del(getCacheKey(slug));
        redisLogger.info(
            {
                event: "cache.cleared",
                cacheNamespace: CACHE_NAMESPACE,
                slugHash,
            },
            "medicine details cache entry cleared",
        );
        return result > 0;
    } catch (err) {
        redisLogger.warn(
            {
                event: "cache.clear_failed",
                cacheNamespace: CACHE_NAMESPACE,
                slugHash,
                error: getSafeErrorFields(err),
            },
            "cache clear failed",
        );
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