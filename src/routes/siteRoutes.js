import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { siteIdParamsSchema } from "../validators/reportSchemas.js";
import { reportController } from "../controllers/reportController.js";

const router = Router();

router.get(
    "/:id/summary",
    validate({ params: siteIdParamsSchema }),
    reportController.getSiteSummary,
);

export default router;
