import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
    requestId: string;
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
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
    parentSpanId?: string;
} {
    const store = requestContextStore.getStore();
    if (!store) {
        return {};
    }
    return {
        traceId: store.traceId,
        spanId: store.spanId,
        parentSpanId: store.parentSpanId,
    };
}

export function runWithContext<T>(
    context: RequestContext,
    callback: () => T,
): T {
    return requestContextStore.run(context, callback);
}
