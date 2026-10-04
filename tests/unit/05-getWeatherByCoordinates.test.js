import { jest } from "@jest/globals";

const fetchMock = jest.fn();
jest.unstable_mockModule("../../src/config/index.js", () => ({
    config: {
        forecastBaseUrl: "https://api.open-meteo.com",
        timeoutMs: 50,
    },
}));

const { getWeatherByCoordinates } = await import(
    "../../src/weather/getWeatherByCoordinates.js"
);

describe("getWeatherByCoordinates", () => {
    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock;
    });

    afterEach(() => {
        delete global.fetch;
    });

    it("maps daily forecast fields", async () => {
        fetchMock.mockResolvedValue({
            status: 200,
            json: async () => ({
                daily: {
                    time: ["2026-10-05"],
                    temperature_2m_max: [14.2],
                    temperature_2m_min: [7.1],
                    precipitation_sum: [0],
                    wind_speed_10m_max: [5.4],
                },
            }),
        });

        const days = await getWeatherByCoordinates(55.75, 37.61, 1);

        expect(days).toEqual([
            {
                date: "2026-10-05",
                maxTemperature: 14.2,
                minTemperature: 7.1,
                precipitation: 0,
                windSpeedMax: 5.4,
            },
        ]);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining("/v1/forecast"),
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
    });

    it("throws on 4xx from provider", async () => {
        fetchMock.mockResolvedValue({ status: 400, json: async () => ({}) });

        await expect(getWeatherByCoordinates(55.75, 37.61, 1)).rejects.toThrow(
            "Forecast client error (400)",
        );
    });

    it("throws when daily payload is missing", async () => {
        fetchMock.mockResolvedValue({
            status: 200,
            json: async () => ({}),
        });

        await expect(getWeatherByCoordinates(55.75, 37.61, 1)).rejects.toThrow(
            "Forecast data is missing",
        );
    });

    it("throws timeout when request is aborted", async () => {
        fetchMock.mockImplementation((_url, { signal }) => {
            return new Promise((_, reject) => {
                signal.addEventListener("abort", () => {
                    const error = new Error("aborted");
                    error.name = "AbortError";
                    reject(error);
                });
            });
        });

        await expect(getWeatherByCoordinates(55.75, 37.61, 1)).rejects.toThrow(
            "Weather forecast timeout",
        );
    });
});
