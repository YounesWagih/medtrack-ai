import { z } from "zod";

const EmailSchema = z.email("Invalid email format");
const PasswordSchema = z.string().min(8, "Password must be at least 8 characters");

export const LoginSchema = z.object({
    email: EmailSchema,
    password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
    email: EmailSchema,
    password: PasswordSchema,
    name: z
        .string()
        .min(1, "Name is required")
        .max(100, "Name must be less than 100 characters"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
