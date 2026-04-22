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
    description: z.string().optional(),
    longDescription: z.string().optional(),
    image: z.url().optional(),
});

export const UpdateMedicineSchema = CreateMedicineSchema.partial();

export const MedicineIdParamSchema = z.object({
    id: z.uuid("Invalid medicine ID format"),
});

export const MedicineSlugParamSchema = z.object({
    slug: z.string().min(1, "Slug is required"),
});

export const SearchMedicinesSchema = z.object({
    q: z.string().min(1, "Search query is required"),
    page: z.coerce.number().int().positive().default(1),
    page_size: z.coerce.number().int().positive().max(24).default(24),
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

export const SortSchema = z.object({
    sortBy: SortBySchema,
    sortOrder: SortOrderSchema,
});

export const ListMedicineQuerySchema = PaginationSchema.extend({
    ...ListMedicineFiltersSchema.shape,
    ...SortSchema.shape,
});

export type CreateMedicineInput = z.infer<typeof CreateMedicineSchema>;
export type UpdateMedicineInput = z.infer<typeof UpdateMedicineSchema>;
export type MedicineIdParam = z.infer<typeof MedicineIdParamSchema>;
export type MedicineSlugParam = z.infer<typeof MedicineSlugParamSchema>;
export type SearchMedicinesInput = z.infer<typeof SearchMedicinesSchema>;
export type ListMedicineQuery = z.infer<typeof ListMedicineQuerySchema>;
export type ListMedicinesFilters = z.infer<typeof ListMedicineFiltersSchema>;
export type ListMedicinesSort = z.infer<typeof SortSchema>;
