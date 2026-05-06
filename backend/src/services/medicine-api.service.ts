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

const EXTERNAL_API_BASE = "https://api.alabdellatif-tarshouby.com/api/customer";
const REQUEST_TIMEOUT = 5000;

const externalApiClient = axios.create({
    baseURL: EXTERNAL_API_BASE,
    timeout: REQUEST_TIMEOUT,
});

export async function searchMedicines(
    query: string,
    page: number = 1,
    pageSize: number = 24,
): Promise<MedicineSearchResult[]> {
    try {
        const response = await externalApiClient.post<
            ExternalMedicineSearchResponse
        >("/products/search", {
            q: query,
            page,
            page_size: pageSize,
        });

        const products = response.data.data.products;

        return products.map(({ name_ar, name_en, slug, image }) => ({
            name_ar,
            name_en,
            slug,
            image,
        }));
    } catch (error) {
        console.error("Error searching medicines:", error);
        return [];
    }
}

export async function getMedicineDetails(
    slug: string,
): Promise<MedicineDetailsResult | null> {
    const cacheKey = `medicine-details:${slug}`;

    // Try cache first
    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log(`[Cache Hit] Medicine details for slug: ${slug}`);
            return JSON.parse(cached) as MedicineDetailsResult;
        }
    } catch (cacheErr) {
        console.warn('Cache read error:', cacheErr);
        // Continue to fetch from API even if cache fails
    }

    try {
        const response = await externalApiClient.get<ExternalMedicineDetailsResponse>(
            `/products/${slug}/slug`,
            {
                params: { ignore_similar_products: 1 },
            },
        );
        const product = response.data.data.product;
        
        const result: MedicineDetailsResult = {
            name_en: product.name_en,
            name_ar: product.name_ar,
            image: product.image,
            description: convert(product.description_ar),
            longDescription: product.long_description_ar,
        };

        // Store in cache (async, don't block response)
        try {
            await redisClient.set(
                cacheKey,
                JSON.stringify(result),
                { EX: env.MEDICINE_DETAILS_CACHE_TTL }
            );
            console.log(`[Cache Set] Medicine details cached for slug: ${slug}`);
        } catch (cacheErr) {
            console.warn('Cache write error:', cacheErr);
        }

        return result;
    } catch (error) {
        console.error("Error getting medicine details:", error);
        return null;
    }
}

export async function clearMedicineDetailsCache(slug: string): Promise<boolean> {
    try {
        const result = await redisClient.del(`medicine-details:${slug}`);
        return result > 0;
    } catch (err) {
        console.error('Cache clear error:', err);
        return false;
    }
}

export async function clearAllMedicineDetailsCache(): Promise<void> {
    try {
        const keys = await redisClient.keys('medicine-details:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`[Cache Clear] Cleared ${keys.length} medicine details`);
        }
    } catch (err) {
        console.error('Cache clear error:', err);
    }
}

export async function getCacheStats(): Promise<{
    keys: number;
}> {
    try {
        const keys = await redisClient.keys('medicine-details:*');
        return { keys: keys.length };
    } catch (err) {
        console.error('Cache stats error:', err);
        return { keys: 0 };
    }
}

export async function checkRedisHealth(): Promise<boolean> {
    try {
        await redisClient.ping();
        return true;
    } catch {
        return false;
    }
}