import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { registerSchema } from "../validators/authSchema.js";
import { authController } from "../controllers/authController.js";

const router = Router();

router.post(
    "/register",
    validate({ body: registerSchema }),
    authController.register,
);

export default router;
