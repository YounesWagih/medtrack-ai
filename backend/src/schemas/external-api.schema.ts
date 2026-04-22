export interface ExternalMedicineSearchItem {
    name_ar: string;
    name_en: string;
    slug: string;
    image: string;
}

export interface ExternalMedicineSearchResponseData {
    products: ExternalMedicineSearchItem[];
}

export interface ExternalMedicineSearchResponse {
    data: ExternalMedicineSearchResponseData;
}

export interface ExternalMedicineDetails {
    name_en: string;
    name_ar: string;
    image: string;
    description_ar: string;
    long_description_ar: string;
}

export interface ExternalMedicineDetailsResponseData {
    product: ExternalMedicineDetails;
}

export interface ExternalMedicineDetailsResponse {
    data: ExternalMedicineDetailsResponseData;
}

export interface MedicineSearchResult {
    name_ar: string;
    name_en: string;
    slug: string;
    image: string;
}

export interface MedicineDetailsResult {
    name_en: string;
    name_ar: string;
    image: string;
    description: string;
    longDescription: string;
}