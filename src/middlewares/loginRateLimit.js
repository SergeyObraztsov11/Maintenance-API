import rateLimit from "express-rate-limit";
import { TooManyRequestsError } from "../errors/TooManyRequestsError.js";

export const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new TooManyRequestsError("Too many login attempts"));
    },
});
