import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import {
    externalOutcome,
    metricsRegistry,
    statusClass,
} from "../src/metrics/metrics.js";
import { httpMetricsMiddleware } from "../src/middlewares/httpMetrics.js";

test.beforeEach(() => {
    metricsRegistry.resetMetrics();
});

test("HTTP metrics use normalized route templates and bounded status labels", async () => {
    const req = {
        method: "GET",
        baseUrl: "/api/v1/medicines",
        originalUrl: "/api/v1/medicines/3c1f70cb-74ac-4bd7-9174-1e62419d2048",
        route: { path: "/:id" },
    };
    const res = Object.assign(new EventEmitter(), { statusCode: 200 });
    let nextCalled = false;

    httpMetricsMiddleware(req as never, res as never, () => { nextCalled = true; });
    res.emit("finish");

    const output = await metricsRegistry.metrics();
    assert.equal(nextCalled, true);
    assert.match(output, /route="\/api\/v1\/medicines\/:id"/);
    assert.match(output, /status_code="200"/);
    assert.doesNotMatch(output, /userId|medicineId|requestId|traceId/);
});

test("unmatched requests never expose their raw URL", async () => {
    const secretPath = "/users/3c1f70cb-74ac-4bd7-9174-1e62419d2048";
    const req = { method: "GET", baseUrl: "", originalUrl: secretPath };
    const res = Object.assign(new EventEmitter(), { statusCode: 404 });

    httpMetricsMiddleware(req as never, res as never, () => undefined);
    res.emit("finish");

    const output = await metricsRegistry.metrics();
    assert.match(output, /route="unknown"/);
    assert.doesNotMatch(output, new RegExp(secretPath));
});

test("status classes and external failure outcomes are bounded", () => {
    assert.equal(statusClass(201), "2xx");
    assert.equal(statusClass(undefined), "unknown");
    assert.equal(externalOutcome({ code: "ECONNABORTED" }), "timeout");
    assert.equal(externalOutcome({ response: { status: 429 } }), "rate_limited");
    assert.equal(externalOutcome(new Error("private dynamic text")), "error");
});

test("disabled metrics mode starts no listener", async () => {
    process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.MODEL_NAME = "test-model";
    process.env.METRICS_ENABLED = "false";

    const { startMetricsServer } = await import("../src/metrics/server.js");
    assert.equal(await startMetricsServer(), null);
});
