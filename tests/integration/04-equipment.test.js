import request from "supertest";
import app from "../../src/app.js";
import { connectTestDb, resetDb } from "../helpers/db.js";
import { createEquipment, createUser } from "../helpers/factories.js";

describe("equipment CRUD", () => {
    let adminToken;

    beforeAll(async () => {
        await connectTestDb();
    });

    beforeEach(async () => {
        await resetDb();
        const { email, password } = await createUser({ role: "admin" });
        const login = await request(app)
            .post("/api/auth/login")
            .send({ email, password });
        adminToken = login.body.data.accessToken;
    });

    it("creates, reads and lists equipment", async () => {
        const created = await request(app)
            .post("/api/equipment")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                name: "CRUD Turbine",
                type: "turbine",
                serialNumber: "SN-CRUD-1",
                location: { lat: 55.75, lon: 37.61 },
                status: "operational",
                installedAt: "2024-01-15",
            });

        expect(created.status).toBe(201);

        const byId = await request(app)
            .get(`/api/equipment/${created.body.data.id}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(byId.status).toBe(200);
        expect(byId.body.data.serialNumber).toBe("SN-CRUD-1");

        const list = await request(app)
            .get("/api/equipment")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(list.status).toBe(200);
        expect(list.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 401 without token", async () => {
        const res = await request(app).get("/api/equipment");
        expect(res.status).toBe(401);
    });

    it("returns 404 for missing equipment", async () => {
        const res = await request(app)
            .get("/api/equipment/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("patches existing equipment", async () => {
        const item = await createEquipment({ serialNumber: "SN-PATCH-1" });

        const res = await request(app)
            .patch(`/api/equipment/${item.id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Patched Name" });

        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe("Patched Name");
    });
});
