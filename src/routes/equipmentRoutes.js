// Маршруты /api/equipment -> методы контроллера.

import { Router } from "express";
import { equipmentController } from "../controllers/equipmentController.js";
import { requestController } from "../controllers/requestController.js";
import { validate } from "../middlewares/validate.js";
import {
    equipmentIdParamsSchema,
    equipmentListQuerySchema,
    createEquipmentBodySchema,
    updateEquipmentBodySchema,
} from "../validators/equipmentSchemas.js";
import { z } from "zod";

const weatherQuerySchema = z
    .object({
        days: z.coerce.number().int().min(1).max(7).optional(),
    })
    .strict();

const router = Router();

router.get(
    "/",
    validate({ query: equipmentListQuerySchema }),
    equipmentController.list,
);

router.post(
    "/",
    validate({ body: createEquipmentBodySchema }),
    equipmentController.create,
);

router.get(
    "/:id/requests",
    validate({ params: equipmentIdParamsSchema }),
    requestController.listByEquipment,
);

router.get(
    "/:id/weather",
    validate({
        params: equipmentIdParamsSchema,
        query: weatherQuerySchema,
    }),
    equipmentController.getWeather,
);

router.get(
    "/:id",
    validate({ params: equipmentIdParamsSchema }),
    equipmentController.getById,
);

router.patch(
    "/:id",
    validate({
        params: equipmentIdParamsSchema,
        body: updateEquipmentBodySchema,
    }),
    equipmentController.update,
);

router.delete(
    "/:id",
    validate({ params: equipmentIdParamsSchema }),
    equipmentController.remove,
);

export default router;
