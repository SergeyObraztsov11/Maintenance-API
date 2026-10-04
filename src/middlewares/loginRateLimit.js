import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";
import { TooManyRequestsError } from "../errors/TooManyRequestsError.js";

const passThrough = (_req, _res, next) => next();

export const loginRateLimit =
    config.nodeEnv === "test"
        ? passThrough
        : rateLimit({
              windowMs: 15 * 60 * 1000,
              max: 20,
              standardHeaders: true,
              legacyHeaders: false,
              handler: (req, res, next) => {
                  next(new TooManyRequestsError("Too many login attempts"));
              },
          });
