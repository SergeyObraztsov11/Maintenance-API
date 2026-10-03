import { Router } from "express";
import { sequelize } from "../db/index.js";

const router = Router();

router.get("/live", (req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: Math.floor(process.uptime()),
    });
});

router.get("/ready", async (req, res) => {
    try {
        await sequelize.authenticate();
        res.status(200).json({
            status: "ok",
        });
    } catch {
        res.status(503).json({
            status: "error",
        });
    }
});

export default router;
