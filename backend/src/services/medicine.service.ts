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
import { createMedicineLogger } from "../logging/logger.js";
import { requestContextStore } from "../logging/context.js";
import { sanitizeTrustedHtml } from "../utils/sanitizer.js";

const medicineLogger = createMedicineLogger();

type MedicineListItem = Awaited<
    ReturnType<typeof medicineRepo.findManyByUser>
>[number];

export type ListMedicinesResult = PaginatedResponse<MedicineListItem>;

export async function createMedicine(
    userId: string,
    input: CreateMedicineInput,
) {
    const status = computeStatus(input.expiryDate);
    const { image } = input;
    const description = input.description
        ? sanitizeTrustedHtml(input.description)
        : undefined;
    const longDescription = input.longDescription
        ? sanitizeTrustedHtml(input.longDescription)
        : undefined;
    const newMedicine = await medicineRepo.create(userId, {
        name: input.name,
        expiryDate: input.expiryDate,
        status,
        description,
        longDescription,
        image,
    });

    const context = requestContextStore.getStore();
    medicineLogger.info(
        {
            event: "medicine.created",
            userId,
            medicineId: newMedicine.id,
            changedFields: ["name", "expiryDate", "description", "longDescription", "image"],
            status,
            requestId: context?.requestId,
            traceId: context?.traceId,
        },
        "medicine created",
    );

    return newMedicine;
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
    const result = {
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
        hasMore: pagination.page < totalPages,
        totalPages,
    };

    medicineLogger.debug(
        {
            event: "medicine.listed",
            userId,
            page: pagination.page,
            limit: pagination.limit,
            sortBy: sort.sortBy,
            sortOrder: sort.sortOrder,
            filterKeys: Object.keys(filters),
            resultCount: items.length,
        },
        "medicines listed",
    );

    return result;
}

export async function getMedicineById(userId: string, medicineId: string) {
    return await medicineRepo.findByIdForUser(medicineId, userId);
}

export async function updateMedicine(
    userId: string,
    medicineId: string,
    updatePayload: UpdateMedicineInput,
) {
    const sanitizedPayload: UpdateMedicineInput = { ...updatePayload };
    if (typeof sanitizedPayload.description === "string") {
        sanitizedPayload.description = sanitizeTrustedHtml(sanitizedPayload.description);
    }
    if (typeof sanitizedPayload.longDescription === "string") {
        sanitizedPayload.longDescription = sanitizeTrustedHtml(sanitizedPayload.longDescription);
    }

    const updated = await medicineRepo.updateForUser(
        medicineId,
        userId,
        sanitizedPayload,
    );
    if (sanitizedPayload.expiryDate) {
        const newStatus = computeStatus(sanitizedPayload.expiryDate);
        if (newStatus !== updated.status) {
            const statusUpdated = await medicineRepo.updateStatus(medicineId, newStatus);
            const context = requestContextStore.getStore();
            medicineLogger.info(
                {
                    event: "medicine.updated",
                    userId,
                    medicineId,
                    changedFields: Object.keys(sanitizedPayload),
                    oldStatus: updated.status,
                    newStatus: statusUpdated.status,
                    requestId: context?.requestId,
                    traceId: context?.traceId,
                },
                "medicine updated with status transition",
            );
            return statusUpdated;
        }
    }

    const context = requestContextStore.getStore();
    medicineLogger.info(
        {
            event: "medicine.updated",
            userId,
            medicineId,
            changedFields: Object.keys(sanitizedPayload),
            status: updated.status,
            requestId: context?.requestId,
            traceId: context?.traceId,
        },
        "medicine updated",
    );

    return updated;
}

export async function removeMedicine(userId: string, medicineId: string) {
    const updated = await medicineRepo.markRemoved(medicineId, userId);
    const context = requestContextStore.getStore();
    medicineLogger.info(
        {
            event: "medicine.removed",
            userId,
            medicineId,
            status: updated.status,
            requestId: context?.requestId,
            traceId: context?.traceId,
        },
        "medicine removed",
    );
    return updated;
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

    medicineLogger.info(
        {
            event: "medicine.status_sync_completed",
            updatedCount: medicines.length,
            threshold,
        },
        `medicine status sync completed: ${medicines.length} medicines updated`,
    );

    return medicines;
}
