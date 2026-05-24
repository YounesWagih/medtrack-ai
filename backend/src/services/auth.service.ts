import { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import * as userRepo from "../repositories/user.repository.js";
import { APIError } from "../errors/APIError.js";
import {
    EmailAlreadyExistsError,
    DatabaseError,
} from "../errors/DomainError.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const TOKEN_EXPIRES_IN = "7d";

function generateToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
        expiresIn: TOKEN_EXPIRES_IN,
    });
}

export async function register(data: RegisterInput) {
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
        if (err instanceof DatabaseError) {
            throw new APIError("Registration failed", 500);
        }
        throw err;
    }

    const token = generateToken(user.id);

    return {
        user,
        token,
    };
}

export async function login(data: LoginInput) {
    const user = await userRepo.findByemailWithPassword(data.email);

    const isPasswordValid = await argon2.verify(user.password, data.password);
    if (!isPasswordValid) throw new APIError("Invalid credentials", 401);

    const token = generateToken(user.id);

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
}
