import client from "prom-client";
import { config } from "../config/index.js";

// Склад всех метрик
const register = new client.Registry();

// Стандартные метрики процесса Node (память, CPU...)
// Skip in tests: default metrics use intervals that keep Jest open.
if (config.nodeEnv !== "test") {
    client.collectDefaultMetrics({ register });
}

// Число запросов (по method / route / status)
const httpRequestTotal = new client.Counter({
    name: "http_request_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
});
register.registerMetric(httpRequestTotal);

// Длительность запросов в секундах
const httpRequestDurationSeconds = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDurationSeconds);

// Обёртка: одним вызовом записать счётчик и длительность
function recordHttpRequest({ method, route, statusCode, durationSec }) {
    const labels = {
        method,
        route,
        status_code: String(statusCode),
    };

    httpRequestTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSec);
}

// Текст метрик для Prometheus
async function getMetrics() {
    return register.metrics();
}

// Content-Type, который ждёт Prometheus
function getMetricsContentType() {
    return register.contentType;
}

export { recordHttpRequest, getMetrics, getMetricsContentType };
