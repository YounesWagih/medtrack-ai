import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

export const sanitizeInput = (text: string): string => {
    if (!text) return "";
    return purify.sanitize(text, { ALLOWED_TAGS: [] });
};