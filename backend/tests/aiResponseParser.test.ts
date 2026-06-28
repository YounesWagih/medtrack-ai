import assert from "node:assert/strict";
import { test } from "node:test";
import {
    parseAIResponse,
    stripAIResponseMetadata,
} from "../src/utils/aiResponseParser.js";
import { buildPrompt } from "../src/utils/promptBuilder.js";

test("prompt does not request MEDICINE_NAMES metadata", () => {
    const prompt = buildPrompt("هل عندي بخاخ للأنف؟", [], []);

    assert.doesNotMatch(prompt, /MEDICINE_NAMES/);
});

test("prompt does not duplicate backend safety-question gate", () => {
    const prompt = buildPrompt("Should I take Panadol?", [], []);

    assert.doesNotMatch(prompt, /SAFETY QUESTIONS/);
    assert.doesNotMatch(prompt, /Before providing any medicine recommendation/);
});

test("text response markers are parsed case-insensitively", () => {
    const parsed = parseAIResponse(`[TYPE:TEXT]
نعم، لديك بخاخ الأنف.`);

    assert.equal(parsed.type, "text");
    assert.equal(parsed.content, "نعم، لديك بخاخ الأنف.");
    assert.deepEqual(parsed.extractedMedicineNames, []);
});

test("display content removes internal AI response metadata defensively", () => {
    const displayContent = stripAIResponseMetadata(`[TYPE:Text]
نعم، لديك بخاخ الأنف Lergemed Nasal Spray 15 ml.

MEDICINE_NAMES: Lergemed Nasal Spray 15 ml`);

    assert.equal(
        displayContent,
        "نعم، لديك بخاخ الأنف Lergemed Nasal Spray 15 ml.",
    );
});
