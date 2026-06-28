import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { APIError } from "../errors/APIError.js";
import { setUserId } from "../logging/context.js";
import * as userRepo from "../repositories/user.repository.js";
import { ResourceNotFoundError } from "../errors/DomainError.js";

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
    };
}

export interface JwtPayload {
    userId: string;
}

export const authenticate = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    // Extract Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw new APIError("No token provided", 401);
    }

    // Check if it's in "Bearer <token>" format
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
        throw new APIError("Invalid authorization header format", 401);
    }

    const token = parts[1];

    let decoded: JwtPayload;
    try {
        decoded = jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new APIError("Token expired", 401);
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new APIError("Invalid token", 401);
        }
        throw error;
    }

    //TODO: make separete jwt service and import the function from it
    if (!decoded.userId) {
        throw new APIError("Invalid token: missing userId", 401);
    }

    try {
        await userRepo.findById(decoded.userId);
    } catch (error) {
        if (error instanceof ResourceNotFoundError) {
            throw new APIError("Session user no longer exists. Please log in again.", 401);
        }
        throw error;
    }

    // Attach userId to request
    req.user = {
        userId: decoded.userId,
    };

    setUserId(decoded.userId);
    next();
};
