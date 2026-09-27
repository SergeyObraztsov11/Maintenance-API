import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { siteIdParamsSchema } from "../validators/reportSchemas.js";
import { reportController } from "../controllers/reportController.js";

const router = Router();

router.get(
    "/sites/:id/summary",
    validate({ params: siteIdParamsSchema }),
    reportController.getSiteSummary,
);
router.get("/technicians/workload", reportController.getTechniciansWorkload);
export default router;
