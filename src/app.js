import express from "express";
import cors from "cors";
import helmet from "helmet";
import { apiRateLimit } from "./middlewares/apiRateLimit.js";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import siteRoutes from "./routes/siteRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { requestId } from "./middlewares/requestId.js";
import { authenticate } from "./middlewares/authenticate.js";
import { config } from "./config/index.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import metricsRoutes from "./routes/metricsRoutes.js";
import { metricsMiddleware } from "./middlewares/metricsMiddleware.js";
import docsRoutes from "./routes/docsRoutes.js";

const app = express();

// Trust one reverse proxy hop (Nginx) so req.ip / rate-limit see the real client IP.
app.set("trust proxy", 1);

app.use(requestId);
app.use(requestLogger);
app.use(metricsMiddleware);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(
    helmet({
        // Swagger UI needs inline scripts/styles and a CDN for assets
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "script-src": ["'self'", "'unsafe-inline'", "https://unpkg.com"],
                "style-src": ["'self'", "'unsafe-inline'", "https://unpkg.com"],
                "img-src": ["'self'", "data:", "https://unpkg.com"],
                "connect-src": ["'self'"],
            },
        },
    }),
);
app.use(
    cors({
        origin: config.corsOrigins,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        credentials: true, // allow cookies to be sent in requests
    }),
);

app.use("/api", apiRateLimit);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", docsRoutes);
app.use("/metrics", metricsRoutes);

app.use("/api", authenticate);

app.use("/api/equipment", equipmentRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
