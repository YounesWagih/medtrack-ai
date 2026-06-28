import { ChatMessage, ChatMessageRole } from "@prisma/client";

type ChatMessageType = Pick<ChatMessage, "role" | "content" | "createdAt">;

const SAFETY_QUESTION_MARKER = "Before I can discuss medicine use or dosage safely";

const ENGLISH_RECOMMENDATION_PATTERNS = [
    /\b(recommend|recommendation|suggest|should i|can i|may i)\b/i,
    /\b(take|use)\b.*\b(medicine|medication|drug|pill|tablet|syrup)\b/i,
    /\b(medicine|medication|drug|pill|tablet|syrup)\b.*\b(take|use)\b/i,
    /\b(dose|dosage|how much|how often|frequency)\b/i,
    /\b(what should i take|what can i take|medicine for|medication for)\b/i,
];

const ARABIC_RECOMMENDATION_PATTERNS = [
    /(?:أ|ا)ستخدم|(?:آ|ا)خذ|اخد|استعمال|ينفع/i,
    /جرع(?:ة|ه)|كام مرة|كم مرة|كل كام|كل كم/i,
    /رشح|ترشح|تنصح|انصح/i,
    /دواء\s+ل|دوا\s+ل|للكحة|للسعال|للصداع|للألم|للالم|للبرد/i,
];

export const buildSafetyQuestionsMessage = (userMessage: string): string => {
    if (containsArabic(userMessage)) {
        return `${SAFETY_QUESTION_MARKER}, please answer these questions first:

1. ما عمرك؟
2. هل لديك أي حساسية من أدوية؟
3. هل لديك أي أمراض أو حالات صحية مثل مشاكل الكبد أو الكلى أو القلب أو السكري؟
4. هل تتناول حاليا أي أدوية أخرى؟
5. هل أنت حامل أو ترضعين؟`;
    }

    return `${SAFETY_QUESTION_MARKER}, please answer these questions first:

1. What is your age?
2. Do you have any medication allergies?
3. Do you have any medical conditions, such as liver or kidney problems, heart disease, or diabetes?
4. Are you currently taking any other medications?
5. Are you pregnant or breastfeeding?`;
};

export const needsSafetyQuestions = (
    userMessage: string,
    previousHistory: ChatMessageType[],
): boolean => {
    return isLikelyMedicineRecommendationRequest(userMessage)
        && !hasSafetyQuestionsBeenAsked(previousHistory);
};

const isLikelyMedicineRecommendationRequest = (message: string): boolean => {
    const normalized = message.trim();
    if (!normalized) return false;

    return ENGLISH_RECOMMENDATION_PATTERNS.some((pattern) => pattern.test(normalized))
        || ARABIC_RECOMMENDATION_PATTERNS.some((pattern) => pattern.test(normalized));
};

const hasSafetyQuestionsBeenAsked = (history: ChatMessageType[]): boolean => {
    return history.some(
        (message) =>
            message.role === ChatMessageRole.ASSISTANT
            && message.content.includes(SAFETY_QUESTION_MARKER),
    );
};

const containsArabic = (text: string): boolean => /[\u0600-\u06FF]/.test(text);
