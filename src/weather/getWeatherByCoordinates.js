// Клиент Open-Meteo из кейса 1. Дальше вызывается из weather-сервиса, не из контроллера.

import { config } from "../config/index.js";

function buildUrl(latitude, longitude, days) {
    const url = new URL("/v1/forecast", config.forecastBaseUrl);
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set(
        "daily",
        "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
    );
    url.searchParams.set("forecast_days", String(days));
    url.searchParams.set("timezone", "auto");
    return url;
}

export async function getWeatherByCoordinates(latitude, longitude, days) {
    const url = buildUrl(latitude, longitude, days);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
        const response = await fetch(url.href, { signal: controller.signal });

        if (response.status >= 400 && response.status < 500) {
            throw new Error(`Forecast client error (${response.status})`);
        }
        if (response.status >= 500) {
            throw new Error(`Forecast server error (${response.status})`);
        }

        let data;
        try {
            data = await response.json();
        } catch (error) {
            throw new Error("Invalid JSON in forecast response", {
                cause: error,
            });
        }

        const daily = data.daily;
        if (!daily?.time) {
            throw new Error("Forecast data is missing");
        }

        return daily.time.map((time, index) => ({
            date: time,
            maxTemperature: daily.temperature_2m_max[index],
            minTemperature: daily.temperature_2m_min[index],
            precipitation: daily.precipitation_sum[index],
            windSpeedMax: daily.wind_speed_10m_max[index],
        }));
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("Weather forecast timeout", { cause: error });
        }
        if (error.message.includes("fetch failed")) {
            throw new Error("Network error while fetching forecast", {
                cause: error,
            });
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}
