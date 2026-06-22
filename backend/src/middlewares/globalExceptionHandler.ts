import { NextFunction, Request, Response } from "express";
import { APIError } from "../errors/APIError.js";
import { ResponseHelper } from "../utils/responseHelper.js";
import { ZodError } from "zod";
import { DomainError } from "../errors/DomainError.js";
import { createErrorLogger } from "../logging/logger.js";
import { requestContextStore } from "../logging/context.js";

//TODO: refactor this file to define common log fields (path, method, route) and use it later

export const globalExceptionHandler = (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    const errorLogger = createErrorLogger();
    const context = requestContextStore.getStore();

    if (err instanceof APIError) {
        if (err.statusCode >= 500) {
            errorLogger.error(
                {
                    event: "request.error",
                    requestId: context?.requestId,
                    traceId: context?.traceId,
                    userId: context?.userId,
                    route: req.route?.path,
                    method: req.method,
                    path: req.path,
                    statusCode: err.statusCode,
                    error: {
                        name: err.name,
                        message: err.message,
                        stack: err.stack,
                        isOperational: err.isOperational,
                    },
                },
                err.message,
            );
        }
        return res.status(err.statusCode).json(ResponseHelper.error(err.message));
    }

    if (err instanceof ZodError) {
        return res
            .status(400)
            .json(
                ResponseHelper.error(
                    "Validation Failed",
                    err.flatten().fieldErrors,
                ),
            );
    }

    if (err instanceof DomainError) {
        if (err.httpStatus >= 500) {
            errorLogger.error(
                {
                    event: "request.error",
                    requestId: context?.requestId,
                    traceId: context?.traceId,
                    userId: context?.userId,
                    route: req.route?.path,
                    method: req.method,
                    path: req.path,
                    statusCode: err.httpStatus,
                    error: {
                        name: err.name,
                        message: err.message,
                        stack: err.stack,
                        isOperational: true,
                    },
                },
                err.message,
            );
        }
        return res.status(err.httpStatus).json(ResponseHelper.error(err.message));
    }

    errorLogger.error(
        {
            event: "request.unexpected_error",
            requestId: context?.requestId,
            traceId: context?.traceId,
            userId: context?.userId,
            route: req.route?.path,
            method: req.method,
            path: req.path,
            statusCode: 500,
            error: {
                name: err instanceof Error ? err.name : "UnknownError",
                message: err instanceof Error ? err.message : "Internal Server Error",
                stack: err instanceof Error ? err.stack : undefined,
                isOperational: false,
            },
        },
        "unexpected error",
    );
    return res.status(500).json(ResponseHelper.error("Internal Server Error"));
};

export default globalExceptionHandler;
