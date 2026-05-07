import { NextFunction, Request, Response } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { env } from "../config/env.js";
import { APIError } from "../errors/APIError.js";
import { AuthenticatedRequest } from "./authenticate.js";
import { redisClient } from "../config/redis.js";

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "chat_rate_limit",
    points: parseInt(env.CHAT_RATE_LIMIT),
    duration: 3600,
    blockDuration: 3600,
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
        let message = "Too many requests. Try again later.";
        if (err.msBeforeNext) {
            const seconds = Math.ceil(err.msBeforeNext / 1000);
            message = `Too many requests. Please try again in ${seconds} second${seconds > 1 ? 's' : ''}.`;
        }
        throw new APIError(message, 429);
    }
};