import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { getMe } from "../controllers/user.controller.js";
const router = Router();

router.get("/me", authenticate, getMe);

export default router;
