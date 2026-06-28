import assert from "node:assert/strict";
import test from "node:test";

process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.OPENROUTER_API_KEY = "test-key";
process.env.MODEL_NAME = "test-model";

const { prisma } = await import("../src/db/PrismaClient.js");
const { disconnectDatabase } = await import("../src/db/db.js");

const originalDisconnect = prisma.$disconnect;

test.afterEach(() => {
    prisma.$disconnect = originalDisconnect;
});

test("disconnectDatabase closes the Prisma client", async () => {
    let disconnectCalled = false;
    prisma.$disconnect = (async () => {
        disconnectCalled = true;
    }) as typeof prisma.$disconnect;

    await disconnectDatabase();

    assert.equal(disconnectCalled, true);
});

test("disconnectDatabase does not throw when Prisma disconnect fails", async () => {
    prisma.$disconnect = (async () => {
        throw new Error("disconnect failed");
    }) as typeof prisma.$disconnect;

    await assert.doesNotReject(disconnectDatabase());
});
