import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export interface ValidatedData {
    query?: Record<string, unknown>;
    params?: Record<string, unknown>;
    body?: Record<string, unknown>;
}

export interface AuthenticatedAndValidatedRequest extends Request {
    user?: {
        userId: string;
    };
    validated?: ValidatedData;
}

export const validate =
    (schema: ZodType, location: "body" | "query" | "params" = "body") =>
    async (req: AuthenticatedAndValidatedRequest, _res: Response, next: NextFunction) => {
        const source =
            location === "params"
                ? req.params
                : location === "query"
                  ? req.query
                  : req.body;
        const validatedData = await schema.parseAsync(source);

        if (!req.validated) {
            req.validated = {};
        }
        req.validated[location] = validatedData as Record<string, unknown>;
        next();
    };
