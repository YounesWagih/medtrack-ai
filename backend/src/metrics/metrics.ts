import {
    collectDefaultMetrics,
    Counter,
    Gauge,
    Histogram,
    Registry,
} from "prom-client";

export const metricsRegistry = new Registry();

metricsRegistry.setDefaultLabels({ service: "medtrack-backend" });
collectDefaultMetrics({
    register: metricsRegistry,
    prefix: "medtrack_",
});

export const httpRequestsTotal = new Counter({
    name: "medtrack_http_requests_total",
    help: "Completed HTTP requests.",
    labelNames: ["method", "route", "status_code"] as const,
    registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
    name: "medtrack_http_request_duration_seconds",
    help: "HTTP request duration in seconds.",
    labelNames: ["method", "route", "status_class"] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [metricsRegistry],
});

export const httpRequestsInFlight = new Gauge({
    name: "medtrack_http_requests_in_flight",
    help: "HTTP requests currently being processed.",
    labelNames: ["method"] as const,
    registers: [metricsRegistry],
});

export const externalRequestsTotal = new Counter({
    name: "medtrack_external_requests_total",
    help: "Calls to bounded external dependencies.",
    labelNames: ["dependency", "operation", "outcome", "status_class"] as const,
    registers: [metricsRegistry],
});

export const externalRequestDuration = new Histogram({
    name: "medtrack_external_request_duration_seconds",
    help: "External dependency request duration in seconds.",
    labelNames: ["dependency", "operation", "outcome"] as const,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60],
    registers: [metricsRegistry],
});

export const redisAvailable = new Gauge({
    name: "medtrack_redis_available",
    help: "Whether the application Redis client is available (1) or degraded (0).",
    registers: [metricsRegistry],
});

export const cacheOperationsTotal = new Counter({
    name: "medtrack_cache_operations_total",
    help: "Cache operations and their bounded outcomes.",
    labelNames: ["namespace", "operation", "outcome"] as const,
    registers: [metricsRegistry],
});

export const jobRunsTotal = new Counter({
    name: "medtrack_job_runs_total",
    help: "Background job runs by outcome.",
    labelNames: ["job", "outcome"] as const,
    registers: [metricsRegistry],
});

export const jobDuration = new Histogram({
    name: "medtrack_job_duration_seconds",
    help: "Background job duration in seconds.",
    labelNames: ["job", "outcome"] as const,
    buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 300, 900],
    registers: [metricsRegistry],
});

export const jobLastSuccessTimestamp = new Gauge({
    name: "medtrack_job_last_success_timestamp_seconds",
    help: "Unix timestamp of the last successful background job run.",
    labelNames: ["job"] as const,
    registers: [metricsRegistry],
});

export const jobItemsTotal = new Counter({
    name: "medtrack_job_items_total",
    help: "Items processed by background jobs.",
    labelNames: ["job", "item", "outcome"] as const,
    registers: [metricsRegistry],
});

export const workflowOperationsTotal = new Counter({
    name: "medtrack_workflow_operations_total",
    help: "Critical product workflow operations.",
    labelNames: ["workflow", "operation", "outcome"] as const,
    registers: [metricsRegistry],
});

export const chatMessagesTotal = new Counter({
    name: "medtrack_chat_messages_total",
    help: "AI chat message processing outcomes.",
    labelNames: ["outcome", "model", "response_type"] as const,
    registers: [metricsRegistry],
});

export const rateLimitRejectionsTotal = new Counter({
    name: "medtrack_rate_limit_rejections_total",
    help: "Requests rejected by a rate limiter.",
    labelNames: ["limiter"] as const,
    registers: [metricsRegistry],
});

export const notificationAttemptsTotal = new Counter({
    name: "medtrack_notification_attempts_total",
    help: "Notification attempts by type and outcome.",
    labelNames: ["type", "outcome"] as const,
    registers: [metricsRegistry],
});

redisAvailable.set(0);

export function statusClass(statusCode?: number): string {
    if (!statusCode || statusCode < 100 || statusCode > 599) return "unknown";
    return `${Math.floor(statusCode / 100)}xx`;
}

export function externalOutcome(error: unknown): "timeout" | "rate_limited" | "error" {
    const candidate = error as { code?: string; status?: number; response?: { status?: number } };
    if (candidate?.code === "ECONNABORTED" || candidate?.code === "ETIMEDOUT") return "timeout";
    if (candidate?.status === 429 || candidate?.response?.status === 429) return "rate_limited";
    return "error";
}

/** Metrics must never alter application control flow. */
export function recordMetric(record: () => void): void {
    try {
        record();
    } catch {
        // Deliberately ignored: observability is non-critical infrastructure.
    }
}
