import axios from "axios";
import { convert } from "html-to-text";
import {
    ExternalMedicineSearchResponse,
    ExternalMedicineDetailsResponse,
    MedicineSearchResult,
    MedicineDetailsResult,
} from "../schemas/external-api.schema.js";

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
    try {
        const response = await externalApiClient.get<ExternalMedicineDetailsResponse>(
            `/products/${slug}/slug`,
            {
                params: { ignore_similar_products: 1 },
            },
        );

        const product = response.data.data.product;

        return {
            name_en: product.name_en,
            name_ar: product.name_ar,
            image: product.image,
            description: convert(product.description_ar),
            longDescription: product.long_description_ar,
        };
    } catch (error) {
        console.error("Error getting medicine details:", error);
        return null;
    }
}