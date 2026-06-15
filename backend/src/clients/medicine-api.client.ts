import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import {
    ExternalMedicineDetails,
    ExternalMedicineSearchItem,
} from "../schemas/external-api.schema.js";
import { createExternalApiLogger } from "../logging/logger.js";
import { getCorrelationHeaders } from "../logging/propagation.js";
import { getSafeAxiosErrorFields } from "../utils/error-utils.js";

const externalApiLogger = createExternalApiLogger();
const EXTERNAL_API_BASE = "https://api.alabdellatif-tarshouby.com/api/customer";
const REQUEST_TIMEOUT = 5000;

const externalApiClient = axios.create({
    baseURL: EXTERNAL_API_BASE,
    timeout: REQUEST_TIMEOUT,
});

externalApiClient.interceptors.request.use((config) => {
    const correlationHeaders = getCorrelationHeaders();
    return {
        ...config,
        headers: {
            ...config.headers,
            ...correlationHeaders,
        },
    } as typeof config;
});

export async function searchExternalMedicines(
    query: string,
    page: number,
    pageSize: number,
): Promise<ExternalMedicineSearchItem[]> {
    const start = Date.now();
    try {
        const response = await externalApiClient.post(
            "/products/search",
            {
                q: query,
                page,
                page_size: pageSize,
            },
        );

        const durationMs = Date.now() - start;

        externalApiLogger.info(
            {
                event: "external_api.request.completed",
                endpoint: "/products/search",
                method: "POST",
                durationMs,
                statusCode: response.status,
            },
            "medicine search request completed",
        );

        return response.data?.data?.products ?? [];
    } catch (error) {
        const durationMs = Date.now() - start;
        const safeFields = getSafeAxiosErrorFields(error);

        externalApiLogger.warn(
            {
                event: "external_api.request.failed",
                endpoint: "/products/search",
                method: "POST",
                durationMs,
                code: safeFields.code,
                statusCode: safeFields.statusCode,
                error: { message: safeFields.message, name: safeFields.name },
            },
            "medicine search request failed",
        );

        return [];
    }
}

export async function getExternalMedicineDetails(
    slug: string,
): Promise<ExternalMedicineDetails | null> {
    const start = Date.now();
    try {
        const response = await externalApiClient.get(
            `/products/${slug}/slug`,
            {
                params: { ignore_similar_products: 1 },
            },
        );

        const durationMs = Date.now() - start;
        const product = response.data?.data?.product;

        externalApiLogger.info(
            {
                event: "external_api.request.completed",
                endpoint: `/products/${slug}/slug`,
                method: "GET",
                durationMs,
                statusCode: response.status,
                found: !!product,
            },
            "medicine details request completed",
        );

        return product ?? null;
    } catch (error) {
        const durationMs = Date.now() - start;
        const safeFields = getSafeAxiosErrorFields(error);

        externalApiLogger.warn(
            {
                event: "external_api.request.failed",
                endpoint: `/products/${slug}/slug`,
                method: "GET",
                durationMs,
                code: safeFields.code,
                statusCode: safeFields.statusCode,
                error: { message: safeFields.message, name: safeFields.name },
            },
            "medicine details request failed",
        );

        return null;
    }
}