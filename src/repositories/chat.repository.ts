import { prisma } from "../db/PrismaClient.js";
import { ChatSessionStatus, ChatMessageRole } from "@prisma/client";

const SESSION_SELECT = {
    id: true,
    userId: true,
    status: true,
    createdAt: true,
} as const;

const MESSAGE_SELECT = {
    id: true,
    sessionId: true,
    role: true,
    content: true,
    createdAt: true,
} as const;

export type ChatSessionWithMessages = Awaited<
    ReturnType<typeof findSessionWithMessages>
>;

export async function createSession(userId: string, status: ChatSessionStatus) {
    return await prisma.chatSession.create({
        data: {
            userId,
            status,
        },
        select: SESSION_SELECT,
    });
}

export async function findSessionById(sessionId: string, userId: string) {
    return await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
        select: SESSION_SELECT,
    });
}

export async function addMessage(
    sessionId: string,
    role: ChatMessageRole,
    content: string,
) {
    return await prisma.chatMessage.create({
        data: {
            sessionId,
            role,
            content,
        },
        select: MESSAGE_SELECT,
    });
}

export async function findMessagesBySession(sessionId: string) {
    return await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
        select: MESSAGE_SELECT,
    });
}

export async function findSessionWithMessages(sessionId: string, userId: string) {
    return await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
        select: {
            ...SESSION_SELECT,
            messages: {
                orderBy: { createdAt: "asc" },
                select: MESSAGE_SELECT,
            },
        },
    });
}