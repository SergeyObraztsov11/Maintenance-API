import { Router } from "express";
import { requestController } from "../controllers/requestController.js";
import { validate } from "../middlewares/validate.js";
import {
    requestIdParamsSchema,
    requestListQuerySchema,
    createRequestBodySchema,
    updateRequestBodySchema,
    changeStatusBodySchema,
} from "../validators/requestSchemas.js";

const router = Router();

router.get(
    "/",
    validate({ query: requestListQuerySchema }),
    requestController.list,
);
router.post(
    "/",
    validate({ body: createRequestBodySchema }),
    requestController.create,
);
router.patch(
    "/:id/status",
    validate({
        params: requestIdParamsSchema,
        body: changeStatusBodySchema,
    }),
    requestController.changeStatus,
);
router.get(
    "/:id",
    validate({ params: requestIdParamsSchema }),
    requestController.getById,
);
router.patch(
    "/:id",
    validate({
        params: requestIdParamsSchema,
        body: updateRequestBodySchema,
    }),
    requestController.update,
);
router.delete(
    "/:id",
    validate({ params: requestIdParamsSchema }),
    requestController.remove,
);

export default router;
