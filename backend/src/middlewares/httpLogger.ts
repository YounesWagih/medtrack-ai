import { NextFunction, Request, Response } from "express";
import { pinoHttp } from "pino-http";
import { requestContextStore } from "../logging/context.js";
import { createHttpLogger } from "../logging/logger.js";

export const httpLoggerMiddleware = pinoHttp<Request, Response>({
    logger: createHttpLogger(),
    quietResLogger: true,
    customLogLevel: (_req, res) =>
        res.statusCode >= 500 ? "silent" : "info",
    customSuccessObject(req, res, val) {
        const context = requestContextStore.getStore();

        return {
            event: "request.completed",
            requestId: context?.requestId,
            traceId: context?.traceId,
            spanId: context?.spanId,
            userId: context?.userId,
            route: req.route?.path ?? context?.route,
            method: req.method,
            path: context?.path ?? req.path,
            statusCode: res.statusCode,
            durationMs: val.responseTime,
        };
    },
});
