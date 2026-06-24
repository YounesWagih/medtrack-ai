import { NextFunction, Response } from "express";
import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";

import { env } from "../config/env.js";
import { APIError } from "../errors/APIError.js";
import { AuthenticatedRequest } from "./authenticate.js";
import { redisClient } from "../config/redis.js";
import { rateLimitRejectionsTotal, recordMetric } from "../metrics/metrics.js";

const insuranceLimiter = new RateLimiterMemory({
    points: env.CHAT_RATE_LIMIT,
    duration: 3600,
    blockDuration: 3600,
});

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "chat_rate_limit",
    points: env.CHAT_RATE_LIMIT,
    duration: 3600,
    blockDuration: 3600,

    insuranceLimiter,
});

export const rateLimit = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new APIError("Unauthorized", 401);
    }

    try {
        await rateLimiter.consume(userId);
        next();
    } catch (err: any) {
        if (err?.msBeforeNext !== undefined) {
            recordMetric(() => rateLimitRejectionsTotal.inc({ limiter: "chat" }));
            const seconds = Math.ceil(err.msBeforeNext / 1000);

            throw new APIError(
                `Too many requests. Please try again in ${seconds} second${seconds > 1 ? "s" : ""}`,
                429,
            );
        }
    }
};
