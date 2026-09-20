import { logger } from "../logger/index.js";

// Логирует метод, путь, статус, длительность и requestId.
export function requestLogger(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
        logger.info("request completed", {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
        });
    });
    next();
}
