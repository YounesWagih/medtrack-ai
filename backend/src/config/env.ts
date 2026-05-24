import { z } from "zod";
import { APIError } from "../errors/APIError.js";

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
    MEDICINE_EXPIRY_CRON: z.string().default("0 0 * * *"),
    MEDICINE_EXPIRY_CRON_TIMEZONE: z.string().default("UTC"),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    MEDICINE_DETAILS_CACHE_TTL: z.coerce.number().default(24 * 60 * 60), // 24 hours
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const tree = z.prettifyError(result.error);
        console.error(tree);
        throw new Error("Environment validation failed");
    }
    return result.data;
}

export const env = validateEnv();
