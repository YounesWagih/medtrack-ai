import cron, { ScheduledTask } from "node-cron";
import * as medicineService from "../services/medicine.service.js";
import {
  NotificationPayload,
  sendExpiryNotification,
} from "../services/notification.service.js";
import { MedicineStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { createCronLogger } from "../logging/logger.js";
import { runWithContext } from "../logging/context.js";
import { randomUUID } from "node:crypto";
import { withSpan } from "../tracing/spans.js";
import {
  jobDuration,
  jobItemsTotal,
  jobLastSuccessTimestamp,
  jobRunsTotal,
  recordMetric,
} from "../metrics/metrics.js";

const cronLogger = createCronLogger();
let expiryJob: ScheduledTask | null = null;

type NotificationSender = (payload: NotificationPayload) => Promise<void>;

export async function sendExpiryNotifications(
  results: NotificationPayload[],
  context: { jobRunId: string; requestId: string },
  notify: NotificationSender = sendExpiryNotification,
): Promise<{ successCount: number; failureCount: number }> {
  let successCount = 0;
  let failureCount = 0;

  for (const result of results) {
    try {
      await runWithContext(
        context,
        () => withSpan(
          "medicine_expiry.notification",
          {
            "job.name": "medicine_expiry",
            "job.run_id": context.jobRunId,
            "notification.type": "expiry",
          },
          () => notify({ ...result }),
        ),
      );
      successCount += 1;
      recordMetric(() => jobItemsTotal.inc({ job: "medicine_expiry", item: "notification", outcome: "success" }));
    } catch (error) {
      failureCount += 1;
      recordMetric(() => jobItemsTotal.inc({ job: "medicine_expiry", item: "notification", outcome: "error" }));
      cronLogger.warn(
        {
          event: "medicine_expiry_job.notification_failed",
          jobRunId: context.jobRunId,
          userId: result.userId,
          medicineId: result.medicineId,
          error: {
            name: error instanceof Error ? error.name : "UnknownError",
            message: error instanceof Error ? error.message : String(error),
          },
        },
        "medicine expiry notification failed; continuing with remaining notifications",
      );
    }
  }

  return { successCount, failureCount };
}

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
  const requestId = randomUUID();
  const startTime = Date.now();

  await withSpan(
    "medicine_expiry.run",
    {
      "job.name": "medicine_expiry",
      "job.run_id": jobRunId,
      "job.schedule": env.MEDICINE_EXPIRY_CRON,
      "job.timezone": env.MEDICINE_EXPIRY_CRON_TIMEZONE,
    },
    async (span) => {
  try {
    cronLogger.info(
      { event: "medicine_expiry_job.started", jobRunId, cronExpression: env.MEDICINE_EXPIRY_CRON, timezone: env.MEDICINE_EXPIRY_CRON_TIMEZONE },
      "medicine expiry job started",
    );

    const results = await runWithContext(
      { requestId, jobRunId },
      () => withSpan(
        "medicine_expiry.sync_statuses",
        { "job.name": "medicine_expiry", "job.run_id": jobRunId },
        async (syncSpan) => {
          const syncResults = await medicineService.syncMedicineStatuses();
          syncSpan.setAttribute("medicine.updated_count", syncResults.length);
          return syncResults;
        },
      ),
    );
    span.setAttribute("medicine.updated_count", results.length);

    cronLogger.info(
      { event: "medicine_expiry_job.sync_completed", jobRunId, updatedCount: results.length },
      `sync completed. ${results.length} medicines updated.`,
    );

    const notificationResults = await sendExpiryNotifications(
      results,
      { requestId, jobRunId },
    );
    span.setAttribute("notification.success_count", notificationResults.successCount);
    span.setAttribute("notification.failure_count", notificationResults.failureCount);

    const duration = Date.now() - startTime;
    const outcome = notificationResults.failureCount > 0 ? "partial_error" : "success";
    recordMetric(() => {
      jobRunsTotal.inc({ job: "medicine_expiry", outcome });
      jobDuration.observe({ job: "medicine_expiry", outcome }, duration / 1000);
      if (outcome === "success") {
        jobLastSuccessTimestamp.set({ job: "medicine_expiry" }, Date.now() / 1000);
      }
      jobItemsTotal.inc({ job: "medicine_expiry", item: "medicine_updated", outcome: "success" }, results.length);
    });
    span.setAttribute("job.outcome", outcome);
    span.setAttribute("job.duration_ms", duration);
    const log = notificationResults.failureCount > 0 ? cronLogger.warn.bind(cronLogger) : cronLogger.info.bind(cronLogger);
    log(
      {
        event: "medicine_expiry_job.completed",
        jobRunId,
        updatedCount: results.length,
        notificationSuccessCount: notificationResults.successCount,
        notificationFailureCount: notificationResults.failureCount,
        durationMs: duration,
      },
      `job completed in ${duration}ms`,
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    recordMetric(() => {
      jobRunsTotal.inc({ job: "medicine_expiry", outcome: "error" });
      jobDuration.observe({ job: "medicine_expiry", outcome: "error" }, duration / 1000);
    });
    span.setAttribute("job.outcome", "error");
    span.setAttribute("job.duration_ms", duration);
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
    },
  );
}

export function stopMedicineExpiryJob(): void {
  if (expiryJob) {
    expiryJob.stop();
    expiryJob = null;
    cronLogger.info({ event: "medicine_expiry_job.stopped" }, "medicine expiry job stopped");
  }
}
