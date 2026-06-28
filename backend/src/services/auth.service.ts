import { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import * as userRepo from "../repositories/user.repository.js";
import { APIError } from "../errors/APIError.js";
import { EmailAlreadyExistsError } from "../errors/DomainError.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { createAuthLogger } from "../logging/logger.js";
import { requestContextStore } from "../logging/context.js";
import { hashEmail } from "../logging/emailHelpers.js";
import { recordMetric, workflowOperationsTotal } from "../metrics/metrics.js";

const authLogger = createAuthLogger();
const TOKEN_EXPIRES_IN = "7d";

function generateToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
        expiresIn: TOKEN_EXPIRES_IN,
    });
}

export async function register(data: RegisterInput) {
    try {
        const hashedPassword = await argon2.hash(data.password);

        let user;
        try {
            user = await userRepo.create({
                email: data.email,
                name: data.name,
                password: hashedPassword,
            });
        } catch (err) {
            if (err instanceof EmailAlreadyExistsError) {
                throw new APIError("Email already used", 409);
            }
            throw err;
        }

        const token = generateToken(user.id);

    const context = requestContextStore.getStore();
    authLogger.info(
        {
            event: "auth.registered",
            userId: user.id,
            emailHash: hashEmail(data.email),
            requestId: context?.requestId,
        },
        "user registered",
    );

        recordMetric(() => workflowOperationsTotal.inc({ workflow: "auth", operation: "register", outcome: "success" }));
        return { user, token };
    } catch (error) {
        recordMetric(() => workflowOperationsTotal.inc({ workflow: "auth", operation: "register", outcome: "error" }));
        throw error;
    }
}

export async function login(data: LoginInput) {
    try {
        const user = await userRepo.findByemailWithPassword(data.email);

        const isPasswordValid = await argon2.verify(user.password, data.password);
        if (!isPasswordValid) throw new APIError("Invalid credentials", 401);

    const token = generateToken(user.id);

    const context = requestContextStore.getStore();
    authLogger.info(
        {
            event: "auth.login_succeeded",
            userId: user.id,
            emailHash: hashEmail(data.email),
            requestId: context?.requestId,
        },
        "login succeeded",
    );

        recordMetric(() => workflowOperationsTotal.inc({ workflow: "auth", operation: "login", outcome: "success" }));
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            token,
        };
    } catch (error) {
        recordMetric(() => workflowOperationsTotal.inc({ workflow: "auth", operation: "login", outcome: "error" }));
        throw error;
    }
}
