import { prisma } from "./PrismaClient.js";

const MAX_DB_RETRIES = 5;
const BASE_DELAY_MS = 2_000;

export async function connectDatabase(): Promise<void> {
    for (let attempt = 1; attempt <= MAX_DB_RETRIES; attempt++) {
        try {
            await prisma.$connect();
            console.log(`✅ Database connected successfully (attempt ${attempt})`);
            return;
        } catch (err) {
            console.warn(
                `⚠️  Database connection attempt ${attempt}/${MAX_DB_RETRIES} failed:`,
                err instanceof Error ? err.message : err,
            );
            if (attempt < MAX_DB_RETRIES) {
                const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), 30_000);
                console.log(`   ↳ Retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    console.error("❌ Database failed to connect after all retries. Exiting.");
    process.exit(1);
}
