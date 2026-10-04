import { recordHttpRequest } from "../metrics/index.js";

export function metricsMiddleware(req, res, next) {
    // Сам /metrics не считаем
    if (req.path === "/metrics") {
        return next();
    }

    const route = req.originalUrl.split("?")[0];
    const startMs = Date.now();

    res.on("finish", () => {
        recordHttpRequest({
            method: req.method,
            route,
            statusCode: res.statusCode,
            durationSec: Number(((Date.now() - startMs) / 1000).toFixed(3)),
        });
    });

    next();
}
