import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

export const sanitizePlainText = (text: string): string => {
    if (!text) return "";
    return purify.sanitize(text, { ALLOWED_TAGS: [] });
};

export const sanitizeTrustedHtml = (html: string): string => {
    if (!html) return "";

    return purify.sanitize(html, {
        ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "span", "a"],
        ALLOWED_ATTR: ["href", "target", "rel"],
        ALLOW_DATA_ATTR: false,
    });
};
