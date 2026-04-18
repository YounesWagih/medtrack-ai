import { z } from "zod";
import { APIError } from "../errors/APIError.js";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z
        .string()
        .default("3000")
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().min(1).max(65535)),
    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters long"),
    JWT_EXPIRES_IN: z.string().default("7d"),
    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
    GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
    GEMINI_MAX_TOKENS: z.string().default("8192"),
    GEMINI_TEMPERATURE: z.string().default("0.7"),
    CHAT_RATE_LIMIT: z.string().default("50"),
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
