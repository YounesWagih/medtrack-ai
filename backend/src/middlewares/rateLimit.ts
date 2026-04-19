import { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { env } from "../config/env.js";
import { APIError } from "../errors/APIError.js";
import { AuthenticatedRequest } from "./authenticate.js";

const rateLimiter = new RateLimiterMemory({
    points: parseInt(env.CHAT_RATE_LIMIT),
    duration: 3600,
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
    } catch {
        throw new APIError("Too many requests. Try again later.", 429);
    }
};