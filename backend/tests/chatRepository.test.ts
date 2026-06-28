import assert from "node:assert/strict";
import test from "node:test";
import { ChatMessageRole } from "@prisma/client";

process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
process.env.OPENROUTER_API_KEY = "test-key";
process.env.MODEL_NAME = "test-model";

const { prisma } = await import("../src/db/PrismaClient.js");
const chatRepo = await import("../src/repositories/chat.repository.js");

const originalCreate = prisma.chatMessage.create;
const originalTransaction = prisma.$transaction;

test.afterEach(() => {
    prisma.chatMessage.create = originalCreate;
    prisma.$transaction = originalTransaction;
});

test("addConversationTurn persists user and assistant messages atomically", async () => {
    const createCalls: unknown[] = [];
    let transactionOperations: unknown[] = [];

    prisma.chatMessage.create = ((args: unknown) => {
        createCalls.push(args);
        return args;
    }) as typeof prisma.chatMessage.create;

    prisma.$transaction = (async (operations: unknown[]) => {
        transactionOperations = operations;
        return operations;
    }) as typeof prisma.$transaction;

    await chatRepo.addConversationTurn(
        "session-1",
        "Should I take Panadol?",
        "Please answer safety questions first.",
    );

    assert.equal(transactionOperations.length, 2);
    assert.deepEqual(transactionOperations, createCalls);
    assert.deepEqual(createCalls, [
        {
            data: {
                sessionId: "session-1",
                role: ChatMessageRole.USER,
                content: "Should I take Panadol?",
            },
            select: {
                id: true,
                sessionId: true,
                role: true,
                content: true,
                createdAt: true,
            },
        },
        {
            data: {
                sessionId: "session-1",
                role: ChatMessageRole.ASSISTANT,
                content: "Please answer safety questions first.",
            },
            select: {
                id: true,
                sessionId: true,
                role: true,
                content: true,
                createdAt: true,
            },
        },
    ]);
});
