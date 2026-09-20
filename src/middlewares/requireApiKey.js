import { BaseError } from "../errors/BaseError.js";
import { config } from "../config/index.js";

// Protects mutating methods with X-API-Key header.

export function requireApiKey(req, res, next) {
    const method = req.method.toUpperCase();
    if (!["POST", "PATCH", "DELETE"].includes(method)) {
        return next();
    }

    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== config.apiKey) {
        return next(
            new BaseError("Invalid or missing API key", {
                statusCode: 401,
                code: "UNAUTHORIZED",
            }),
        );
    }

    return next();
}
