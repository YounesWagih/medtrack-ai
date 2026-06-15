import axios from "axios";
import { convert } from "html-to-text";
import {
    ExternalMedicineSearchResponse,
    ExternalMedicineDetailsResponse,
    MedicineSearchResult,
    MedicineDetailsResult,
} from "../schemas/external-api.schema.js";
import { redisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import {
    createExternalApiLogger,
    createRedisLogger,
} from "../logging/logger.js";
import { createHash } from "node:crypto";

const externalApiLogger = createExternalApiLogger();
const redisLogger = createRedisLogger();
const EXTERNAL_API_BASE = "https://api.alabdellatif-tarshouby.com/api/customer";
const REQUEST_TIMEOUT = 5000;

const externalApiClient = axios.create({
    baseURL: EXTERNAL_API_BASE,
    timeout: REQUEST_TIMEOUT,
});

function hashSlug(slug: string): string {
    return createHash("sha256").update(slug).digest("hex").slice(0, 16);
}

export async function searchMedicines(
    query: string,
    page: number = 1,
    pageSize: number = 24,
): Promise<MedicineSearchResult[]> {
    const start = Date.now();
    try {
        const response =
            await externalApiClient.post<ExternalMedicineSearchResponse>(
                "/products/search",
                {
                    q: query,
                    page,
                    page_size: pageSize,
                },
            );

        const products = response.data.data.products;
        const durationMs = Date.now() - start;

        externalApiLogger.info(
            {
                event: "external_api.medicine_search.completed",
                dependency: "medicine-api",
                queryLength: query.length,
                queryHash: createHash("sha256")
                    .update(query)
                    .digest("hex")
                    .slice(0, 16),
                page,
                pageSize,
                resultCount: products.length,
                durationMs,
            },
            "medicine search completed",
        );

        return products.map(({ name_ar, name_en, slug, image }) => ({
            name_ar,
            name_en,
            slug,
            image,
        }));
    } catch (error) {
        //still not know what shape of failure response
        const durationMs = Date.now() - start;
        externalApiLogger.warn(
            {
                event: "external_api.medicine_search.failed",
                dependency: "medicine-api",
                code: (error as any).code,
                message: (error as Error).message,
                fallback: "empty_results",
                durationMs,
            },
            "medicine search failed, returning empty results",
        );
        return [];
    }
}

export async function getMedicineDetails(
    slug: string,
): Promise<MedicineDetailsResult | null> {
    const cacheKey = `medicine-details:${slug}`;
    const slugHash = hashSlug(slug);

    // Try cache first
    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            redisLogger.debug(
                {
                    event: "cache.hit",
                    cacheNamespace: "medicine-details",
                    slugHash,
                    ttl: env.MEDICINE_DETAILS_CACHE_TTL,
                },
                "cache hit for medicine details",
            );
            return JSON.parse(cached) as MedicineDetailsResult;
        }
    } catch (cacheErr) {
        redisLogger.warn(
            {
                event: "cache.read_failed",
                cacheNamespace: "medicine-details",
                slugHash,
                error: { message: (cacheErr as Error).message },
            },
            "cache read failed",
        );
        // Continue to fetch from API even if cache fails
    }

    try {
        const response =
            await externalApiClient.get<ExternalMedicineDetailsResponse>(
                `/products/${slug}/slug`,
                {
                    params: { ignore_similar_products: 1 },
                },
            );
        const product = response.data?.data?.product;

        if (!product) {
            externalApiLogger.warn(
                { event: "external_api.medicine_details.not_found", slugHash },
                "product not found for slug",
            );
            return null;
        }

        const result: MedicineDetailsResult = {
            name_en: product.name_en,
            name_ar: product.name_ar,
            image: product.image,
            description: convert(product.description_ar),
            longDescription: product.long_description_ar,
        };

        // Store in cache (async, don't block response)
        try {
            await redisClient.set(cacheKey, JSON.stringify(result), {
                EX: env.MEDICINE_DETAILS_CACHE_TTL,
            });
            redisLogger.debug(
                {
                    event: "cache.set",
                    cacheNamespace: "medicine-details",
                    slugHash,
                    ttl: env.MEDICINE_DETAILS_CACHE_TTL,
                },
                "medicine details cached",
            );
        } catch (cacheErr) {
            redisLogger.warn(
                {
                    event: "cache.write_failed",
                    cacheNamespace: "medicine-details",
                    slugHash,
                    error: { message: (cacheErr as Error).message },
                },
                "cache write failed",
            );
        }

        return result;
    } catch (error) {
        externalApiLogger.warn(
            {
                event: "external_api.medicine_details.failed",
                slugHash,
                error: { message: (error as Error).message },
            },
            "medicine details api failed",
        );
        return null;
    }
}

export async function clearMedicineDetailsCache(
    slug: string,
): Promise<boolean> {
    try {
        const result = await redisClient.del(`medicine-details:${slug}`);
        return result > 0;
    } catch (err) {
        redisLogger.warn(
            {
                event: "cache.clear_failed",
                cacheNamespace: "medicine-details",
                error: { message: (err as Error).message },
            },
            "cache clear failed",
        );
        return false;
    }
}

export async function clearAllMedicineDetailsCache(): Promise<void> {
    try {
        const keys = await redisClient.keys("medicine-details:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
            redisLogger.info(
                {
                    event: "cache.cleared",
                    cacheNamespace: "medicine-details",
                    clearedCount: keys.length,
                },
                "medicine details cache cleared",
            );
        }
    } catch (err) {
        redisLogger.warn(
            {
                event: "cache.clear_failed",
                cacheNamespace: "medicine-details",
                error: { message: (err as Error).message },
            },
            "cache clear failed",
        );
    }
}

export async function getCacheStats(): Promise<{
    keys: number;
}> {
    try {
        const keys = await redisClient.keys("medicine-details:*");
        return { keys: keys.length };
    } catch (err) {
        redisLogger.warn(
            {
                event: "cache.stats_failed",
                cacheNamespace: "medicine-details",
                error: { message: (err as Error).message },
            },
            "cache stats failed",
        );
        return { keys: 0 };
    }
}
