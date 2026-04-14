import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate.js";
import * as userService from "../services/user.service.js";
import { ResponseHelper } from "../utils/responseHelper.js";

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
    const user = await userService.findById(req.user?.userId!);

    res.status(200).json(
        ResponseHelper.success("User retrieved successfully", { user }),
    );
};
