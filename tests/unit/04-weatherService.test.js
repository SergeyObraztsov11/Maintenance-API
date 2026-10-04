import { jest } from "@jest/globals";

const equipmentRepository = {
    findById: jest.fn(),
};

const getWeatherByCoordinates = jest.fn();

jest.unstable_mockModule(
    "../../src/repositories/equipmentRepository.js",
    () => ({
        equipmentRepository,
    }),
);

jest.unstable_mockModule(
    "../../src/weather/getWeatherByCoordinates.js",
    () => ({
        getWeatherByCoordinates,
    }),
);

const { weatherService } = await import("../../src/services/weatherService.js");
const { NotFoundError } = await import("../../src/errors/NotFoundError.js");
const { BaseError } = await import("../../src/errors/BaseError.js");

describe("weatherService.getForEquipment", () => {
    const equipmentId = "22222222-2222-2222-2222-222222222222";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns forecast with suitability flags", async () => {
        equipmentRepository.findById.mockResolvedValue({
            id: equipmentId,
            location: { lat: 55.75, lon: 37.61 },
        });
        getWeatherByCoordinates.mockResolvedValue([
            {
                date: "2026-10-05",
                maxTemperature: 14,
                minTemperature: 7,
                precipitation: 0,
                windSpeedMax: 5,
            },
        ]);

        const data = await weatherService.getForEquipment(equipmentId, 1);

        expect(data.equipmentId).toBe(equipmentId);
        expect(data.forecast[0].suitableForOutdoorWork).toBe(true);
        expect(getWeatherByCoordinates).toHaveBeenCalledWith(55.75, 37.61, 1);
    });

    it("throws NotFound when equipment missing", async () => {
        equipmentRepository.findById.mockResolvedValue(null);

        await expect(
            weatherService.getForEquipment(equipmentId, 3),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("maps provider failures to 502", async () => {
        equipmentRepository.findById.mockResolvedValue({
            id: equipmentId,
            location: { lat: 55.75, lon: 37.61 },
        });
        getWeatherByCoordinates.mockRejectedValue(
            new Error("Weather forecast timeout"),
        );

        try {
            await weatherService.getForEquipment(equipmentId, 3);
            throw new Error("expected failure");
        } catch (error) {
            expect(error).toBeInstanceOf(BaseError);
            expect(error.statusCode).toBe(502);
            expect(error.code).toBe("WEATHER_PROVIDER_ERROR");
            expect(error.message).toBe("Weather forecast timeout");
        }
    });
});
