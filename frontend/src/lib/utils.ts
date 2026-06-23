import { clsx, type ClassValue } from "clsx";
import DOMPurify from "dompurify";
import { twMerge } from "tailwind-merge";
import type { CreateMedicineDto } from "@/types/api";
import type { MedicineInput } from "@/lib/validations";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "span", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function cleanMedicineInput(input: MedicineInput): CreateMedicineDto {
  const cleaned: CreateMedicineDto = {
    name: input.name,
    expiryDate: input.expiryDate,
  };

  if (input.image?.trim()) cleaned.image = input.image;
  if (input.description?.trim()) cleaned.description = input.description;
  if (input.longDescription?.trim()) cleaned.longDescription = input.longDescription;

  return cleaned;
}
