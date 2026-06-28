export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type LogFieldValue = string | number | boolean | undefined | null | Record<string, unknown>;

export interface BaseLogFields {
    timestamp: string;
    level: LogLevel;
    service: string;
    environment: string;
    version: string;
    logger: string;
    event: string;
    message: string;
    requestId?: string;
    traceId?: string;
    spanId?: string;
    userId?: string;
    route?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    durationMs?: number;
    ipHash?: string;
    userAgent?: string;
    jobName?: string;
    jobRunId?: string;
    dependency?: "postgres" | "redis" | "openrouter" | "medicine-api";
    error?: {
        name: string;
        code?: string;
        message: string;
        stack?: string;
        isOperational?: boolean;
    };
    metadata?: Record<string, unknown>;
}
