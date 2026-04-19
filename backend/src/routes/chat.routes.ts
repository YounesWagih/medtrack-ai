import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { sanitizeInputMiddleware } from "../middlewares/sanitizeInput.js";
import {
    CreateSessionSchema,
    SendMessageSchema,
    SessionIdParamSchema,
} from "../schemas/chat.schema.js";
import * as chatController from "../controllers/chat.controller.js";

const router = Router();

router.post(
    "/sessions",
    authenticate,
    validate(CreateSessionSchema),
    chatController.createSession,
);

router.post(
    "/sessions/:id/messages",
    authenticate,
    rateLimit,
    sanitizeInputMiddleware,
    validate(SessionIdParamSchema, "params"),
    validate(SendMessageSchema),
    chatController.sendMessage,
);

router.get(
    "/sessions/:id/messages",
    authenticate,
    validate(SessionIdParamSchema, "params"),
    chatController.getMessages,
);

export default router;