import { MedicineStatus } from "@prisma/client";

export interface NotificationPayload {
  userId: string;
  medicineId: string;
  medicineName: string;
  oldStatus: MedicineStatus;
  newStatus: MedicineStatus;
}

export async function sendExpiryNotification(payload: NotificationPayload): Promise<void> {
  console.log("[Notification Stub] Would send notification:", payload);
}