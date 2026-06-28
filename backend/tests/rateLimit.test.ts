import assert from "node:assert/strict";
import test from "node:test";

process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
process.env.OPENROUTER_API_KEY = "test-key";
process.env.MODEL_NAME = "test-model";

const { APIError } = await import("../src/errors/APIError.js");
const { createRateLimitMiddleware } = await import("../src/middlewares/rateLimit.js");

const req = {
    user: {
        userId: "user-1",
    },
};

test("rate limit middleware calls next when the limiter allows the request", async () => {
    let consumedKey: string | undefined;
    let nextCalled = false;
    const middleware = createRateLimitMiddleware({
        consume: async (key) => {
            consumedKey = key;
        },
    });

    await middleware(req as never, {} as never, () => {
        nextCalled = true;
    });

    assert.equal(consumedKey, "user-1");
    assert.equal(nextCalled, true);
});

test("rate limit middleware returns 429 for quota rejections", async () => {
    const middleware = createRateLimitMiddleware({
        consume: async () => {
            throw { msBeforeNext: 2_000 };
        },
    });

    await assert.rejects(
        middleware(req as never, {} as never, () => undefined),
        (error) => {
            assert.ok(error instanceof APIError);
            assert.equal(error.statusCode, 429);
            assert.match(error.message, /Too many requests/);
            return true;
        },
    );
});

test("rate limit middleware returns 503 for unexpected limiter failures", async () => {
    let nextCalled = false;
    const middleware = createRateLimitMiddleware({
        consume: async () => {
            throw new Error("Redis connection dropped");
        },
    });

    await assert.rejects(
        middleware(req as never, {} as never, () => {
            nextCalled = true;
        }),
        (error) => {
            assert.ok(error instanceof APIError);
            assert.equal(error.statusCode, 503);
            assert.equal(error.message, "Rate limiter unavailable");
            return true;
        },
    );
    assert.equal(nextCalled, false);
});
