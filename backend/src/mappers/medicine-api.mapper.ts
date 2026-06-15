import { convert } from "html-to-text";
import {
    ExternalMedicineDetails,
    ExternalMedicineSearchItem,
    MedicineDetailsResult,
    MedicineSearchResult,
} from "../schemas/external-api.schema.js";

export function mapExternalSearchItems(
    products: ExternalMedicineSearchItem[],
): MedicineSearchResult[] {
    return products.map((product) => ({
        name_ar: product.name_ar,
        name_en: product.name_en,
        slug: product.slug,
        image: product.image,
    }));
}

export function mapExternalMedicineDetails(
    product: ExternalMedicineDetails,
): MedicineDetailsResult {
    return {
        name_en: product.name_en,
        name_ar: product.name_ar,
        image: product.image,
        description: convert(product.description_ar ?? ""),
        longDescription: product.long_description_ar,
    };
}