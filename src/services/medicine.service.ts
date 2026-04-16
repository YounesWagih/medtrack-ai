import { MedicineStatus } from "@prisma/client";
import { APIError } from "../errors/APIError.js";
import * as medicineRepo from "../repositories/medicine.repository.js";
import { computeStatus } from "./expiry.service.js";
import { PaginationInput } from "../schemas/common.schema.js";

export type CreateMedicineInput = {
  name: string;
  expiryDate: Date;
};

export type UpdateMedicineInput = {
  name?: string;
  expiryDate?: Date;
};

export type ListMedicinesFilters = {
  status?: MedicineStatus;
};

export async function createMedicine(userId: string, input: CreateMedicineInput) {
  const status = computeStatus(input.expiryDate);
  return medicineRepo.create(userId, { ...input, status });
}

export async function listMedicines(userId: string, filters: ListMedicinesFilters, pagination: PaginationInput) {
  const [items, total] = await Promise.all([
    medicineRepo.findManyByUser(userId, { filters, page: pagination.page, limit: pagination.limit }),
    medicineRepo.countByUser(userId, filters),
  ]);
  return { items, total, page: pagination.page, limit: pagination.limit };
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

  const updatePayload: medicineRepo.MedicineUpdateInput = {};
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