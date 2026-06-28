import assert from "node:assert/strict";
import { test } from "node:test";
import { ChatMessageRole } from "@prisma/client";
import {
    buildSafetyQuestionsMessage,
    needsSafetyQuestions,
} from "../src/utils/medicalSafetyGate.js";

test("medicine recommendation requests require safety questions first", () => {
    assert.equal(needsSafetyQuestions("Should I take Panadol?", []), true);
    assert.equal(needsSafetyQuestions("What dosage should I use?", []), true);
    assert.equal(needsSafetyQuestions("هل عندي دواء للكحة؟", []), true);
});

test("medicine information requests do not require the safety gate", () => {
    assert.equal(needsSafetyQuestions("Tell me about aspirin", []), false);
});

test("safety questions are not repeated after they were already asked", () => {
    const safetyMessage = buildSafetyQuestionsMessage("Should I take Panadol?");

    assert.equal(
        needsSafetyQuestions("Should I take Panadol?", [
            {
                role: ChatMessageRole.ASSISTANT,
                content: safetyMessage,
                createdAt: new Date(),
            },
        ]),
        false,
    );
});

test("Arabic requests receive Arabic safety questions", () => {
    const message = buildSafetyQuestionsMessage("هل عندي دواء للكحة؟");

    assert.match(message, /ما عمرك/);
    assert.match(message, /حساسية/);
});
