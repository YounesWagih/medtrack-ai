import { createHash } from "node:crypto";
import { createMedicineLogger } from "../logging/logger.js";
import { getSafeErrorFields } from "../utils/error-utils.js";
import {
    mapExternalSearchItems,
    mapExternalMedicineDetails,
} from "../mappers/medicine-api.mapper.js";
import {
    getMedicineDetailsFromCache,
    setMedicineDetailsInCache,
    clearMedicineDetailsCacheEntry,
    clearAllMedicineDetailsCacheEntries,
    getStats,
} from "../cache/medicine-details.cache.js";
import {
    searchExternalMedicines,
    getExternalMedicineDetails,
} from "../clients/medicine-api.client.js";
import {
    MedicineDetailsResult,
    MedicineSearchResult,
} from "../schemas/external-api.schema.js";

const medicineLogger = createMedicineLogger();

export async function searchMedicines(
    query: string,
    page: number = 1,
    pageSize: number = 24,
): Promise<MedicineSearchResult[]> {
    const start = Date.now();
    try {
        const rawProducts = await searchExternalMedicines(query, page, pageSize);
        const results = mapExternalSearchItems(rawProducts);

        const durationMs = Date.now() - start;
        medicineLogger.info(
            {
                event: "medicine_search.completed",
                queryLength: query.length,
                page,
                pageSize,
                resultCount: results.length,
                durationMs,
            },
            "medicine search completed",
        );

        return results;
    } catch (error) {
        const durationMs = Date.now() - start;
        const safeFields = getSafeErrorFields(error);

        medicineLogger.warn(
            {
                event: "medicine_search.failed",
                durationMs,
                error: safeFields,
                fallback: "empty_results",
            },
            "medicine search failed, returning empty results",
        );
        return [];
    }
}

export async function getMedicineDetails(
    slug: string,
): Promise<MedicineDetailsResult | null> {
    const start = Date.now();

    const cached = await getMedicineDetailsFromCache(slug);
    if (cached) {
        const durationMs = Date.now() - start;
        medicineLogger.info(
            {
                event: "medicine_details.completed",
                slugHash: hashedSlug(slug),
                durationMs,
                cacheHit: true,
            },
            "medicine details retrieved from cache",
        );
        return cached;
    }

    try {
        const product = await getExternalMedicineDetails(slug);

        if (!product) {
            const durationMs = Date.now() - start;
            medicineLogger.info(
                {
                    event: "medicine_details.not_found",
                    slugHash: hashedSlug(slug),
                    durationMs,
                },
                "medicine details not found for slug",
            );
            return null;
        }

        const result = mapExternalMedicineDetails(product);

        await setMedicineDetailsInCache(slug, result);

        const durationMs = Date.now() - start;
        medicineLogger.info(
            {
                event: "medicine_details.completed",
                slugHash: hashedSlug(slug),
                durationMs,
                cacheHit: false,
            },
            "medicine details retrieved from API",
        );

        return result;
    } catch (error) {
        const durationMs = Date.now() - start;
        const safeFields = getSafeErrorFields(error);

        medicineLogger.warn(
            {
                event: "medicine_details.failed",
                slugHash: hashedSlug(slug),
                durationMs,
                error: safeFields,
            },
            "medicine details lookup failed",
        );
        return null;
    }
}

export async function clearMedicineDetailsCache(
    slug: string,
): Promise<boolean> {
    return clearMedicineDetailsCacheEntry(slug);
}

export async function clearAllMedicineDetailsCache(): Promise<void> {
    return clearAllMedicineDetailsCacheEntries();
}

export async function getCacheStats(): Promise<{ keys: number }> {
    return getStats();
}

function hashedSlug(slug: string): string {
    return createHash("sha256").update(slug).digest("hex").slice(0, 16);
}