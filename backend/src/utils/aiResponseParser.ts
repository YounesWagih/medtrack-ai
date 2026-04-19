import {
    ChatRecommendationMedicine,
    ChatResponseData,
} from "../types/index.js";

export const parseAIResponse = (rawResponse: string): ChatResponseData => {
    if (!rawResponse) {
        return {
            type: "text",
            content: "",
            extractedMedicineNames: [],
        };
    }

    const lines = rawResponse.split("\n");
    if (lines.length === 0) {
        return {
            type: "text",
            content: "",
            extractedMedicineNames: [],
        };
    }

    let type: "recommendation" | "text" = "text";
    let content = "";
    let medicines: ChatRecommendationMedicine[] = [];
    let extractedMedicineNames: string[] = [];
    let currentMedicine: Partial<ChatRecommendationMedicine> | null = null;
    let inMedicineBlock = false;
    let currentField: keyof ChatRecommendationMedicine | null = null;

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (line.startsWith("[TYPE:RECOMMENDATION]")) {
            type = "recommendation";
            inMedicineBlock = true;
            continue;
        }

        if (line.startsWith("[TYPE:Text]")) {
            type = "text";
            continue;
        }

        if (line.startsWith("MEDICINE_NAMES:")) {
            const namesPart = line.replace("MEDICINE_NAMES:", "").trim();
            if (namesPart !== "none") {
                extractedMedicineNames = namesPart
                    .split(",")
                    .map((n) => n.trim());
            }
            continue;
        }

        if (line.startsWith("notes:") && currentMedicine && currentField === "recommendation") {
            currentMedicine.recommendation =
                (currentMedicine.recommendation || "") + " " + line.replace("notes:", "").trim();
            continue;
        }

        if (type === "recommendation" && inMedicineBlock) {
            if (line.startsWith("- name:")) {
                if (currentMedicine && currentMedicine.name) {
                    medicines.push(currentMedicine as ChatRecommendationMedicine);
                }
                currentMedicine = {
                    name: line.replace("- name:", "").trim(),
                };
                currentField = "name";
                continue;
            }

            if (currentMedicine === null) {
                continue;
            }

            if (line.startsWith("recommendation:")) {
                currentMedicine.recommendation = line.replace("recommendation:", "").trim();
                currentField = "recommendation";
                continue;
            }

            if (line.startsWith("dosage:")) {
                currentMedicine.dosage = line.replace("dosage:", "").trim();
                currentField = "dosage";
                continue;
            }

            if (line.startsWith("frequency:")) {
                currentMedicine.frequency = line.replace("frequency:", "").trim();
                currentField = "frequency";
                continue;
            }
        }

        if (type === "text" || (!inMedicineBlock && !line.startsWith("-") && !line.startsWith("notes:"))) {
            if (content) {
                content += "\n";
            }
            content += line;
        }
    }

    if (currentMedicine && currentMedicine.name) {
        medicines.push(currentMedicine as ChatRecommendationMedicine);
    }

    content = content.trim();

    return {
        type,
        content,
        medicines: type === "recommendation" ? medicines : undefined,
        extractedMedicineNames: type === "recommendation" ? extractedMedicineNames : [],
    };
};