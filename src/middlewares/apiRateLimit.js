import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";
import { TooManyRequestsError } from "../errors/TooManyRequestsError.js";

export const apiRateLimit = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new TooManyRequestsError("Too many requests"));
    },
});
