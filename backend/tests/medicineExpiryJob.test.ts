import assert from "node:assert/strict";
import test from "node:test";
import { MedicineStatus } from "@prisma/client";

process.env.JWT_SECRET = "test-secret-that-is-at-least-thirty-two-characters";
process.env.OPENROUTER_API_KEY = "test-key";
process.env.MODEL_NAME = "test-model";

const { sendExpiryNotifications } = await import("../src/jobs/medicine-expiry.job.js");

const notificationPayloads = [
    {
        userId: "user-1",
        medicineId: "medicine-1",
        medicineName: "One",
        oldStatus: MedicineStatus.ACTIVE,
        newStatus: MedicineStatus.EXPIRING_SOON,
    },
    {
        userId: "user-2",
        medicineId: "medicine-2",
        medicineName: "Two",
        oldStatus: MedicineStatus.ACTIVE,
        newStatus: MedicineStatus.EXPIRING_SOON,
    },
    {
        userId: "user-3",
        medicineId: "medicine-3",
        medicineName: "Three",
        oldStatus: MedicineStatus.ACTIVE,
        newStatus: MedicineStatus.EXPIRING_SOON,
    },
];

test("sendExpiryNotifications continues after individual notification failures", async () => {
    const attemptedMedicineIds: string[] = [];

    const result = await sendExpiryNotifications(
        notificationPayloads,
        { jobRunId: "job-1", requestId: "request-1" },
        async (payload) => {
            attemptedMedicineIds.push(payload.medicineId);
            if (payload.medicineId === "medicine-2") {
                throw new Error("notification provider failed");
            }
        },
    );

    assert.deepEqual(attemptedMedicineIds, [
        "medicine-1",
        "medicine-2",
        "medicine-3",
    ]);
    assert.deepEqual(result, {
        successCount: 2,
        failureCount: 1,
    });
});
