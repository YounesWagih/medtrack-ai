import { chatSend } from "@openrouter/sdk/funcs/chatSend.js";
import { OpenRouterCore } from "@openrouter/sdk/core.js";
import { ChatSessionStatus, ChatMessageRole } from "@prisma/client";
import { env } from "../config/env.js";
import { APIError } from "../errors/APIError.js";
import * as chatRepo from "../repositories/chat.repository.js";
import * as medicineRepo from "../repositories/medicine.repository.js";
import { buildPrompt } from "../utils/promptBuilder.js";
import { parseAIResponse } from "../utils/aiResponseParser.js";
import { ChatMessageResponse } from "../types/index.js";

const openrouter = new OpenRouterCore({
    apiKey: env.OPENROUTER_API_KEY,
});

export async function createSession(userId: string) {
    return await chatRepo.createSession(userId, ChatSessionStatus.ACTIVE);
}

export async function sendMessage(
    sessionId: string,
    userId: string,
    userMessage: string,
) {
    const session = await chatRepo.findSessionById(sessionId, userId);
    if (!session) {
        throw new APIError("Chat session not found", 404);
    }

    await chatRepo.addMessage(sessionId, ChatMessageRole.USER, userMessage);

    const history = await chatRepo.findMessagesBySession(sessionId);

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
    console.log(prompt, "--------------------------------------");
    try {
        const res = await chatSend(openrouter, {
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

        if (!res.ok) {
            throw new APIError(String(res.error), 500);
        }

        const chatResult = res.value;
        const responseText = chatResult.choices[0]?.message?.content || "";

        await chatRepo.addMessage(
            sessionId,
            ChatMessageRole.ASSISTANT,
            responseText,
        );

        const parsedResponse = parseAIResponse(responseText);
        const result: ChatMessageResponse = {
            sessionId,
            response: parsedResponse,
        };

        return result;
    } catch (error: any) {
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
    if (!sessionWithMessages) {
        throw new APIError("Chat session not found", 404);
    }
    return {
        sessionId: sessionWithMessages.id,
        messages: sessionWithMessages.messages,
    };
}
