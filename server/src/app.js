import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import rawMaterialRoutes from "./modules/inventory/rawMaterial.routes.js";
import batchRoutes from "./modules/inventory/batch.routes.js";
import readyStockRoutes from "./modules/inventory/readyStock.routes.js";
import uploadRoutes from "./modules/uploads/upload.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/requestLogger.js";

const app = express();

// nginx runs on the same box in front of this app, so only trust
// X-Forwarded-For when it comes from localhost. This makes req.ip
// resolve to the real client IP (needed for rate limiting) without
// letting an external client spoof the header to bypass it.
app.set("trust proxy", "loopback");

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(requestLogger);
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/raw-materials", rawMaterialRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/ready-stock", readyStockRoutes);
app.use("/api/uploads", uploadRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "breaktime-bakers-api",
  });
});

app.use(errorHandler);

export default app;
