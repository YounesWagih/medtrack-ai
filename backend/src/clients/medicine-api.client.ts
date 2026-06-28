import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import {
    ExternalMedicineDetails,
    ExternalMedicineSearchItem,
} from "../schemas/external-api.schema.js";
import { APIError } from "../errors/APIError.js";
import { createExternalApiLogger } from "../logging/logger.js";
import { getCorrelationHeaders } from "../logging/propagation.js";
import { getSafeAxiosErrorFields } from "../utils/error-utils.js";
import {
    externalOutcome,
    externalRequestDuration,
    externalRequestsTotal,
    recordMetric,
    statusClass,
} from "../metrics/metrics.js";
import { withSpan } from "../tracing/spans.js";

const externalApiLogger = createExternalApiLogger();
const EXTERNAL_API_BASE = "https://api.alabdellatif-tarshouby.com/api/customer";
const REQUEST_TIMEOUT = 5000;

const externalApiClient = axios.create({
    baseURL: EXTERNAL_API_BASE,
    timeout: REQUEST_TIMEOUT,
});

export function getUpstreamFailureStatus(errorFields: { code?: string; statusCode?: number }): number {
    if (errorFields.code === "ECONNABORTED" || errorFields.code === "ETIMEDOUT") {
        return 504;
    }

    if (errorFields.statusCode === 429 || (errorFields.statusCode && errorFields.statusCode >= 500)) {
        return 503;
    }

    return 502;
}

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
        const response = await withSpan(
            "medicine_api.search",
            {
                "dependency.name": "medicine_api",
                "dependency.operation": "search",
                "http.request.method": "POST",
            },
            () => externalApiClient.post(
                "/products/search",
                {
                    q: query,
                    page,
                    page_size: pageSize,
                },
            ),
        );

        const durationMs = Date.now() - start;
        recordMetric(() => {
            externalRequestsTotal.inc({ dependency: "medicine_api", operation: "search", outcome: "success", status_class: statusClass(response.status) });
            externalRequestDuration.observe({ dependency: "medicine_api", operation: "search", outcome: "success" }, durationMs / 1000);
        });

        externalApiLogger.info(
            {
                event: "med_api.request.completed",
                endpoint: "/products/search",
                method: "POST",
                durationMs,
                statusCode: response.status,
            },
            "medicine search request completed",
        );

        const products = response.data?.data?.products;
        if (!Array.isArray(products)) {
            throw new APIError("Medicine search service returned an invalid response", 502);
        }

        return products;
    } catch (error) {
        const durationMs = Date.now() - start;
        const safeFields = getSafeAxiosErrorFields(error);
        const outcome = externalOutcome(error);
        recordMetric(() => {
            externalRequestsTotal.inc({ dependency: "medicine_api", operation: "search", outcome, status_class: statusClass(safeFields.statusCode) });
            externalRequestDuration.observe({ dependency: "medicine_api", operation: "search", outcome }, durationMs / 1000);
        });

        externalApiLogger.warn(
            {
                event: "med_api.request.failed",
                endpoint: "/products/search",
                method: "POST",
                durationMs,
                code: safeFields.code,
                statusCode: safeFields.statusCode,
                error: { message: safeFields.message, name: safeFields.name },
            },
            "medicine search request failed",
        );

        if (error instanceof APIError) {
            throw error;
        }

        throw new APIError(
            "Medicine search service unavailable",
            getUpstreamFailureStatus(safeFields),
        );
    }
}

export async function getExternalMedicineDetails(
    slug: string,
): Promise<ExternalMedicineDetails | null> {
    const start = Date.now();
    try {
        const response = await withSpan(
            "medicine_api.details",
            {
                "dependency.name": "medicine_api",
                "dependency.operation": "details",
                "http.request.method": "GET",
            },
            () => externalApiClient.get(
                `/products/${slug}/slug`,
                {
                    params: { ignore_similar_products: 1 },
                },
            ),
        );

        const durationMs = Date.now() - start;
        const product = response.data?.data?.product;
        recordMetric(() => {
            externalRequestsTotal.inc({ dependency: "medicine_api", operation: "details", outcome: "success", status_class: statusClass(response.status) });
            externalRequestDuration.observe({ dependency: "medicine_api", operation: "details", outcome: "success" }, durationMs / 1000);
        });

        externalApiLogger.info(
            {
                event: "med_api.request.completed",
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
        const outcome = externalOutcome(error);
        recordMetric(() => {
            externalRequestsTotal.inc({ dependency: "medicine_api", operation: "details", outcome, status_class: statusClass(safeFields.statusCode) });
            externalRequestDuration.observe({ dependency: "medicine_api", operation: "details", outcome }, durationMs / 1000);
        });

        externalApiLogger.warn(
            {
                event: "med_api.request.failed",
                endpoint: `/products/${slug}/slug`,
                method: "GET",
                durationMs,
                code: safeFields.code,
                statusCode: safeFields.statusCode,
                error: { message: safeFields.message, name: safeFields.name },
            },
            "medicine details request failed",
        );

        if (safeFields.statusCode === 404) {
            return null;
        }

        throw new APIError(
            "Medicine details service unavailable",
            getUpstreamFailureStatus(safeFields),
        );
    }
}
