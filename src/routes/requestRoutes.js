import { Router } from "express";
import { requestController } from "../controllers/requestController.js";
import { validate } from "../middlewares/validate.js";
import {
    requestIdParamsSchema,
    requestListQuerySchema,
    createRequestBodySchema,
    updateRequestBodySchema,
    changeStatusBodySchema,
    setAssigneesBodySchema,
    assigneeParamsSchema,
} from "../validators/requestSchemas.js";
import { allowedRoles } from "../middlewares/allowedRoles.js";

const router = Router();

router.get(
    "/",
    validate({ query: requestListQuerySchema }),
    requestController.list,
);
router.post(
    "/",
    allowedRoles(["admin", "technician"]),
    validate({ body: createRequestBodySchema }),
    requestController.create,
);
router.patch(
    "/:id/status",
    allowedRoles(["admin", "technician"]),
    validate({
        params: requestIdParamsSchema,
        body: changeStatusBodySchema,
    }),
    requestController.changeStatus,
);
router.get(
    "/:id/history",
    validate({ params: requestIdParamsSchema }),
    requestController.getStatusHistory,
);
router.delete(
    "/:id/assignees/:technicianId",
    allowedRoles(["admin"]),
    validate({ params: assigneeParamsSchema }),
    requestController.removeAssignee,
);
router.post(
    "/:id/assignees",
    allowedRoles(["admin"]),
    validate({
        params: requestIdParamsSchema,
        body: setAssigneesBodySchema,
    }),
    requestController.setAssignees,
);
router.get(
    "/:id",
    validate({ params: requestIdParamsSchema }),
    requestController.getById,
);
router.patch(
    "/:id",
    allowedRoles(["technician", "admin"]),
    validate({
        params: requestIdParamsSchema,
        body: updateRequestBodySchema,
    }),
    requestController.update,
);
router.delete(
    "/:id",
    allowedRoles(["admin"]),
    validate({ params: requestIdParamsSchema }),
    requestController.remove,
);

export default router;
