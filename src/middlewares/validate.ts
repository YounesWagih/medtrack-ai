import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export const validate =
    (schema: ZodType, location: "body" | "query" | "params" = "body") =>
    async (req: Request, _res: Response, next: NextFunction) => {
        const source =
            location === "params"
                ? req.params
                : location === "query"
                  ? req.query
                  : req.body;
        const validatedData = await schema.parseAsync(source);

        if (location === "params") {
            req.params = validatedData as Record<string, string>;
        } else if (location === "query") {
            // req.query = validatedData as Record<string, string>;
        } else {
            req.body = validatedData;
        }
        next();
    };
