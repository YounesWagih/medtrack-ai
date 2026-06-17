import { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { requestContextStore } from "../logging/context.js";

const W3C_VERSION = "00";

function parseTraceparent(header: string | undefined): { traceId: string; spanId: string } | null {
    if (!header) return null;
    const parts = header.split("-");
    if (parts.length < 3) return null;
    const version = parts[0] as string;
    const traceId = parts[1] as string;
    const spanId = parts[2] as string;
    if (version !== W3C_VERSION || traceId.length !== 32 || spanId.length !== 16) {
        return null;
    }
    return { traceId, spanId };
}

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

    const trace = parseTraceparent(getHeader(req.headers, "traceparent"));
    const context = {
        requestId,
        traceId: trace?.traceId,
        spanId: trace?.spanId,
        method: req.method,
        path: req.path,
    };

    requestContextStore.enterWith(context);
    next();
};
