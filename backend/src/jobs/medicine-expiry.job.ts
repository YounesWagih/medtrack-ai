import cron, { ScheduledTask } from "node-cron";
import * as medicineService from "../services/medicine.service.js";
import { sendExpiryNotification } from "../services/notification.service.js";
import { MedicineStatus } from "@prisma/client";

const DEFAULT_CRON = "*/1 * * * *"; //test
const DEFAULT_TIMEZONE = "UTC";

function getCronExpression(): string {
  return DEFAULT_CRON;
}

function getTimezone(): string {
  return process.env.MEDICINE_EXPIRY_CRON_TIMEZONE || DEFAULT_TIMEZONE;
}

let expiryJob: ScheduledTask | null = null;

export function startMedicineExpiryJob(): void {
  if (expiryJob) {
    console.log("[Medicine Expiry Job] Already registered");
    return;
  }

  const cronExpression = getCronExpression();
  const timezone = getTimezone();

  console.log(`[Medicine Expiry Job] Registering job with cron: ${cronExpression}, timezone: ${timezone}`);

  expiryJob = cron.schedule(cronExpression, async () => {
    await runMedicineExpirySync();
  }, {
    timezone,
  });

  console.log("[Medicine Expiry Job] Job registered successfully");
}

export async function runMedicineExpirySync(): Promise<void> {
  const startTime = Date.now();
  console.log("[Medicine Expiry Job] Starting expiry sync...");

  try {
    const results = await medicineService.syncMedicineStatuses();
    console.log(`[Medicine Expiry Job] Sync completed. ${results.length} medicines updated.`);

    for (const result of results) {
      await sendExpiryNotification({...result});
    }

    const duration = Date.now() - startTime;
    console.log(`[Medicine Expiry Job] Job completed in ${duration}ms`);
  } catch (error) {
    console.error("[Medicine Expiry Job] Job failed:", error);
    throw error;
  }
}

export function stopMedicineExpiryJob(): void {
  if (expiryJob) {
    expiryJob.stop();
    expiryJob = null;
    console.log("[Medicine Expiry Job] Job stopped");
  }
}