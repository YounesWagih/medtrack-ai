import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import {
  CreateMedicineSchema,
  UpdateMedicineSchema,
  MedicineIdParamSchema,
  ListMedicineQuerySchema,
  RemoveMedicineSchema,
} from "../schemas/medicine.schema.js";
import * as medicineController from "../controllers/medicine.controller.js";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(CreateMedicineSchema),
  medicineController.createMedicine,
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
  validate(RemoveMedicineSchema),
  medicineController.removeMedicine,
);

export default router;