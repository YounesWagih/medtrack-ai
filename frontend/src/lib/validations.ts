import { z } from 'zod';

// Enums for medicine status - use string literals instead of enums to avoid TypeScript restrictions
export type MedicineStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'REMOVED';

// Email must be a valid email string
export const emailSchema = z.string().min(1, 'Email is required').email('Invalid email address');

// Password schema
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Name schema
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(100);

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Export inferred type
export type LoginInput = z.infer<typeof loginSchema>;

// Register schema
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Export inferred type
export type RegisterInput = z.infer<typeof registerSchema>;

// Medicine schema
export const medicineSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }),
});

// Export inferred type
export type MedicineInput = z.infer<typeof medicineSchema>;

// Pagination and filter schemas
export const listMedicineQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum(['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'REMOVED', 'ALL']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'expiryDate', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
