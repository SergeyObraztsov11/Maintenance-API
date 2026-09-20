// Маршруты /api/equipment -> методы контроллера.

import { Router } from "express";
import { equipmentController } from "../controllers/equipmentController.js";
import { requestController } from "../controllers/requestController.js";

const router = Router();

router.get("/", equipmentController.list);
router.post("/", equipmentController.create);
router.get("/:id/requests", requestController.listByEquipment);
router.get("/:id/weather", equipmentController.getWeather);
router.get("/:id", equipmentController.getById);
router.patch("/:id", equipmentController.update);
router.delete("/:id", equipmentController.remove);

export default router;
