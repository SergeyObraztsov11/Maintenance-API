export const config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5500")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX) || 100,
    timeoutMs: Number(process.env.REQUEST_TIMEOUT_MS) || 5000,
    forecastBaseUrl:
        process.env.FORECAST_BASE_URL || "https://api.open-meteo.com",
    weatherWindMaxMs: Number(process.env.WEATHER_WIND_MAX_MS) || 12,
    weatherPrecipitationMaxMm:
        Number(process.env.WEATHER_PRECIPITATION_MAX_MM) || 0.1,
    apiKey: process.env.API_KEY || "",
    db: {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        name: process.env.DB_NAME || "maintenance",
        user: process.env.DB_USER || "maintenance",
        password: process.env.DB_PASSWORD || "",
        poolMin: Number(process.env.DB_POOL_MIN) || 0,
        poolMax: Number(process.env.DB_POOL_MAX) || 10,
    },
};
