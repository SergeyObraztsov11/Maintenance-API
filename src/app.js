import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { requestId } from "./middlewares/requestId.js";
import { requireApiKey } from "./middlewares/requireApiKey.js";
import { config } from "./config/index.js";

const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(helmet());
app.use(
    cors({
        origin: config.corsOrigins,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    }),
);
app.use(requestId);
app.use(requestLogger);

const apiRateLimit = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Too many requests",
                details: [],
                requestId: req.requestId ?? null,
            },
        });
    },
});

app.use("/api", apiRateLimit);
app.use("/api", requireApiKey);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/equipment", equipmentRoutes);
app.use("/api/requests", requestRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
