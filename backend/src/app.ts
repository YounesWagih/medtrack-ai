import "dotenv/config";
import express, { Express, Request, Response } from "express";
import globalExceptionHandler from "./middlewares/globalExceptionHandler.js";
import { APIError } from "./errors/APIError.js";
import router from "./routes/index.js";
import morgan from "morgan";
import cors from "cors";

const app: Express = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use("/api/v1", router);

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timeStamp: new Date().toISOString() });
});

app.use(globalExceptionHandler);

export default app;
