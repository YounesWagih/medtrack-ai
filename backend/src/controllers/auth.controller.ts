import { Request, Response } from "express";
import * as authService from "../services/auth.service.js";
import { ResponseHelper } from "../utils/responseHelper.js";

export const register = async (req: Request, res: Response) => {
    const newUser = await authService.register(req.body);
    return res
        .status(201)
        .json(ResponseHelper.success("User Registered Successfully", newUser));
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  return res.status(200).json(ResponseHelper.success("Login successfull", result))
};
