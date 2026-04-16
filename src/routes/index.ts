import { Router } from "express";
import auth from "./auth.routes.js";
import users from "./user.routes.js";
import medicines from "./medicine.routes.js";

const router = Router();

router.use("/auth", auth);
router.use("/users", users);
router.use("/medicines", medicines);

export default router;
