import { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { requestContextStore } from "../logging/context.js";
import { getActiveSpanContext } from "../tracing/tracing.js";

function getHeader(
    headers: Request["headers"],
    name: string,
): string | undefined {
    const value = headers[name];
    if (Array.isArray(value)) return value[0];
    return value;
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = (getHeader(req.headers, "x-request-id") || "").trim() || randomUUID();
    res.setHeader("x-request-id", requestId);

    const trace = getActiveSpanContext();
    const context = {
        requestId,
        traceId: trace.traceId,
        method: req.method,
        path: req.path,
    };

    requestContextStore.enterWith(context);
    next();
};
