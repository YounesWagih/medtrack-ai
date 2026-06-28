import pino from "pino";
import { prettyTransport } from "./transport.js";
import { env } from "../config/env.js";
import { getTraceContext } from "./context.js";

export const rootLogger = pino(
    {
        level: env.LOG_LEVEL,
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
            service: env.SERVICE_NAME,
            environment: env.NODE_ENV,
            version: env.SERVICE_VERSION,
        },
        formatters: {
            level(label, number) {
                return {
                    level: number,
                    levelLabel: label,
                };
            },
        },
        mixin() {
            const traceContext = getTraceContext();
            return {
                traceId: traceContext.traceId,
                spanId: traceContext.spanId,
            };
        },
        redact: {
            paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                "req.body.password",
                "req.body.token",
                "res.body.token",
                // ─── Broad key-name protection (any level) ───
                "password",
                "token",
                "authorization",
                "cookie",
                "secret",
                "apiKey",
                "jwt",
                // ─── Env variable names that may appear in logged configs ───
                "DATABASE_URL",
                "REDIS_URL",
                "OPENROUTER_API_KEY",
                // ─── AI/chat payloads logged by services ───
                "req.body.content",
                "req.body.prompt",
                "req.body.history",
                "content",
                "prompt",
                "history",
                // ─── Error objects ───
                // "err",
                // "error",
                // "stack",
            ],
            censor: "[REDACTED]",
        },
    },
    env.LOG_FORMAT === "pretty" ? prettyTransport : undefined,
);

export const createChildLogger = (overrides: Record<string, unknown>) => {
    return rootLogger.child(overrides);
};

export const createHttpLogger = () => createChildLogger({ logger: "http" });
export const createAuthLogger = () => createChildLogger({ logger: "auth" });
export const createMedicineLogger = () => createChildLogger({ logger: "medicine" });
export const createChatLogger = () => createChildLogger({ logger: "chat" });
export const createRedisLogger = () => createChildLogger({ logger: "redis" });
export const createDbLogger = () => createChildLogger({ logger: "db" });
export const createCronLogger = () => createChildLogger({ logger: "cron" });
export const createExternalApiLogger = () => createChildLogger({ logger: "external-api" });
export const createErrorLogger = () => createChildLogger({ logger: "error" });
export const createMetricsLogger = () => createChildLogger({ logger: "metrics" });
