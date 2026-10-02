import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { registerSchema, loginSchema } from "../validators/authSchema.js";
import { authController } from "../controllers/authController.js";
import rateLimit from "express-rate-limit";

const router = Router();

const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Too many login attempts",
                details: [],
                requestId: req.requestId ?? null,
            },
        });
    },
});

router.post(
    "/register",
    validate({ body: registerSchema }),
    authController.register,
);

router.post(
    "/login",
    loginRateLimiter,
    validate({ body: loginSchema }),
    authController.login,
);

export default router;
