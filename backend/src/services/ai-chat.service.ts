import { chatSend } from "@openrouter/sdk/funcs/chatSend.js";
import { OpenRouterCore } from "@openrouter/sdk/core.js";
import { ChatSessionStatus } from "@prisma/client";
import { SpanStatusCode } from "@opentelemetry/api";
import { env } from "../config/env.js";
import { APIError } from "../errors/APIError.js";
import * as chatRepo from "../repositories/chat.repository.js";
import * as medicineRepo from "../repositories/medicine.repository.js";
import { buildPrompt } from "../utils/promptBuilder.js";
import {
    parseAIResponse,
    stripAIResponseMetadata,
} from "../utils/aiResponseParser.js";
import {
    buildSafetyQuestionsMessage,
    needsSafetyQuestions,
} from "../utils/medicalSafetyGate.js";
import { ChatMessageResponse } from "../types/index.js";
import { createChatLogger } from "../logging/logger.js";
import { requestContextStore } from "../logging/context.js";
import {
    chatMessagesTotal,
    externalOutcome,
    externalRequestDuration,
    externalRequestsTotal,
    recordMetric,
    statusClass,
} from "../metrics/metrics.js";
import { withSpan } from "../tracing/spans.js";

const chatLogger = createChatLogger();
const openrouter = new OpenRouterCore({
    apiKey: env.OPENROUTER_API_KEY,
});

export async function createSession(userId: string) {
    const session = await chatRepo.createSession(
        userId,
        ChatSessionStatus.ACTIVE,
    );
    const context = requestContextStore.getStore();
    chatLogger.info(
        {
            event: "chat.session.created",
            userId,
            sessionId: session.id,
            requestId: context?.requestId,
        },
        "chat session created",
    );
    return session;
}

export async function sendMessage(
    sessionId: string,
    userId: string,
    userMessage: string,
) {
    const start = Date.now();
    const session = await chatRepo.findSessionById(sessionId, userId);

    const history = await chatRepo.findMessagesBySession(sessionId);

    if (needsSafetyQuestions(userMessage, history)) {
        const safetyMessage = buildSafetyQuestionsMessage(userMessage);
        await chatRepo.addConversationTurn(
            sessionId,
            userMessage,
            safetyMessage,
        );

        const parsedResponse = {
            type: "text",
            content: safetyMessage,
            extractedMedicineNames: [],
        } satisfies ChatMessageResponse["response"];

        recordMetric(() => chatMessagesTotal.inc({ outcome: "success", model: env.MODEL_NAME, response_type: parsedResponse.type }));

        return {
            sessionId,
            response: parsedResponse,
        };
    }

    const medicines = await medicineRepo.findManyByUser(userId, {
        filters: {},
        page: 1,
        limit: 50,
        sort: { sortBy: "name", sortOrder: "asc" },
    });

    const medicinesWithExpiry = medicines.map((m) => ({
        name: m.name,
        expiryDate: m.expiryDate,
    }));

    const prompt = buildPrompt(userMessage, medicinesWithExpiry, history);
    const externalStart = Date.now();
    try {
        const res = await withSpan(
            "openrouter.chat",
            {
                "dependency.name": "openrouter",
                "dependency.operation": "chat",
                "gen_ai.request.model": env.MODEL_NAME,
            },
            async (span) => {
                const response = await chatSend(openrouter, {
                    chatRequest: {
                        model: env.MODEL_NAME,
                        messages: [
                            {
                                role: "user",
                                content: prompt,
                            },
                        ],
                    },
                });
                span.setAttribute("dependency.outcome", response.ok ? "success" : "error");
                if (!response.ok) {
                    span.setStatus({ code: SpanStatusCode.ERROR, message: "OpenRouter request failed" });
                }
                return response;
            },
        );

        if (!res.ok) {
            const sdkError = res.error as { status?: number };
            const outcome = sdkError?.status === 429 ? "rate_limited" : "error";
            recordMetric(() => {
                externalRequestsTotal.inc({ dependency: "openrouter", operation: "chat", outcome, status_class: statusClass(sdkError?.status) });
                externalRequestDuration.observe({ dependency: "openrouter", operation: "chat", outcome }, (Date.now() - externalStart) / 1000);
            });
            throw new APIError(String(res.error), sdkError?.status ?? 500);
        }

        recordMetric(() => {
            externalRequestsTotal.inc({ dependency: "openrouter", operation: "chat", outcome: "success", status_class: "2xx" });
            externalRequestDuration.observe({ dependency: "openrouter", operation: "chat", outcome: "success" }, (Date.now() - externalStart) / 1000);
        });

        const chatResult = res.value;
        const responseText = chatResult.choices[0]?.message?.content || "";
        const parsedResponse = parseAIResponse(responseText);
        const displayResponseText = stripAIResponseMetadata(responseText);

        await chatRepo.addConversationTurn(
            sessionId,
            userMessage,
            displayResponseText,
        );

        recordMetric(() => chatMessagesTotal.inc({ outcome: "success", model: env.MODEL_NAME, response_type: parsedResponse.type }));
        const durationMs = Date.now() - start;
        const context = requestContextStore.getStore();
        chatLogger.info(
            {
                event: "chat.message.processed",
                userId,
                sessionId,
                inputLength: userMessage.length,
                historyMessageCount: history.length,
                medicineContextCount: medicines.length,
                model: env.MODEL_NAME,
                responseType: parsedResponse.type,
                durationMs,
                requestId: context?.requestId,
            },
            "chat message processed",
        );

        const result: ChatMessageResponse = {
            sessionId,
            response: parsedResponse,
        };

        return result;
    } catch (error: any) {
        const outcome = externalOutcome(error);
        if (!(error instanceof APIError)) {
            recordMetric(() => {
                externalRequestsTotal.inc({ dependency: "openrouter", operation: "chat", outcome, status_class: statusClass(error?.status) });
                externalRequestDuration.observe({ dependency: "openrouter", operation: "chat", outcome }, (Date.now() - externalStart) / 1000);
            });
        }
        recordMetric(() => chatMessagesTotal.inc({ outcome, model: env.MODEL_NAME, response_type: "unknown" }));
        if (error.status === 429) {
            throw new APIError(
                "Rate limit exceeded. Please try again later.",
                429,
            );
        }
        throw new APIError("Failed to generate response", 500);
    }
}

export async function getMessages(sessionId: string, userId: string) {
    const sessionWithMessages = await chatRepo.findSessionWithMessages(
        sessionId,
        userId,
    );
    return {
        sessionId: sessionWithMessages.id,
        messages: sessionWithMessages.messages,
    };
}

export async function getAllSessions(userId: string) {
    return await chatRepo.findAllByUser(userId);
}

export async function deleteSession(sessionId: string, userId: string) {
    // Verify session exists and belongs to user
    const session = await chatRepo.findSessionById(sessionId, userId);

    // Delete session (cascade will delete messages due to Prisma cascade config)
    await chatRepo.deleteSession(sessionId, userId);

    const context = requestContextStore.getStore();
    chatLogger.info(
        {
            event: "chat.session.deleted",
            userId,
            sessionId,
            requestId: context?.requestId,
        },
        "chat session deleted",
    );

    return { success: true };
}
