import { z, ZodType } from "zod";
import { PaginationSchema, SortOrderSchema } from "./common.schema.js";

// type DeepNonNullable<T> = T extends (infer U)[]
//   ? DeepNonNullable<U>[]
//   : T extends object
//   ? { [K in keyof T]: DeepNonNullable<T[K]> }
//   : NonNullable<T>;

// export type Infer<T extends ZodType> = DeepNonNullable<z.infer<T>>;

export const MedicineStatusEnum = z.enum([
    "ACTIVE",
    "EXPIRING_SOON",
    "EXPIRED",
    "REMOVED",
]);

export const CreateMedicineSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .max(255, "Name must be less than 255 characters"),
    expiryDate: z.coerce.date(),
});

export const UpdateMedicineSchema = CreateMedicineSchema.partial();

export const MedicineIdParamSchema = z.object({
    id: z.uuid("Invalid medicine ID format"),
});

export const ListMedicineFiltersSchema = z
    .object({
        status: MedicineStatusEnum,
        search: z.string().max(100),
    })
    .partial();

export const SortBySchema = z
    .enum(["name", "expiryDate", "createdAt"])
    .default("createdAt");

export const ListMedicineQuerySchema = PaginationSchema.extend({
    ...ListMedicineFiltersSchema.shape,
    sortBy: SortBySchema,
    sortOrder: SortOrderSchema,
});

export const RemoveMedicineSchema = z.object({});

export type CreateMedicineInput = z.infer<typeof CreateMedicineSchema>;
export type UpdateMedicineInput = z.infer<typeof UpdateMedicineSchema>;
export type MedicineIdParam = z.infer<typeof MedicineIdParamSchema>;
export type ListMedicineQuery = z.infer<typeof ListMedicineQuerySchema>;
export type RemoveMedicineInput = z.infer<typeof RemoveMedicineSchema>;
export type ListMedicinesFilters = z.infer<typeof ListMedicineFiltersSchema>;
