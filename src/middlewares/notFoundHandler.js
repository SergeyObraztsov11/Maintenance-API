import { NotFoundError } from "../errors/NotFoundError.js";

// Неизвестный маршрут -> единый формат 404.

export function notFoundHandler(req, res, next) {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}
