import { z } from "zod";

//TODO: remove optional from jwt fields after impelemnt them
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
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const errors = result.error.issues.map((issue) => {
            const path = issue.path.join(".");
            return ` - ${path}: ${issue.message}`;
        });

        const errorMessage = [
            `\n Environment validation failed.`,
            "Missing or invalid required enviornment vairables.",
            ...errors,
            "see .env.example for refrence.",
        ].join("\n");

        console.error(errorMessage);
        throw new Error("Environment validation failed");
    }

    return result.data;
}

export const env = validateEnv();

console.log(`\n🚀 Environment loaded: ${env.NODE_ENV} mode`);
console.log(`📦 Server port: ${env.PORT}`);
