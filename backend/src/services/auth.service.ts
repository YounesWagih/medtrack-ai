import { LoginInput, RegisterInput } from "../schemas/auth.schema.js";
import * as userRepo from "../repositories/user.repository.js";
import { APIError } from "../errors/APIError.js";
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
    const existingUser = await userRepo.findByemail(data.email);
    if (existingUser) throw new APIError("Email is already existed", 409);

    const hashedPassword = await argon2.hash(data.password);

    const user = await userRepo.create({
        email: data.email,
        name: data.name,
        password: hashedPassword,
    });

    const token = generateToken(user.id);

    return {
        user,
        token,
    };
}

export async function login(data: LoginInput) {
    const user = await userRepo.findByemailWithPassword(data.email);
    if (!user) throw new APIError("Invalid Credentials", 401);

    const isPasswordValid = await argon2.verify(user.password, data.password);
    if (!isPasswordValid) throw new APIError("Invalid credentials", 401);

    const token = generateToken(user.id);

    return {
        user: {
            email: user.email,
            name: user.name,
        },
        token,
    };
}
