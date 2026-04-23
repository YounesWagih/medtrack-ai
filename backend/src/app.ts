import "dotenv/config";
import express, { Express, Request, Response } from "express";
import globalExceptionHandler from "./middlewares/globalExceptionHandler.js";
import router from "./routes/index.js";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";

const app: Express = express();

app.use(helmet());
app.use(
    cors({
        origin: env.FRONTEND_URL || "http://localhost:5173",
    }),
);
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1", router);

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timeStamp: new Date().toISOString() });
});

app.use(globalExceptionHandler);

export default app;
