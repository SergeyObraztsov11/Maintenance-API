import request from "supertest";
import app from "../../src/app.js";
import { connectTestDb, resetDb } from "../helpers/db.js";
import {
    createEquipment,
    createRequest,
    createTechnician,
    createUser,
    assignTechnician,
} from "../helpers/factories.js";
import { Site } from "../../src/models/index.js";
import { randomUUID } from "node:crypto";

async function loginAdmin() {
    const { email, password } = await createUser({ role: "admin" });
    const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password });
    return res.body.data.accessToken;
}

describe("reports API", () => {
    beforeAll(async () => {
        await connectTestDb();
    });

    beforeEach(async () => {
        await resetDb();
    });

    it("returns site summary and 404 for missing site", async () => {
        const token = await loginAdmin();
        const equipment = await createEquipment();
        await createRequest({ equipmentId: equipment.id });

        const siteId = equipment.siteId;
        const ok = await request(app)
            .get(`/api/reports/sites/${siteId}/summary`)
            .set("Authorization", `Bearer ${token}`);

        expect(ok.status).toBe(200);
        expect(ok.body.data.site.id).toBe(siteId);
        expect(ok.body.data.equipmentTotal).toBeGreaterThanOrEqual(1);

        const missing = await request(app)
            .get(`/api/reports/sites/${randomUUID()}/summary`)
            .set("Authorization", `Bearer ${token}`);

        expect(missing.status).toBe(404);
    });

    it("returns equipment load and technicians workload", async () => {
        const token = await loginAdmin();
        const equipment = await createEquipment();
        const requestRow = await createRequest({ equipmentId: equipment.id });
        const tech = await createTechnician();
        await assignTechnician(requestRow.id, tech.id, "lead");

        const load = await request(app)
            .get("/api/reports/equipment-load")
            .set("Authorization", `Bearer ${token}`);
        expect(load.status).toBe(200);
        expect(Array.isArray(load.body.data)).toBe(true);

        const workload = await request(app)
            .get("/api/reports/technicians/workload")
            .set("Authorization", `Bearer ${token}`);
        expect(workload.status).toBe(200);
        expect(Array.isArray(workload.body.data)).toBe(true);
    });

    it("supports /api/sites/:id/summary alias", async () => {
        const token = await loginAdmin();
        const site = await Site.create({
            id: randomUUID(),
            name: "Alias Site",
            code: `ALIAS-${randomUUID().slice(0, 6)}`,
            region: "Test",
            lat: 55.7,
            lon: 37.6,
        });

        const res = await request(app)
            .get(`/api/sites/${site.id}/summary`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.site.id).toBe(site.id);
    });
});
