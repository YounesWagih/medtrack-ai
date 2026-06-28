import assert from "node:assert/strict";
import test from "node:test";
import { context, propagation, trace, TraceFlags } from "@opentelemetry/api";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";

process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
process.env.OPENROUTER_API_KEY = "test-key";
process.env.MODEL_NAME = "test-model";
process.env.TRACING_ENABLED = "false";

context.setGlobalContextManager(new AsyncHooksContextManager().enable());
propagation.setGlobalPropagator(new W3CTraceContextPropagator());

const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
const spanId = "00f067aa0ba902b7";
const activeContext = trace.setSpanContext(
    context.active(),
    {
        traceId,
        spanId,
        traceFlags: TraceFlags.SAMPLED,
    },
);

test("active OpenTelemetry span context is exposed to request context", async () => {
    const { getTraceContext } = await import("../src/logging/context.js");

    context.with(activeContext, () => {
        assert.deepEqual(getTraceContext(), { traceId, spanId });
    });
});

test("request middleware stores request ID separately from trace IDs", async () => {
    const { requestIdMiddleware } = await import("../src/middlewares/requestId.js");
    const { requestContextStore } = await import("../src/logging/context.js");

    const req = {
        method: "GET",
        path: "/health",
        headers: { "x-request-id": "req-test-1" },
    };
    const res = {
        headers: new Map<string, string>(),
        setHeader(name: string, value: string) {
            this.headers.set(name, value);
        },
    };

    context.with(activeContext, () => {
        requestIdMiddleware(req as never, res as never, () => undefined);
    });

    const store = requestContextStore.getStore();
    assert.equal(res.headers.get("x-request-id"), "req-test-1");
    assert.equal(store?.requestId, "req-test-1");
    assert.equal(store?.traceId, traceId);
});

test("correlation headers inject W3C traceparent and preserve x-request-id", async () => {
    const { requestContextStore } = await import("../src/logging/context.js");
    const { getCorrelationHeaders } = await import("../src/logging/propagation.js");

    context.with(activeContext, () => {
        requestContextStore.run({ requestId: "req-test-2" }, () => {
            const headers = getCorrelationHeaders();
            assert.equal(headers["x-request-id"], "req-test-2");
            assert.match(
                headers.traceparent,
                new RegExp(`^00-${traceId}-${spanId}-0?1$`),
            );
        });
    });
});
