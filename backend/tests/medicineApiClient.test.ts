import assert from "node:assert/strict";
import test from "node:test";

process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
process.env.OPENROUTER_API_KEY = "test-key";
process.env.MODEL_NAME = "test-model";

const { getUpstreamFailureStatus } = await import("../src/clients/medicine-api.client.js");

test("medicine API failures map to upstream error statuses", () => {
    assert.equal(getUpstreamFailureStatus({ code: "ECONNABORTED" }), 504);
    assert.equal(getUpstreamFailureStatus({ code: "ETIMEDOUT" }), 504);
    assert.equal(getUpstreamFailureStatus({ statusCode: 429 }), 503);
    assert.equal(getUpstreamFailureStatus({ statusCode: 500 }), 503);
    assert.equal(getUpstreamFailureStatus({ statusCode: 403 }), 502);
    assert.equal(getUpstreamFailureStatus({}), 502);
});
