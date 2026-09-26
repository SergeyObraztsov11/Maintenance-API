// Единый ответ об ошибке. requestId появляется после middleware requestId.

import { BaseError } from "../errors/BaseError.js";
import { config } from "../config/index.js";
import { logger } from "../logger/index.js";

function normalizeBodyParserError(err) {
    if (err?.type === "entity.parse.failed") {
        return new BaseError("Invalid JSON body", {
            statusCode: 400,
            code: "BAD_REQUEST",
        });
    }
    if (err?.type === "entity.too.large") {
        return new BaseError("Request body too large", {
            statusCode: 413,
            code: "PAYLOAD_TOO_LARGE",
        });
    }
    return null;
}

export function errorHandler(err, req, res, _next) {
    const mapped = normalizeBodyParserError(err);
    const error = mapped ?? err;

    const statusCode = error instanceof BaseError ? error.statusCode : 500;
    const code = error instanceof BaseError ? error.code : "INTERNAL_ERROR";
    const message =
        error instanceof BaseError || config.nodeEnv !== "production"
            ? error.message
            : "Internal server error";
    const details = error instanceof BaseError ? error.details : [];

    const logLevel = statusCode >= 500 ? "error" : "warn";
    logger[logLevel]("error handled", {
        requestId: req.requestId ?? null,
        statusCode,
        code,
        message,
        details,
    });

    res.status(statusCode).json({
        error: {
            code,
            message,
            details,
            requestId: req.requestId ?? null,
        },
    });
}
