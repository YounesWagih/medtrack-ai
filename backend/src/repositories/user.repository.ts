import { prisma } from "../db/PrismaClient.js";
import { RegisterInput } from "../schemas/auth.schema.js";
import {
    EmailAlreadyExistsError,
    ForeignKeyError,
    ResourceNotFoundError,
    DatabaseError,
    classifyPrismaError,
} from "../errors/DomainError.js";

const USER_SELECT = {
    id: true,
    email: true,
    name: true,
    createdAt: true,
    updatedAt: true,
} as const;

export async function findByemail(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: USER_SELECT,
        });
        if (!user) {
            throw new ResourceNotFoundError("User");
        }
        return user;
    } catch (err) {
        if (err instanceof ResourceNotFoundError) throw err;
        const domainErr = classifyPrismaError(err, "User");
        if (domainErr) throw domainErr;
        throw new DatabaseError("Failed to find user by email");  // we throw lastly because of findUnique() which will not throw in case of not found, unlike findUniqueAndThrow() in medicine service
    }
}

export async function findByemailWithPassword(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { ...USER_SELECT, password: true },
        });
        if (!user) {
            throw new ResourceNotFoundError("User");
        }
        return user;
    } catch (err) {
        if (err instanceof ResourceNotFoundError) throw err;
        const domainErr = classifyPrismaError(err, "User");
        if (domainErr) throw domainErr;
        throw new DatabaseError("Failed to find user by email");
    }
}

export async function findById(id: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: USER_SELECT,
        });
        if (!user) {
            throw new ResourceNotFoundError("User");
        }
        return user;
    } catch (err) {
        if (err instanceof ResourceNotFoundError) throw err;
        const domainErr = classifyPrismaError(err, "User");
        if (domainErr) throw domainErr;
        throw new DatabaseError("Failed to find user by id");
    }
}

export async function create(data: RegisterInput) {
    try {
        return await prisma.user.create({
            data,
            select: USER_SELECT,
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err);
        if (domainErr) throw domainErr;
        throw new DatabaseError("Failed to create user");
    }
}
