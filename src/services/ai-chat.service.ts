import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatSessionStatus, ChatMessageRole, MedicineStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { APIError } from "../errors/APIError.js";
import * as chatRepo from "../repositories/chat.repository.js";
import * as medicineRepo from "../repositories/medicine.repository.js";
import { buildPrompt } from "../utils/promptBuilder.js";
import { sanitizeInput } from "../utils/sanitizer.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    generationConfig: {
        maxOutputTokens: parseInt(env.GEMINI_MAX_TOKENS),
        temperature: parseFloat(env.GEMINI_TEMPERATURE),
    },
});

export async function createSession(userId: string) {
    return await chatRepo.createSession(userId, ChatSessionStatus.ACTIVE);
}

export async function sendMessage(
    sessionId: string,
    userId: string,
    userMessage: string,
) {
    //NOTE: we already sanitize usermessage in the sanitize middleware

    /*1 query approach?
        -current approach 2 queries:
            findSessionById (existance, authority)
            addMessage
        -1 query approach
            make addMessage check on authority by make it session:{connect: {sessionId, userId }}
            but this require to make userId unique in ChatSession table which we should put unqiue key on (userId)
    */
    const session = await chatRepo.findSessionById(sessionId, userId);
    if (!session) {
        throw new APIError("Chat session not found", 404);
    }

    //TODO: we can catch P2003 error (chat not exist) in case chat deleted after above check
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

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const responseText = response.text();

        await chatRepo.addMessage(
            sessionId,
            ChatMessageRole.ASSISTANT,
            responseText,
        );

        return { sessionId, response: responseText };
    } catch (error: any) {
        if (error.status === 429) {
            throw new APIError("Rate limit exceeded. Please try again later.", 429);
        }
        if (error.message?.includes("blocked")) {
            throw new APIError(
                "Content was blocked by safety filters. Please modify your message.",
                400,
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