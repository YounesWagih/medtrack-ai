import assert from "node:assert/strict";
import test from "node:test";
import { MedicineStatus } from "@prisma/client";

process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.OPENROUTER_API_KEY = "test-key";
process.env.MODEL_NAME = "test-model";

const { prisma } = await import("../src/db/PrismaClient.js");
const medicineRepo = await import("../src/repositories/medicine.repository.js");

const originalFindFirstOrThrow = prisma.medicine.findFirstOrThrow;
const originalUpdate = prisma.medicine.update;

test.afterEach(() => {
    prisma.medicine.findFirstOrThrow = originalFindFirstOrThrow;
    prisma.medicine.update = originalUpdate;
});

function medicineRecord(status: MedicineStatus = MedicineStatus.ACTIVE) {
    return {
        id: "medicine-1",
        userId: "user-1",
        name: "Panadol",
        expiryDate: new Date("2026-12-31T00:00:00.000Z"),
        status,
        description: null,
        longDescription: null,
        image: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
}

test("findByIdForUser excludes removed medicines", async () => {
    let query: unknown;
    prisma.medicine.findFirstOrThrow = (async (args: unknown) => {
        query = args;
        return medicineRecord();
    }) as typeof prisma.medicine.findFirstOrThrow;

    await medicineRepo.findByIdForUser("medicine-1", "user-1");

    assert.deepEqual(query, {
        where: {
            id: "medicine-1",
            userId: "user-1",
            status: { not: MedicineStatus.REMOVED },
        },
        select: {
            id: true,
            userId: true,
            name: true,
            expiryDate: true,
            status: true,
            description: true,
            longDescription: true,
            image: true,
            createdAt: true,
            updatedAt: true,
        },
    });
});

test("updateForUser excludes removed medicines", async () => {
    let query: unknown;
    prisma.medicine.update = (async (args: unknown) => {
        query = args;
        return medicineRecord();
    }) as typeof prisma.medicine.update;

    await medicineRepo.updateForUser("medicine-1", "user-1", {
        name: "Panadol Extra",
    });

    assert.deepEqual(query, {
        where: {
            id: "medicine-1",
            userId: "user-1",
            status: { not: MedicineStatus.REMOVED },
        },
        data: {
            name: "Panadol Extra",
        },
        select: {
            id: true,
            userId: true,
            name: true,
            expiryDate: true,
            status: true,
            description: true,
            longDescription: true,
            image: true,
            createdAt: true,
            updatedAt: true,
        },
    });
});

test("markRemoved ignores medicines that are already removed", async () => {
    let query: unknown;
    prisma.medicine.update = (async (args: unknown) => {
        query = args;
        return medicineRecord(MedicineStatus.REMOVED);
    }) as typeof prisma.medicine.update;

    await medicineRepo.markRemoved("medicine-1", "user-1");

    assert.deepEqual(query, {
        where: {
            id: "medicine-1",
            userId: "user-1",
            status: { not: MedicineStatus.REMOVED },
        },
        data: {
            status: MedicineStatus.REMOVED,
        },
        select: {
            id: true,
            userId: true,
            name: true,
            expiryDate: true,
            status: true,
            description: true,
            longDescription: true,
            image: true,
            createdAt: true,
            updatedAt: true,
        },
    });
});
