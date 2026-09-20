import { BaseError } from "../errors/BaseError.js";
import { config } from "../config/index.js";

export function errorHandler(err, req, res, next) {
    const statusCode = err instanceof BaseError ? err.statusCode : 500;
    const code = err instanceof BaseError ? err.code : "INTERNAL_ERROR";
    const message =
        err instanceof BaseError || config.nodeEnv !== "production"
            ? err.message
            : "Internal server error";
    const details = err instanceof BaseError ? err.details : [];

    res.status(statusCode).json({
        error: {
            code,
            message,
            details,
            requestId: req.requestId ?? null,
        },
    });
}
