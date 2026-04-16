import { z } from "zod";
import { PaginationSchema } from "./common.schema.js";

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

export const UpdateMedicineSchema = z
    .object({
        name: z
            .string()
            .min(1, "Name is required")
            .max(255, "Name must be less than 255 characters")
            .optional(),
        expiryDate: z.coerce.date().optional(),
    })
    .refine(
        (data) => data.name !== undefined || data.expiryDate !== undefined,
        {
            message: "At least one field must be provided for update",
        },
    );

export const MedicineIdParamSchema = z.object({
    id: z.uuid("Invalid medicine ID format"),
});

export const ListMedicineQuerySchema = PaginationSchema.extend({
    status: MedicineStatusEnum.optional(),
});

export const RemoveMedicineSchema = z.object({});

export type CreateMedicineInput = z.infer<typeof CreateMedicineSchema>;
export type UpdateMedicineInput = z.infer<typeof UpdateMedicineSchema>;
export type MedicineIdParam = z.infer<typeof MedicineIdParamSchema>;
export type ListMedicineQuery = z.infer<typeof ListMedicineQuerySchema>;
export type RemoveMedicineInput = z.infer<typeof RemoveMedicineSchema>;
