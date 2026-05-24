import { Prisma } from "@prisma/client";

export class DomainError extends Error {
    public readonly isDomainError: true = true as const;
    public readonly httpStatus: number = 500;
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class UniqueConstraintError extends DomainError {
    readonly code = "UNIQUE_CONSTRAINT" as const;
    readonly httpStatus = 409;
    constructor(
        message: string = "Unique constraint violation",
        public readonly fields: string[] = [],
    ) {
        super(message);
    }
}

export class EmailAlreadyExistsError extends UniqueConstraintError {
    constructor() {
        super("Email already exists", ["email"]);
    }
}

export class ForeignKeyError extends DomainError {
    readonly code = "FOREIGN_KEY" as const;
    readonly httpStatus = 400;
    constructor(message: string = "Foreign key constraint violation") {
        super(message);
    }
}

export class ResourceNotFoundError extends DomainError {
    readonly code = "RESOURCE_NOT_FOUND" as const;
    readonly httpStatus = 404;
    constructor(public readonly resource: string) {
        super(`${resource} not found`);
    }
}

export class DatabaseError extends DomainError {
    readonly code = "DATABASE" as const;
    readonly httpStatus = 503;
    constructor(message: string = "Database operation failed") {
        super(message);
    }
}

export function isDomainError(err: unknown): err is DomainError {
    return err instanceof DomainError;
}

export function classifyPrismaError(
    err: unknown,
    resource?: string,
): DomainError | null {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError)) {
        if (err instanceof Prisma.PrismaClientValidationError) {
            return new DatabaseError("Invalid database query");
        }
        if (err instanceof Prisma.PrismaClientInitializationError) {
            return new DatabaseError("Database unavailable");
        }
        if (err instanceof Prisma.PrismaClientRustPanicError) {
            return new DatabaseError("Critical database error");
        }
        return null;
    }

    switch (err.code) {
        case "P2002": {
            const fields = (err.meta?.target as string[]) ?? [];
            if (fields.includes("email")) {
                return new EmailAlreadyExistsError();
            }
            return new UniqueConstraintError(
                `Duplicate value for ${fields.join(", ")}`,
                fields,
            );
        }
        case "P2003":
            return new ForeignKeyError();
        case "P2025":
            return new ResourceNotFoundError(resource ?? "Resource");
        default:
            return new DatabaseError("Database operation failed");
    }
}