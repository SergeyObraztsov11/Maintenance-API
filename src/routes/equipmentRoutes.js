// Маршруты /api/equipment -> методы контроллера.

import { Router } from "express";
import { equipmentController } from "../controllers/equipmentController.js";
import { requestController } from "../controllers/requestController.js";
import { validate } from "../middlewares/validate.js";
import { allowedRoles } from "../middlewares/allowedRoles.js";
import {
    equipmentIdParamsSchema,
    equipmentListQuerySchema,
    createEquipmentBodySchema,
    updateEquipmentBodySchema,
    weatherQuerySchema,
} from "../validators/equipmentSchemas.js";

const router = Router();

router.get(
    "/",
    validate({ query: equipmentListQuerySchema }),
    equipmentController.list,
);

router.post(
    "/",
    allowedRoles(["admin"]),
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
    allowedRoles(["admin"]),
    validate({
        params: equipmentIdParamsSchema,
        body: updateEquipmentBodySchema,
    }),
    equipmentController.update,
);

router.delete(
    "/:id",
    allowedRoles(["admin"]),
    validate({ params: equipmentIdParamsSchema }),
    equipmentController.remove,
);

export default router;
