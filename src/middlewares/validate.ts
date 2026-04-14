import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export const validate =
    (schema: ZodType) =>
    async (req: Request, _res: Response, next: NextFunction) => {
        const validatedData = await schema.parseAsync(req.body);
        req.body = validatedData;
        next();
    };
