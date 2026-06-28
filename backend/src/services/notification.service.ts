import { MedicineStatus } from "@prisma/client";
import { createCronLogger } from "../logging/logger.js";
import { requestContextStore } from "../logging/context.js";
import { notificationAttemptsTotal, recordMetric } from "../metrics/metrics.js";

export interface NotificationPayload {
  userId: string;
  medicineId: string;
  medicineName: string;
  oldStatus: MedicineStatus;
  newStatus: MedicineStatus;
}

const cronLogger = createCronLogger();

export async function sendExpiryNotification(payload: NotificationPayload): Promise<void> {
  try {
  const context = requestContextStore.getStore();
  cronLogger.info(
    {
      event: "notification.expiry.queued_stub",
      userId: payload.userId,
      medicineId: payload.medicineId,
      oldStatus: payload.oldStatus,
      newStatus: payload.newStatus,
      jobRunId: context?.jobRunId,
      requestId: context?.requestId,
    },
    "notification expiry queued (stub)",
  );
    recordMetric(() => notificationAttemptsTotal.inc({ type: "expiry", outcome: "queued_stub" }));
  } catch (error) {
    recordMetric(() => notificationAttemptsTotal.inc({ type: "expiry", outcome: "error" }));
    throw error;
  }
}
