import { MedicineStatus } from "@prisma/client";
import { APIError } from "../errors/APIError.js";
import * as medicineRepo from "../repositories/medicine.repository.js";
import { computeStatus } from "./expiry.service.js";
import { PaginationInput } from "../schemas/common.schema.js";
import { CreateMedicineInput, SortBySchema } from "../schemas/medicine.schema.js";
import { SortOrderSchema } from "../schemas/common.schema.js";
import { PaginatedResponse } from "../types/index.js";

type ListMedicinesFilters = {
    status?: MedicineStatus;
    search?: string;
};

type ListMedicinesSort = {
    sortBy: typeof SortBySchema._output;
    sortOrder: typeof SortOrderSchema._output;
};

type MedicineListItem = Awaited<ReturnType<typeof medicineRepo.findManyByUser>>[number];

export type ListMedicinesResult = PaginatedResponse<MedicineListItem>;

type UpdateMedicineInput = {
    name?: string;
    expiryDate?: Date;
};

export async function createMedicine(userId: string, input: CreateMedicineInput) {
  const status = computeStatus(input.expiryDate);
  return medicineRepo.create(userId, { ...input, status });
}

export async function listMedicines(
  userId: string,
  filters: ListMedicinesFilters,
  pagination: PaginationInput,
  sort: ListMedicinesSort,
): Promise<ListMedicinesResult> {
  const [items, total] = await Promise.all([
    medicineRepo.findManyByUser(userId, { filters, page: pagination.page, limit: pagination.limit, sort }),
    medicineRepo.countByUser(userId, filters),
  ]);
  const totalPages = Math.ceil(total / pagination.limit);
  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    hasMore: pagination.page < totalPages,
    totalPages,
  };
}

export async function getMedicineById(userId: string, medicineId: string) {
  const medicine = await medicineRepo.findByIdForUser(medicineId, userId);
  if (!medicine) {
    throw new APIError(`Medicine with ID ${medicineId} not found`, 404);
  }
  return medicine;
}

export async function updateMedicine(userId: string, medicineId: string, input: UpdateMedicineInput) {
  const existing = await medicineRepo.findByIdForUser(medicineId, userId);
  if (!existing) {
    throw new APIError(`Medicine with ID ${medicineId} not found`, 404);
  }

  const updatePayload: UpdateMedicineInput = {};
  if (input.name) updatePayload.name = input.name;
  if (input.expiryDate) updatePayload.expiryDate = input.expiryDate;

  const updated = await medicineRepo.updateForUser(medicineId, userId, updatePayload);
  
  if (input.expiryDate) {
    const newStatus = computeStatus(input.expiryDate);
    if (newStatus !== existing.status) {
      return medicineRepo.updateStatus(medicineId, newStatus);
    }
  }
  
  return updated;
}

export async function removeMedicine(userId: string, medicineId: string) {
  const existing = await medicineRepo.findByIdForUser(medicineId, userId);
  if (!existing) {
    throw new APIError(`Medicine with ID ${medicineId} not found`, 404);
  }

  if (existing.status === MedicineStatus.REMOVED) {
    return existing;
  }

  return medicineRepo.markRemoved(medicineId, userId);
}

export async function syncMedicineStatuses() {
  const referenceDate = new Date();
  referenceDate.setHours(23, 59, 59, 999);
  
  const candidates = await medicineRepo.findCandidatesForStatusSync(referenceDate);
  const results = [];

  for (const candidate of candidates) {
    const newStatus = computeStatus(candidate.expiryDate);
    if (newStatus !== candidate.status) {
      const updated = await medicineRepo.updateStatus(candidate.id, newStatus);
      results.push({ id: candidate.id, oldStatus: candidate.status, newStatus, updated });
    }
  }

  return results;
}