import { NextFunction, Request, Response } from "express";
import { sanitizeInput } from "../utils/sanitizer.js";

export const sanitizeInputMiddleware = async (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    if (req.body && req.body.content) {
        req.body.content = sanitizeInput(req.body.content);
    }
    next();
};