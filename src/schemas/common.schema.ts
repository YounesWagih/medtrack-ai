import { z } from "zod";

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const SortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export type PaginationInput = z.infer<typeof PaginationSchema>;
export type SortOrder = z.infer<typeof SortOrderSchema>;