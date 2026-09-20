import { getWeatherByCoordinates } from "../weather/getWeatherByCoordinates.js";
import { equipmentRepository } from "../repositories/equipmentRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { BaseError } from "../errors/BaseError.js";
import { config } from "../config/index.js";

function isSuitableForOutdoorWork(day) {
    return (
        day.precipitation <= config.weatherPrecipitationMaxMm &&
        day.windSpeedMax <= config.weatherWindMaxMs
    );
}

export const weatherService = {
    async getForEquipment(equipmentId, days = 3) {
        const equipment = await equipmentRepository.findById(equipmentId);
        if (!equipment) {
            throw new NotFoundError(`Equipment ${equipmentId} not found`);
        }

        try {
            const forecast = await getWeatherByCoordinates(
                equipment.location.lat,
                equipment.location.lon,
                days,
            );

            const daysWithSuitability = forecast.map((day) => ({
                ...day,
                suitableForOutdoorWork: isSuitableForOutdoorWork(day),
            }));

            return {
                equipmentId: equipment.id,
                location: equipment.location,
                rules: {
                    precipitationMaxMm: config.weatherPrecipitationMaxMm,
                    windMaxMs: config.weatherWindMaxMs,
                },
                forecast: daysWithSuitability,
            };
        } catch (error) {
            throw new BaseError(error.message, {
                statusCode: 502,
                code: "WEATHER_PROVIDER_ERROR",
            });
        }
    },
};
