import { z } from "zod";
import { isValidCron } from "cron-validator";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    FRONTEND_URL: z.string().default("http://localhost:5173"),
    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters long"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    CHAT_RATE_LIMIT: z.coerce.number().int().positive().default(50),
    OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
    MODEL_NAME: z.string(),
    MEDICINE_EXPIRING_SOON_DAYS: z.coerce.number().default(30),
    MEDICINE_EXPIRY_CRON: z
        .string()
        .refine(
            isValidCron,
            "MEDICINE_EXPIRY_CRON must be a valid cron expression",
        )
        .default("0 0 * * *"),
    MEDICINE_EXPIRY_CRON_TIMEZONE: z.string().default("UTC"),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    MEDICINE_DETAILS_CACHE_TTL: z.coerce
        .number()
        .nonnegative()
        .default(24 * 60 * 60), // 24 hours
    LOG_LEVEL: z
        .enum(["debug", "info", "warn", "error", "fatal"])
        .default("debug"),
    LOG_FORMAT: z.enum(["json", "pretty"]).default("pretty"),
    LOG_REDACTION_MODE: z.enum(["strict", "lenient"]).default("strict"),
    SERVICE_NAME: z.string().default("medtrack-backend"),
    SERVICE_VERSION: z.string().default("1.0.0"),
    METRICS_ENABLED: z
        .string()
        .default("true")
        .transform((value) => value.toLowerCase() === "true"),
    METRICS_PORT: z.coerce.number().int().min(1).max(65535).default(9464),
    TRACING_ENABLED: z
        .string()
        .default("true")
        .transform((value) => value.toLowerCase() === "true"),
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: z
        .string()
        .url()
        .default("http://localhost:4318/v1/traces"),
    OTEL_TRACES_SAMPLER_RATIO: z.coerce.number().min(0).max(1).optional(),
});

export type EnvConfig = z.infer<typeof envSchema> & {
    OTEL_TRACES_SAMPLER_RATIO: number;
};

function validateEnv(): EnvConfig {
    const raw = process.env;
    const parsed = envSchema.safeParse(raw);
    if (!parsed.success) {
        const tree = z.prettifyError(parsed.error);
        console.error("Environment validation failed\n", tree);
        process.exit(1);
    }
    return {
        ...parsed.data,
        OTEL_TRACES_SAMPLER_RATIO: parsed.data.OTEL_TRACES_SAMPLER_RATIO
            ?? (parsed.data.NODE_ENV === "production" ? 0.1 : 1),
    };
}

export const env = validateEnv();
