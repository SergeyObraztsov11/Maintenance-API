import { Router } from "express";
import { getMetrics, getMetricsContentType } from "../metrics/index.js";

const router = Router();

router.get("/", async (req, res) => {
    res.setHeader("Content-Type", getMetricsContentType());
    res.end(await getMetrics());
});

export default router;
