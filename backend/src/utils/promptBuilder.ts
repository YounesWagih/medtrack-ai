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

RESPONSE FORMAT INSTRUCTIONS:
After your response, you MUST classify it by starting with exactly one of these markers:
- [TYPE:RECOMMENDATION] - When recommending medicines from user's medicine list
- [TYPE:TEXT] - For all other responses (advice, existence check, analysis, errors, general info)

RECOMMENDATION FORMAT (when starting with [TYPE:RECOMMENDATION]):
[TYPE:RECOMMENDATION]
medicines (one or more, use exact names from list above):
- name: EXACT_MEDICINE_NAME
  recommendation: Explain when/how to use this medicine
  dosage: The dosage amount (e.g., "1 tablet", "5ml")
  frequency: How often (e.g., "every 4-6 hours", "once daily")
- name: ANOTHER_MEDICINE_NAME
  recommendation: ...
  dosage: ...
  frequency: ...
notes: Any additional notes or warnings (e.g., disclaimer)

TEXT FORMAT (when starting with [TYPE:TEXT]):
[TYPE:TEXT]
Your response content here...

IMPORTANT:
- Use EXACT medicine names as they appear in the user's medicine list above
- If recommending a medicine NOT in user's list, use [TYPE:TEXT] and inform them
- Never diagnose or prescribe - only recommend from medicines they already have
- Write human-facing text in the SAME LANGUAGE as the user's query.
- Keep all response markers and structural labels exactly as shown in English: [TYPE:...], medicines, name, recommendation, dosage, frequency, notes.`;

    return prompt;
};
