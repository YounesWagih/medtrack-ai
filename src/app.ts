import "dotenv/config";
import express, { Express, Request, Response } from "express";
import globalExceptionHandler from "./middlewares/globalExceptionHandler.js";
import { APIError } from "./errors/APIError.js";

const app: Express = express();

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timeStamp: new Date().toISOString() });
});

app.use(globalExceptionHandler);

export default app;
