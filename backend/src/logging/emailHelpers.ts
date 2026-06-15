import { createHash } from "node:crypto";

export function hashEmail(email: string): string {
    return createHash("sha256").update(email).digest("hex").slice(0, 16);
}

export function maskEmail(email: string): string {
    const parts = email.split("@");
    const localPart = parts[0];
    const domain = parts[1];
    if (!domain) return "***";
    if (!localPart || localPart.length <= 1) return `*@${domain}`;
    return `${localPart[0]}***@${domain}`;
}
