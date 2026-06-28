import type { AxiosRequestConfig } from "axios";
import { requestContextStore } from "./context.js";
import { injectTraceHeaders } from "../tracing/tracing.js";

export function getCorrelationHeaders(): Record<string, string> {
    const context = requestContextStore.getStore();

    const headers: Record<string, string> = {};
    injectTraceHeaders(headers);

    if (context?.requestId) {
        headers["x-request-id"] = context.requestId;
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
