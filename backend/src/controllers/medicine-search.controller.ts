import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate.js";
import {
    AuthenticatedAndValidatedRequest,
    ValidatedData,
} from "../middlewares/validate.js";
import { searchMedicines, getMedicineDetails } from "../services/medicine-api.service.js";
import { ResponseHelper } from "../utils/responseHelper.js";
import { SearchMedicinesInput, MedicineSlugParam } from "../schemas/medicine.schema.js";

export const searchMedicinesHandler = async (
    req: AuthenticatedAndValidatedRequest,
    res: Response,
) => {
    const input = req.validated?.body as SearchMedicinesInput;
    const results = await searchMedicines(input.q, input.page, input.page_size);
    return res
        .status(200)
        .json(ResponseHelper.success("Medicines found", results));
};

export const getMedicineDetailsHandler = async (
    req: AuthenticatedAndValidatedRequest,
    res: Response,
) => {
    const params = req.validated?.params as MedicineSlugParam;
    const details = await getMedicineDetails(params.slug);
    
    if (!details) {
        return res
            .status(404)
            .json(ResponseHelper.error("Medicine not found", 404));
    }
    
    return res
        .status(200)
        .json(ResponseHelper.success("Medicine details found", details));
};