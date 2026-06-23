import type { NextFunction, Request, Response } from "express";
import {
    httpRequestDuration,
    httpRequestsInFlight,
    httpRequestsTotal,
    recordMetric,
    statusClass,
} from "../metrics/metrics.js";

function normalizedRoute(req: Request): string {
    const routePath = req.route?.path;
    if (typeof routePath !== "string") return "unknown";

    const pathname = (req.originalUrl || req.path || "").split("?", 1)[0] ?? "";
    const actualSegments = pathname.split("/").filter(Boolean);
    const routeSegments = routePath.split("/").filter(Boolean);
    if (routeSegments.length > actualSegments.length) return "unknown";

    // Express restores baseUrl before the response finish event. Keep only the
    // static mounted prefix from the actual path, then append the route template
    // so parameter values can never become labels.
    const prefixSegments = routeSegments.length === 0
        ? actualSegments
        : actualSegments.slice(0, -routeSegments.length);
    const route = `/${[...prefixSegments, ...routeSegments].join("/")}`.replace(/\/+/g, "/");
    return route.length > 1 && route.endsWith("/") ? route.slice(0, -1) : route;
}

export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const method = req.method.toUpperCase();
    const startedAt = process.hrtime.bigint();
    let completed = false;

    recordMetric(() => httpRequestsInFlight.inc({ method }));

    const complete = () => {
        if (completed) return;
        completed = true;
        const route = normalizedRoute(req);
        const statusCode = res.statusCode;
        const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;

        recordMetric(() => {
            httpRequestsInFlight.dec({ method });
            httpRequestsTotal.inc({ method, route, status_code: String(statusCode) });
            httpRequestDuration.observe(
                { method, route, status_class: statusClass(statusCode) },
                durationSeconds,
            );
        });
    };

    res.once("finish", complete);
    res.once("close", complete);
    next();
}
