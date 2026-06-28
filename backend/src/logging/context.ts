import { AsyncLocalStorage } from "node:async_hooks";
import { getActiveSpanContext } from "../tracing/tracing.js";

export interface RequestContext {
    requestId: string;
    traceId?: string;
    userId?: string;
    route?: string;
    method?: string;
    path?: string;
    jobRunId?: string;
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();

export function updateRequestContext(partial: Partial<RequestContext>): void {
    const store = requestContextStore.getStore();

    if (!store) {
        return;
    }

    Object.assign(store, partial);
}

export function setUserId(userId: string): void {
    updateRequestContext({ userId });
}

export function getUserIdFromContext(): string | undefined {
    return requestContextStore.getStore()?.userId;
}

export function getTraceContext(): {
    traceId?: string;
    spanId?: string;
} {
    const activeTrace = getActiveSpanContext();
    if (activeTrace.traceId || activeTrace.spanId) {
        return {
            traceId: activeTrace.traceId,
            spanId: activeTrace.spanId,
        };
    }

    const store = requestContextStore.getStore();
    if (!store) {
        return {};
    }
    return {
        traceId: store.traceId,
    };
}

export function runWithContext<T>(
    context: RequestContext,
    callback: () => T,
): T {
    const activeTrace = getActiveSpanContext();
    return requestContextStore.run({
        ...context,
        traceId: activeTrace.traceId ?? context.traceId,
    }, callback);
}
