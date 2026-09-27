// Единый ответ об ошибке. requestId появляется после middleware requestId.

import { BaseError } from "../errors/BaseError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { NotFoundError } from "../errors/NotFoundError.js";
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

function mapSequelizeError(err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
        const field = err.errors?.[0]?.path;
        const message = field
            ? `Value for "${field}" already exists`
            : "Unique constraint violated";
        return new ConflictError(message);
    }

    if (err?.name === "SequelizeForeignKeyConstraintError") {
        const message = String(err.parent?.detail ?? err.message ?? "");
        const isDeleteRestrict =
            /is still referenced|update or delete/i.test(message) ||
            err.parent?.code === "23503" &&
                /delete/i.test(String(err.parent?.message ?? err.message ?? ""));

        if (isDeleteRestrict) {
            return new ConflictError(
                "Cannot delete: related records still exist",
            );
        }

        return new NotFoundError("Related resource not found");
    }

    return null;
}

export function errorHandler(err, req, res, _next) {
    const mapped =
        normalizeBodyParserError(err) ?? mapSequelizeError(err) ?? err;
    const error = mapped;

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
