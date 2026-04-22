import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import {
    CreateMedicineSchema,
    UpdateMedicineSchema,
    MedicineIdParamSchema,
    MedicineSlugParamSchema,
    SearchMedicinesSchema,
    ListMedicineQuerySchema,
} from "../schemas/medicine.schema.js";
import * as medicineController from "../controllers/medicine.controller.js";
import * as medicineSearchController from "../controllers/medicine-search.controller.js";

const router = Router();

router.post(
    "/",
    authenticate,
    validate(CreateMedicineSchema),
    medicineController.createMedicine,
);

router.post(
    "/search",
    authenticate,
    validate(SearchMedicinesSchema),
    medicineSearchController.searchMedicinesHandler,
);

router.get(
    "/details/:slug",
    authenticate,
    validate(MedicineSlugParamSchema, "params"),
    medicineSearchController.getMedicineDetailsHandler,
);

router.get(
    "/",
    authenticate,
    validate(ListMedicineQuerySchema, "query"),
    medicineController.listMedicines,
);

router.get(
    "/:id",
    authenticate,
    validate(MedicineIdParamSchema, "params"),
    medicineController.getMedicineById,
);

router.patch(
    "/:id",
    authenticate,
    validate(MedicineIdParamSchema, "params"),
    validate(UpdateMedicineSchema),
    medicineController.updateMedicine,
);

router.patch(
    "/:id/remove",
    authenticate,
    validate(MedicineIdParamSchema, "params"),
    medicineController.removeMedicine,
);

export default router;
