import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../validators/authSchema.js";
import { authController } from "../controllers/authController.js";
import { loginRateLimit } from "../middlewares/loginRateLimit.js";

const router = Router();

router.post(
    "/register",
    validate({ body: registerSchema }),
    authController.register,
);

router.post(
    "/login",
    loginRateLimit,
    validate({ body: loginSchema }),
    authController.login,
);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

export default router;
