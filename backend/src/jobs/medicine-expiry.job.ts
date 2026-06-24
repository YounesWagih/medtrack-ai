import cron, { ScheduledTask } from "node-cron";
import * as medicineService from "../services/medicine.service.js";
import { sendExpiryNotification } from "../services/notification.service.js";
import { MedicineStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { createCronLogger } from "../logging/logger.js";
import { requestContextStore } from "../logging/context.js";
import { randomUUID } from "node:crypto";
import {
  jobDuration,
  jobItemsTotal,
  jobLastSuccessTimestamp,
  jobRunsTotal,
  recordMetric,
} from "../metrics/metrics.js";

const cronLogger = createCronLogger();
let expiryJob: ScheduledTask | null = null;

export function startMedicineExpiryJob(): void {
  if (expiryJob) {
    cronLogger.warn({ event: "medicine_expiry_job.already_registered" }, "medicine expiry job already registered");
    return;
  }

  const cronExpression = env.MEDICINE_EXPIRY_CRON;
  const timezone = env.MEDICINE_EXPIRY_CRON_TIMEZONE;

  cronLogger.info(
    { event: "medicine_expiry_job.registering", cronExpression, timezone },
    `registering medicine expiry job with cron: ${cronExpression}, timezone: ${timezone}`,
  );

  expiryJob = cron.schedule(cronExpression, async () => {
    try {
      await runMedicineExpirySync();
    } catch {
      // runMedicineExpirySync records and logs the failure. Do not leak a rejected cron promise.
    }
  }, {
    timezone,
  });

  cronLogger.info(
    { event: "medicine_expiry_job.registered", cronExpression, timezone },
    "medicine expiry job registered successfully",
  );
}

export async function runMedicineExpirySync(): Promise<void> {
  const jobRunId = randomUUID();
  const traceId = randomUUID().replace(/-/g, "").slice(0, 32);
  const requestId = randomUUID();
  const startTime = Date.now();

  cronLogger.info(
    { event: "medicine_expiry_job.started", jobRunId, cronExpression: env.MEDICINE_EXPIRY_CRON, timezone: env.MEDICINE_EXPIRY_CRON_TIMEZONE },
    "medicine expiry job started",
  );

  try {
    const results = await requestContextStore.run(
      { requestId, traceId, jobRunId },
      () => medicineService.syncMedicineStatuses(),
    );

    cronLogger.info(
      { event: "medicine_expiry_job.sync_completed", jobRunId, updatedCount: results.length },
      `sync completed. ${results.length} medicines updated.`,
    );

    for (const result of results) {
      try {
        await requestContextStore.run(
          { requestId, traceId, jobRunId },
          () => sendExpiryNotification({ ...result }),
        );
        recordMetric(() => jobItemsTotal.inc({ job: "medicine_expiry", item: "notification", outcome: "success" }));
      } catch (error) {
        recordMetric(() => jobItemsTotal.inc({ job: "medicine_expiry", item: "notification", outcome: "error" }));
        throw error;
      }
    }

    const duration = Date.now() - startTime;
    recordMetric(() => {
      jobRunsTotal.inc({ job: "medicine_expiry", outcome: "success" });
      jobDuration.observe({ job: "medicine_expiry", outcome: "success" }, duration / 1000);
      jobLastSuccessTimestamp.set({ job: "medicine_expiry" }, Date.now() / 1000);
      jobItemsTotal.inc({ job: "medicine_expiry", item: "medicine_updated", outcome: "success" }, results.length);
    });
    cronLogger.info(
      { event: "medicine_expiry_job.completed", jobRunId, updatedCount: results.length, durationMs: duration },
      `job completed in ${duration}ms`,
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    recordMetric(() => {
      jobRunsTotal.inc({ job: "medicine_expiry", outcome: "error" });
      jobDuration.observe({ job: "medicine_expiry", outcome: "error" }, duration / 1000);
    });
    cronLogger.error(
      {
        event: "medicine_expiry_job.failed",
        jobRunId,
        durationMs: duration,
        error: {
          name: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      "medicine expiry job failed",
    );
    throw error;
  }
}

export function stopMedicineExpiryJob(): void {
  if (expiryJob) {
    expiryJob.stop();
    expiryJob = null;
    cronLogger.info({ event: "medicine_expiry_job.stopped" }, "medicine expiry job stopped");
  }
}
