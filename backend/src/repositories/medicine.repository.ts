import { prisma } from "../db/PrismaClient.js";
import { MedicineStatus, Prisma } from "@prisma/client";
import { SortBySchema } from "../schemas/medicine.schema.js";
import { SortOrderSchema } from "../schemas/common.schema.js";
import {
    UniqueConstraintError,
    ForeignKeyError,
    ResourceNotFoundError,
    DatabaseError,
    classifyPrismaError,
} from "../errors/DomainError.js";

type MedicineCreateInput = {
    name: string;
    expiryDate: Date;
    description?: string;
    longDescription?: string;
    image?: string;
};

type MedicineUpdateInput = {
    name?: string;
    expiryDate?: Date;
    description?: string;
    longDescription?: string;
    image?: string;
};

export type MedicineListFilters = {
    status?: MedicineStatus;
    search?: string;
};

export type SortOptions = {
    sortBy: typeof SortBySchema._output;
    sortOrder: typeof SortOrderSchema._output;
};

export type ListParams = {
    filters: MedicineListFilters;
    page: number;
    limit: number;
    sort: SortOptions;
};

const MEDICINE_SELECT = {
    id: true,
    userId: true,
    name: true,
    expiryDate: true,
    status: true,
    description: true,
    longDescription: true,
    image: true,
    createdAt: true,
    updatedAt: true,
} as const;

const buildWhereClause = (
    userId: string,
    filters: MedicineListFilters,
): Prisma.MedicineWhereInput => {
    const where: Prisma.MedicineWhereInput = { userId };
    if (filters.status) {
        where.status = filters.status;
    } else {
        where.status = {
            not: MedicineStatus.REMOVED,
        };
    }
    if (filters.search) {
        where.name = {
            contains: filters.search,
            mode: "insensitive",
        };
    }
    return where;
};

export async function create(
    userId: string,
    data: MedicineCreateInput & { status: MedicineStatus },
) {
    try {
        return await prisma.medicine.create({
            data: {
                ...data,
                userId,
            },
            select: MEDICINE_SELECT,
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err);
        if (domainErr) throw domainErr;
        throw new DatabaseError("Failed to create medicine");
    }
}

export async function findManyByUser(userId: string, params: ListParams) {
    const { filters, page, limit, sort } = params;

    const where = buildWhereClause(userId, filters);

    return prisma.medicine.findMany({
        where,
        select: MEDICINE_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort.sortBy]: sort.sortOrder },
    });
}

export async function countByUser(
    userId: string,
    filters: MedicineListFilters,
) {
    const where = buildWhereClause(userId, filters);
    return prisma.medicine.count({ where });
}

export async function findByIdForUser(id: string, userId: string) {
    try {
        return await prisma.medicine.findUniqueOrThrow({
            where: { id, userId },
            select: MEDICINE_SELECT,
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err, "Medicine");
        if (domainErr) throw domainErr;
        throw new ResourceNotFoundError("Medicine");
    }
}

export async function updateForUser(
    id: string,
    userId: string,
    data: MedicineUpdateInput,
) {
    try {
        return await prisma.medicine.update({
            where: { id, userId },
            data,
            select: MEDICINE_SELECT,
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err, "Medicine");
        if (domainErr) throw domainErr;
        throw new ResourceNotFoundError("Medicine");
    }
}

export async function markRemoved(id: string, userId: string) {
    try {
        return await prisma.medicine.update({
            where: { id, userId },
            data: { status: MedicineStatus.REMOVED },
            select: MEDICINE_SELECT,
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err);
        if (domainErr) throw domainErr;
        throw new ResourceNotFoundError("Medicine");
    }
}

export async function findCandidatesForStatusSync(referenceDate: Date) {
    return prisma.medicine.findMany({
        where: {
            status: {
                not: MedicineStatus.REMOVED,
            },
            expiryDate: {
                lte: referenceDate,
            },
        },
        select: {
            id: true,
            expiryDate: true,
            status: true,
        },
    });
}

export async function findStatusSyncChanges(
    todayStart: Date,
    referenceDate: Date,
) {
    return prisma.$transaction([
        prisma.medicine.findMany({
            where: {
                status: {
                    notIn: [MedicineStatus.REMOVED, MedicineStatus.EXPIRED],
                },
                expiryDate: {
                    lt: todayStart,
                },
            },
            select: {
                id: true,
                status: true,
            },
        }),
        prisma.medicine.findMany({
            where: {
                status: {
                    notIn: [
                        MedicineStatus.REMOVED,
                        MedicineStatus.EXPIRING_SOON,
                    ],
                },
                expiryDate: {
                    gte: todayStart,
                    lte: referenceDate,
                },
            },
            select: {
                id: true,
                status: true,
            },
        }),
    ]);
}

/**
 * Syncs medicine statuses directly in the database using raw SQL.
 * Returns an array of changed records with old and new statuses.
 */
export async function syncStatusesRaw(
    todayStart: Date,
    referenceDate: Date,
): Promise<Array<{ id: string; userId: string; name: string; old_status: string; new_status: string }>> {
    const result = await prisma.$queryRaw<Array<{ id: string; userId: string; name: string; old_status: string; new_status: string }>>`
        WITH new_statuses AS (
            SELECT
                m.id,
                m."userId",
                m.name,
                m."status" AS old_status,
                CASE
                    WHEN m."expiryDate" < ${todayStart} THEN 'EXPIRED'::"MedicineStatus"
                    WHEN m."expiryDate" <= ${referenceDate} THEN 'EXPIRING_SOON'::"MedicineStatus"
                    ELSE 'ACTIVE'::"MedicineStatus"
                END AS new_status
            FROM "Medicine" m
            WHERE
                m."status" != 'REMOVED'
                AND (
                    (m."expiryDate" < ${todayStart} AND m."status" != 'EXPIRED')
                    OR (m."expiryDate" >= ${todayStart} AND m."expiryDate" <= ${referenceDate} AND m."status" != 'EXPIRING_SOON')
                    OR (m."expiryDate" > ${referenceDate} AND m."status" != 'ACTIVE')
                )
        ),
        updated AS (
            UPDATE "Medicine"
            SET "status" = ns.new_status, "updatedAt" = NOW()
            FROM new_statuses ns
            WHERE "Medicine".id = ns.id
            RETURNING "Medicine".id, "Medicine"."userId", "Medicine".name, "Medicine"."status" AS new_status, ns.old_status
        )
        SELECT * FROM updated;
    `;

    return result;
}

export async function updateManyStatus(ids: string[], status: MedicineStatus) {
    if (ids.length === 0) {
        return { count: 0 };
    }

    return prisma.medicine.updateMany({
        where: {
            id: {
                in: ids,
            },
        },
        data: { status },
    });
}

export async function findManyByIds(ids: string[]) {
    if (ids.length === 0) {
        return [];
    }

    return prisma.medicine.findMany({
        where: {
            id: {
                in: ids,
            },
        },
        select: MEDICINE_SELECT,
    });
}

export async function updateStatus(id: string, status: MedicineStatus) {
    try {
        return await prisma.medicine.update({
            where: { id },
            data: { status },
            select: MEDICINE_SELECT,
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err, "Medicine");
        if (domainErr) throw domainErr;
        throw new ResourceNotFoundError("Medicine");
    }
}

export async function findByName(userId: string, name: string) {
    try {
        return await prisma.medicine.findFirstOrThrow({
            where: {
                userId,
                name: { equals: name, mode: "insensitive" },
                status: { not: MedicineStatus.REMOVED },
            },
            select: MEDICINE_SELECT,
        });
    } catch (err) {
        const domainErr = classifyPrismaError(err, "Medicine");
        if (domainErr) throw domainErr;
        throw new ResourceNotFoundError("Medicine");
    }
}
