import { env } from "../config/env.js";

export class APIError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        if (env.NODE_ENV === "development") {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
