import { NextFunction, Request, Response } from "express";
import { APIError } from "../errors/APIError.js";
import { ResponseHelper } from "../utils/responseHelper.js";
import { ZodError } from "zod";
import { DomainError } from "../errors/DomainError.js";

export const globalExceptionHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    if (err instanceof APIError) {
        return res
            .status(err.statusCode)
            .json(ResponseHelper.error(err.message));
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
        return res
            .status(err.httpStatus)
            .json(ResponseHelper.error(err.message));
    }

    return res.status(500).json(ResponseHelper.error("Unknown error occurred"));
};

export default globalExceptionHandler;
