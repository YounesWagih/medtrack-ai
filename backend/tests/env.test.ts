import assert from "node:assert/strict";
import test from "node:test";
import { ZodError } from "zod";

process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
process.env.OPENROUTER_API_KEY = "test-key";
process.env.MODEL_NAME = "test-model";

const { parseEnv } = await import("../src/config/env.js");

const baseEnv = {
    JWT_SECRET: "test-secret-that-is-at-least-thirty-two-characters",
    OPENROUTER_API_KEY: "test-key",
    MODEL_NAME: "test-model",
};

test("parseEnv defaults medicine expiring soon days", () => {
    const parsed = parseEnv(baseEnv);

    assert.equal(parsed.MEDICINE_EXPIRING_SOON_DAYS, 30);
});

test("parseEnv accepts nonnegative integer medicine expiring soon days", () => {
    const parsed = parseEnv({
        ...baseEnv,
        MEDICINE_EXPIRING_SOON_DAYS: "14",
    });

    assert.equal(parsed.MEDICINE_EXPIRING_SOON_DAYS, 14);
});

test("parseEnv rejects negative medicine expiring soon days", () => {
    assert.throws(
        () => parseEnv({
            ...baseEnv,
            MEDICINE_EXPIRING_SOON_DAYS: "-1",
        }),
        ZodError,
    );
});

test("parseEnv rejects fractional medicine expiring soon days", () => {
    assert.throws(
        () => parseEnv({
            ...baseEnv,
            MEDICINE_EXPIRING_SOON_DAYS: "1.5",
        }),
        ZodError,
    );
});
