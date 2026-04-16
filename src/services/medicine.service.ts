import { MedicineStatus } from "@prisma/client";
import { APIError } from "../errors/APIError.js";
import * as medicineRepo from "../repositories/medicine.repository.js";
import { computeStatus } from "./expiry.service.js";
import { PaginationInput } from "../schemas/common.schema.js";
import {
    CreateMedicineInput,
    ListMedicinesFilters,
    ListMedicinesSort,
    SortBySchema,
    UpdateMedicineInput,
} from "../schemas/medicine.schema.js";
import { SortOrderSchema } from "../schemas/common.schema.js";
import { PaginatedResponse } from "../types/index.js";

type MedicineListItem = Awaited<
    ReturnType<typeof medicineRepo.findManyByUser>
>[number];

export type ListMedicinesResult = PaginatedResponse<MedicineListItem>;

export async function createMedicine(
    userId: string,
    input: CreateMedicineInput,
) {
    const status = computeStatus(input.expiryDate);
    return await medicineRepo.create(userId, { ...input, status });
}

export async function listMedicines(
    userId: string,
    filters: ListMedicinesFilters,
    pagination: PaginationInput,
    sort: ListMedicinesSort,
): Promise<ListMedicinesResult> {
    const [items, total] = await Promise.all([
        medicineRepo.findManyByUser(userId, {
            filters,
            page: pagination.page,
            limit: pagination.limit,
            sort,
        }),
        medicineRepo.countByUser(userId, filters),
    ]);
    const totalPages = Math.ceil(total / pagination.limit);
    return {
        total,
        page: pagination.page,
        limit: pagination.limit,
        hasMore: pagination.page < totalPages,
        totalPages,
        items,
    };
}

export async function getMedicineById(userId: string, medicineId: string) {
    try {
        return await medicineRepo.findByIdForUser(medicineId, userId);
    } catch (err: any) {
        if (err.code === "P2025")
            throw new APIError(`Medicine with ID ${medicineId} Not Found`, 404);
    }
}

export async function updateMedicine(
    userId: string,
    medicineId: string,
    updatePayload: UpdateMedicineInput,
) {
    try {
        const updated = await medicineRepo.updateForUser(
            medicineId,
            userId,
            updatePayload,
        );
        if (updatePayload.expiryDate) {
            const newStatus = computeStatus(updatePayload.expiryDate);
            if (newStatus !== updated.status) {
                return await medicineRepo.updateStatus(medicineId, newStatus);
            }
        }
        return updated;
    } catch (err: any) {
        if (err.code === "P2025")
            throw new APIError(`Medicine with ID ${medicineId} Not Found`, 404);
    }
}

export async function removeMedicine(userId: string, medicineId: string) {
    try {
        return await medicineRepo.markRemoved(medicineId, userId);
    } catch (err: any) {
        if (err.code === "P2025")
            throw new APIError(`Medicine with ID ${medicineId} Not Found`, 404);
    }
}

export async function syncMedicineStatuses() {
    const referenceDate = new Date();
    referenceDate.setHours(23, 59, 59, 999);

    const candidates =
        await medicineRepo.findCandidatesForStatusSync(referenceDate);
    const results = [];

    for (const candidate of candidates) {
        const newStatus = computeStatus(candidate.expiryDate);
        if (newStatus !== candidate.status) {
            const updated = await medicineRepo.updateStatus(
                candidate.id,
                newStatus,
            );
            results.push({
                id: candidate.id,
                oldStatus: candidate.status,
                newStatus,
                updated,
            });
        }
    }

    return results;
}
