import { MedicineStatus } from "@prisma/client";
import { createCronLogger } from "../logging/logger.js";
import { requestContextStore } from "../logging/context.js";

export interface NotificationPayload {
  userId: string;
  medicineId: string;
  medicineName: string;
  oldStatus: MedicineStatus;
  newStatus: MedicineStatus;
}

const cronLogger = createCronLogger();

export async function sendExpiryNotification(payload: NotificationPayload): Promise<void> {
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
      traceId: context?.traceId,
    },
    "notification expiry queued (stub)",
  );
}