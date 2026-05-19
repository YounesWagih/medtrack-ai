import { MedicineStatus } from "@prisma/client";
import * as medicineRepo from "../repositories/medicine.repository.js";
import { computeStatus, getEndOfDay, getStartOfDay } from "./expiry.service.js";
import { PaginationInput } from "../schemas/common.schema.js";
import {
    CreateMedicineInput,
    ListMedicinesFilters,
    ListMedicinesSort,
    UpdateMedicineInput,
} from "../schemas/medicine.schema.js";
import { PaginatedResponse } from "../types/index.js";
import { env } from "../config/env.js";

type MedicineListItem = Awaited<
    ReturnType<typeof medicineRepo.findManyByUser>
>[number];

export type ListMedicinesResult = PaginatedResponse<MedicineListItem>;

export async function createMedicine(
    userId: string,
    input: CreateMedicineInput,
) {
    const status = computeStatus(input.expiryDate);
    const { description, longDescription, image } = input;
    return await medicineRepo.create(userId, {
        name: input.name,
        expiryDate: input.expiryDate,
        status,
        description,
        longDescription,
        image,
    });
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
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
        hasMore: pagination.page < totalPages,
        totalPages,
    };
}

export async function getMedicineById(userId: string, medicineId: string) {
    return await medicineRepo.findByIdForUser(medicineId, userId);
}

export async function updateMedicine(
    userId: string,
    medicineId: string,
    updatePayload: UpdateMedicineInput,
) {
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
}

export async function removeMedicine(userId: string, medicineId: string) {
    return await medicineRepo.markRemoved(medicineId, userId);
}

export async function syncMedicineStatuses() {
    const threshold = env.MEDICINE_EXPIRING_SOON_DAYS;
    const now = new Date();
    const todayStart = getStartOfDay(now);
    const referenceDate = getEndOfDay(now);
    referenceDate.setDate(referenceDate.getDate() + threshold);

    // Direct SQL sync - computes and updates statuses in a single DB operation
    const changes = await medicineRepo.syncStatusesRaw(
        todayStart,
        referenceDate,
    );

    const medicines = changes.map((row) => ({
        userId: row.userId,
        medicineId: row.id,
        medicineName: row.name,
        oldStatus: row.old_status as MedicineStatus,
        newStatus: row.new_status as MedicineStatus,
    }));

    return medicines;
}
