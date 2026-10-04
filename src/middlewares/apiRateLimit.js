import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";
import { TooManyRequestsError } from "../errors/TooManyRequestsError.js";

const passThrough = (_req, _res, next) => next();

export const apiRateLimit =
    config.nodeEnv === "test"
        ? passThrough
        : rateLimit({
              windowMs: config.rateLimitWindowMs,
              max: config.rateLimitMax,
              standardHeaders: true,
              legacyHeaders: false,
              handler: (req, res, next) => {
                  next(new TooManyRequestsError("Too many requests"));
              },
          });
