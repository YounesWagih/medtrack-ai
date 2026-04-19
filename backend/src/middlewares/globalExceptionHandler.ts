import { NextFunction, Request, Response } from "express";
import { APIError } from "../errors/APIError.js";
import { ResponseHelper } from "../utils/responseHelper.js";
import { ZodError } from "zod";

export const globalExceptionHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    console.log(err);

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
    return res.status(500).json(ResponseHelper.error("Unknown error occurred"));
};

export default globalExceptionHandler;
