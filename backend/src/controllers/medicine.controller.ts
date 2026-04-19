import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate.js";
import {
    AuthenticatedAndValidatedRequest,
    ValidatedData,
} from "../middlewares/validate.js";
import * as medicineService from "../services/medicine.service.js";
import { ResponseHelper } from "../utils/responseHelper.js";
import { MedicineStatus } from "@prisma/client";
import {
    ListMedicineQuery,
    ListMedicinesFilters,
    MedicineIdParam,
} from "../schemas/medicine.schema.js";

type UpdateMedicineInput = {
    name?: string;
    expiryDate?: Date;
};

export const createMedicine = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const newMedicine = await medicineService.createMedicine(userId, {
        name: req.body.name,
        expiryDate: new Date(req.body.expiryDate),
    });
    return res
        .status(201)
        .json(
            ResponseHelper.success(
                "Medicine created successfully",
                newMedicine,
            ),
        );
};

export const listMedicines = async (
    req: AuthenticatedAndValidatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const query = req.validated?.query as ListMedicineQuery;
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const result = await medicineService.listMedicines(
        userId,
        filters,
        { page, limit },
        { sortBy, sortOrder },
    );
    return res
        .status(200)
        .json(ResponseHelper.success("Medicines fetched successfully", result));
};

export const getMedicineById = async (
    req: AuthenticatedAndValidatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const { id } = req.validated?.params as MedicineIdParam;
    const medicine = await medicineService.getMedicineById(userId, id);
    return res
        .status(200)
        .json(
            ResponseHelper.success("Medicine fetched successfully", medicine),
        );
};

export const updateMedicine = async (
    req: AuthenticatedAndValidatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const { id } = req.validated?.params as MedicineIdParam;
    const updateInput = req.validated?.body as UpdateMedicineInput;
    const updated = await medicineService.updateMedicine(
        userId,
        id,
        updateInput,
    );
    return res
        .status(200)
        .json(ResponseHelper.success("Medicine updated successfully", updated));
};

export const removeMedicine = async (
    req: AuthenticatedAndValidatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const { id } = req.validated?.params as MedicineIdParam;
    await medicineService.removeMedicine(userId, id);
    return res
        .status(200)
        .json(ResponseHelper.success("Medicine removed successfully", null));
};
