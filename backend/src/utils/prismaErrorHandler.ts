import { Prisma } from "@prisma/client";
import { APIError } from "../errors/APIError.js";

export function handlePrismaError(err: unknown): APIError | null {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2002": {
                const fields =
                    (err.meta?.target as string[])?.join(", ") ??
                    "field";
                return new APIError(
                    `Duplicate value for ${fields}`,
                    409,
                );
            }
            case "P2003": {
                console.log(err);
                const field =
                    (err.meta?.field_name as string) ??
                    "relation";
                return new APIError(
                    `Invalid reference for ${field}`,
                    400,
                );
            }
            case "P2025":
                return new APIError("Resource not found", 404);
            default:
                return new APIError(
                    "Database operation failed",
                    500,
                );
        }
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        return new APIError(
            "Invalid database query",
            400,
        );
    }

    if (err instanceof Prisma.PrismaClientInitializationError) {
        return new APIError(
            "Database unavailable",
            503,
        );
    }

    if (err instanceof Prisma.PrismaClientRustPanicError) {
        return new APIError(
            "Critical database error",
            500,
        );
    }

    return null;
}