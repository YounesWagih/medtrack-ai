import { prisma } from "../db/PrismaClient.js";
import { MedicineStatus, Prisma } from "@prisma/client";
import { SortBySchema } from "../schemas/medicine.schema.js";
import { SortOrderSchema } from "../schemas/common.schema.js";

type MedicineCreateInput = {
    name: string;
    expiryDate: Date;
};

type MedicineUpdateInput = {
    name?: string;
    expiryDate?: Date;
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
    return await prisma.medicine.create({
        data: {
            ...data,
            userId,
        },
        select: MEDICINE_SELECT,
    });
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

//FIXME: user can search on removed medicines!!
export async function findByIdForUser(id: string, userId: string) {
    return prisma.medicine.findFirst({
        where: { id, userId },
        select: MEDICINE_SELECT,
    });
}

export async function updateForUser(
    id: string,
    userId: string,
    data: MedicineUpdateInput,
) {
    return prisma.medicine.update({
        where: { id, userId },
        data,
        select: MEDICINE_SELECT,
    });
}

export async function markRemoved(id: string, userId: string) {  
  return prisma.medicine.update({
        where: { id, userId },
        data: { status: MedicineStatus.REMOVED },
        select: MEDICINE_SELECT,
    });
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

export async function updateStatus(id: string, status: MedicineStatus) {
    return prisma.medicine.update({
        where: { id },
        data: { status },
        select: MEDICINE_SELECT,
    });
}
