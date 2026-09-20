import express from "express";
import equipmentRoutes from "./routes/equipmentRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import requestRoutes from "./routes/requestRoutes.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";

const app = express();

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/equipment", equipmentRoutes);
app.use("/api/requests", requestRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
