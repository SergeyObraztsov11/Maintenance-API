import request from "supertest";
import app from "../../src/app.js";
import { connectTestDb } from "../helpers/db.js";

describe("health endpoints", () => {
    beforeAll(async () => {
        await connectTestDb();
    });

    it("GET /api/health/live returns ok and uptime", async () => {
        const res = await request(app).get("/api/health/live");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
        expect(typeof res.body.uptime).toBe("number");
    });

    it("GET /api/health/ready returns ok when DB is up", async () => {
        const res = await request(app).get("/api/health/ready");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });
});
