import { createMedicineLogger } from "../logging/logger.js";
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
    const rawProducts = await searchExternalMedicines(query, page, pageSize);
    return mapExternalSearchItems(rawProducts);
}

export async function getMedicineDetails(
    slug: string,
): Promise<MedicineDetailsResult | null> {
    const cached = await getMedicineDetailsFromCache(slug);
    if (cached) {
        return cached;
    }

    const product = await getExternalMedicineDetails(slug);
    if (!product) {
        medicineLogger.info(
            {
                event: "medicine_details.not_found",
                slug,
            },
            "medicine details not found for slug",
        );
        return null;
    }

    const result = mapExternalMedicineDetails(product);

    await setMedicineDetailsInCache(slug, result);

    return result;
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