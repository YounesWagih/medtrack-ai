import { ChatMessage, ChatMessageRole } from "@prisma/client";

const MAX_MEDICINES = 50;
const MAX_HISTORY_MESSAGES = 10;

type ChatMessageType = Pick<ChatMessage, "role" | "content" | "createdAt">;

export const buildPrompt = (
    userMessage: string,
    medicineList: { name: string; expiryDate: Date }[],
    history: ChatMessageType[],
): string => {
    const systemInstruction = `You are a medical assistant helping users understand their medications. IMPORTANT: I am an AI assistant, not a doctor. Always include a disclaimer that users should consult their healthcare provider for medical advice.`;

    const formattedMedicines = medicineList
        .slice(0, MAX_MEDICINES)
        .map((med) => {
            const expiryStr = med.expiryDate.toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
            });
            return `- ${med.name} (expires: ${expiryStr})`;
        })
        .join("\n");

    const medicineSection =
        formattedMedicines.length > 0
            ? `User's current medicines (max ${MAX_MEDICINES}):\n${formattedMedicines}`
            : "User has no medicines recorded.";

    const recentHistory = history.slice(-MAX_HISTORY_MESSAGES * 2);
    const historySection = recentHistory
        .map((msg) => {
            const role = msg.role === ChatMessageRole.USER ? "User" : "Assistant";
            return `${role}: ${msg.content}`;
        })
        .join("\n");

    const prompt = `${systemInstruction}

${medicineSection}

${
        historySection
            ? `Conversation history:\n${historySection}`
            : "No previous conversation."
    }

Current user message: ${userMessage}

Please provide clear, helpful responses and ask if the user needs clarification. Always include a disclaimer that you are not a doctor and users should consult their healthcare provider for medical advice.`;

    return prompt;
};