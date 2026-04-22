import { z } from "zod";

export const CreateSessionSchema = z.object({}).default({});

export const SendMessageSchema = z.object({
    content: z.string().min(1, "Message content is required").max(4000),
});

export const SessionIdParamSchema = z.object({
    id: z.uuid("Invalid session ID format"),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type SessionIdParam = z.infer<typeof SessionIdParamSchema>;