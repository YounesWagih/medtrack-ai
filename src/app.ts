import "dotenv/config";
import express, { Express, Request, Response } from "express";

const app: Express = express();



app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timeStamp: new Date().toISOString() });
});

export default app;
