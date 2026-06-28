import { prisma } from "../db/PrismaClient.js";
import { ChatSessionStatus, ChatMessageRole } from "@prisma/client";
import {
    ForeignKeyError,
    ResourceNotFoundError,
    DatabaseError,
    classifyPrismaError,
} from "../errors/DomainError.js";

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
    try {
        return await prisma.chatSession.create({
            data: {
                userId,
                status,
            },
            select: SESSION_SELECT,
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err);
        if (domainErr) throw domainErr;
        throw new DatabaseError("Failed to create chat session");
    }
}

export async function findSessionById(sessionId: string, userId: string) {
    try {
        return await prisma.chatSession.findUniqueOrThrow({
            where: { id: sessionId, userId },
            select: SESSION_SELECT,
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err, "ChatSession");
        if (domainErr) throw domainErr;
        throw new ResourceNotFoundError("ChatSession");
    }
}

export async function addMessage(
    sessionId: string,
    role: ChatMessageRole,
    content: string,
) {
    try {
        return await prisma.chatMessage.create({
            data: {
                sessionId,
                role,
                content,
            },
            select: MESSAGE_SELECT,
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err);
        if (domainErr) throw domainErr;
        throw new ForeignKeyError();
    }
}

export async function addConversationTurn(
    sessionId: string,
    userContent: string,
    assistantContent: string,
) {
    try {
        return await prisma.$transaction([
            prisma.chatMessage.create({
                data: {
                    sessionId,
                    role: ChatMessageRole.USER,
                    content: userContent,
                },
                select: MESSAGE_SELECT,
            }),
            prisma.chatMessage.create({
                data: {
                    sessionId,
                    role: ChatMessageRole.ASSISTANT,
                    content: assistantContent,
                },
                select: MESSAGE_SELECT,
            }),
        ]);
    } catch (err) {
        const domainErr = classifyPrismaError(err);
        if (domainErr) throw domainErr;
        throw new ForeignKeyError();
    }
}

export async function findMessagesBySession(sessionId: string) {
    return await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
        select: MESSAGE_SELECT,
    });
}

export async function findSessionWithMessages(sessionId: string, userId: string) {
    try {
        return await prisma.chatSession.findFirstOrThrow({
            where: { id: sessionId, userId },
            select: {
                ...SESSION_SELECT,
                messages: {
                    orderBy: { createdAt: "asc" },
                    select: MESSAGE_SELECT,
                },
            },
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err, "ChatSession");
        if (domainErr) throw domainErr;
        throw new ResourceNotFoundError("ChatSession");
    }
}

export async function findAllByUser(userId: string) {
    return await prisma.chatSession.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: SESSION_SELECT,
    });
}

export async function deleteSession(sessionId: string, userId: string) {
    try {
        return await prisma.chatSession.deleteMany({
            where: { id: sessionId, userId },
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err, "ChatSession");
        if (domainErr) throw domainErr;
        throw new ResourceNotFoundError("ChatSession");
    }
}
