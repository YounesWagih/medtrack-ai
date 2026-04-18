import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate.js";
import {
    AuthenticatedAndValidatedRequest,
    ValidatedData,
} from "../middlewares/validate.js";
import * as aiChatService from "../services/ai-chat.service.js";
import { ResponseHelper } from "../utils/responseHelper.js";
import { SessionIdParam, SendMessageInput } from "../schemas/chat.schema.js";

export const createSession = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const session = await aiChatService.createSession(userId);
    return res
        .status(201)
        .json(
            ResponseHelper.success(
                "Chat session created successfully",
                session,
            ),
        );
};

export const sendMessage = async (
    req: AuthenticatedAndValidatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const { id: sessionId } = req.validated?.params as SessionIdParam;
    const { content } = req.validated?.body as SendMessageInput;

    const result = await aiChatService.sendMessage(sessionId, userId, content);
    return res
        .status(200)
        .json(
            ResponseHelper.success(
                "Message sent successfully",
                result,
            ),
        );
};

export const getMessages = async (
    req: AuthenticatedAndValidatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const { id: sessionId } = req.validated?.params as SessionIdParam;

    const result = await aiChatService.getMessages(sessionId, userId);
    return res
        .status(200)
        .json(ResponseHelper.success("Messages fetched", result));
};