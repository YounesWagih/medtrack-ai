import { prisma } from "../db/PrismaClient.js";
import { RegisterInput } from "../schemas/auth.schema.js";

const USER_SELECT = {
    id: true,
    email: true,
    name: true,
    createdAt: true,
    updatedAt: true,
} as const;

export function findByemail(email: string) {
    return prisma.user.findUnique({
        where: { email },
        select: USER_SELECT,
    });
}

export function findByemailWithPassword(email: string) {
    return prisma.user.findUnique({
        where: { email },
        select: { ...USER_SELECT, password: true },
    });
}

export function findById(id: string) {
    return prisma.user.findUnique({
        where: { id },
        select: USER_SELECT,
    });
}

export function create(data: RegisterInput) {
    return prisma.user.create({
        data,
        select: USER_SELECT,
    });
}
