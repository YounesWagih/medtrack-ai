import assert from "node:assert/strict";
import test from "node:test";

process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
process.env.OPENROUTER_API_KEY = "test-key";
process.env.MODEL_NAME = "test-model";

const { APIError } = await import("../src/errors/APIError.js");
const { ResourceNotFoundError } = await import("../src/errors/DomainError.js");
const { loginWithDependencies } = await import("../src/services/auth.service.js");

const loginInput = {
    email: "user@example.com",
    password: "password123",
};

const userWithPassword = {
    id: "user-1",
    email: "user@example.com",
    name: "Test User",
    password: "hashed-password",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

test("login returns invalid credentials for unknown email", async () => {
    await assert.rejects(
        loginWithDependencies(loginInput, {
            findByemailWithPassword: async () => {
                throw new ResourceNotFoundError("User");
            },
            verifyPassword: async () => true,
            generateToken: () => "token",
        }),
        (error) => {
            assert.ok(error instanceof APIError);
            assert.equal(error.statusCode, 401);
            assert.equal(error.message, "Invalid credentials");
            return true;
        },
    );
});

test("login returns invalid credentials for wrong password", async () => {
    await assert.rejects(
        loginWithDependencies(loginInput, {
            findByemailWithPassword: async () => userWithPassword,
            verifyPassword: async () => false,
            generateToken: () => "token",
        }),
        (error) => {
            assert.ok(error instanceof APIError);
            assert.equal(error.statusCode, 401);
            assert.equal(error.message, "Invalid credentials");
            return true;
        },
    );
});

test("login returns sanitized user and token for valid credentials", async () => {
    const result = await loginWithDependencies(loginInput, {
        findByemailWithPassword: async () => userWithPassword,
        verifyPassword: async () => true,
        generateToken: (userId) => `token-for-${userId}`,
    });

    assert.deepEqual(result, {
        user: {
            id: "user-1",
            email: "user@example.com",
            name: "Test User",
            createdAt: userWithPassword.createdAt,
            updatedAt: userWithPassword.updatedAt,
        },
        token: "token-for-user-1",
    });
});
