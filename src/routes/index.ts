import { Router } from "express";
import auth from "./auth.routes.js";
import users from "./user.routes.js";

const router = Router();

router.use("/auth", auth);
router.use("/users", users);

export default router;
