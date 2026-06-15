import type { AxiosRequestConfig } from "axios";
import { requestContextStore } from "./context.js";

export function getCorrelationHeaders(): Record<string, string> {
    const context = requestContextStore.getStore();
    if (!context) return {};

    const headers: Record<string, string> = {};
    if (context.requestId) {
        headers["x-request-id"] = context.requestId;
    }
    if (context.traceId) {
        headers["traceparent"] =
            `00-${context.traceId}-${context.spanId ?? "0000000000000000"}-01`;
    }
    return headers;
}

export function addCorrelationHeaders(
    config: AxiosRequestConfig,
): AxiosRequestConfig {
    const headers = getCorrelationHeaders();
    return {
        ...config,
        headers: {
            ...config.headers,
            ...headers,
        },
    };
}
