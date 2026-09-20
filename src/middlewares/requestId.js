import { randomUUID } from "node:crypto";

// Присваивает id запросу и отдаёт его клиенту в заголовке.
export function requestId(req, res, next) {
    const id = req.headers["x-request-id"] || randomUUID();
    req.requestId = id;
    res.setHeader("X-Request-Id", id);
    next();
}
