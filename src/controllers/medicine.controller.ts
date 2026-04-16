import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate.js";
import * as medicineService from "../services/medicine.service.js";
import { ResponseHelper } from "../utils/responseHelper.js";
import { MedicineStatus } from "@prisma/client";
import { ListMedicineQuery } from "../schemas/medicine.schema.js";

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
    req: AuthenticatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const { status, page, limit } = req.query as unknown as ListMedicineQuery;
    const result = await medicineService.listMedicines(
        userId,
        { status },
        { page, limit },
    );
    return res
        .status(200)
        .json(ResponseHelper.success("Medicines fetched successfully", result));
};

export const getMedicineById = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const medicine = await medicineService.getMedicineById(userId, id);
    return res
        .status(200)
        .json(
            ResponseHelper.success("Medicine fetched successfully", medicine),
        );
};

export const updateMedicine = async (
    req: AuthenticatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const updateInput: medicineService.UpdateMedicineInput = {};
    if (req.body.name) updateInput.name = req.body.name;
    if (req.body.expiryDate)
        updateInput.expiryDate = new Date(req.body.expiryDate);

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
    req: AuthenticatedRequest,
    res: Response,
) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await medicineService.removeMedicine(userId, id);
    return res
        .status(200)
        .json(ResponseHelper.success("Medicine removed successfully", null));
};
