import request from "supertest";
import app from "../../src/app.js";
import { connectTestDb, resetDb } from "../helpers/db.js";
import {
    assignTechnician,
    createEquipment,
    createRequest,
    createTechnician,
    createUser,
} from "../helpers/factories.js";

async function loginAs(role, technicianId = null) {
    const { email, password } = await createUser({ role, technicianId });
    const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password });
    return res.body.data.accessToken;
}

describe("role permissions", () => {
    beforeAll(async () => {
        await connectTestDb();
    });

    beforeEach(async () => {
        await resetDb();
    });

    it("allows viewer to list requests", async () => {
        const token = await loginAs("viewer");
        await createRequest();

        const res = await request(app)
            .get("/api/requests")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("forbids viewer from changing status", async () => {
        const token = await loginAs("viewer");
        const item = await createRequest();

        const res = await request(app)
            .patch(`/api/requests/${item.id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "rejected" });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toBe("Insufficient permissions");
    });

    it("forbids technician on unassigned request", async () => {
        const tech = await createTechnician();
        const token = await loginAs("technician", tech.id);
        const item = await createRequest();

        const res = await request(app)
            .patch(`/api/requests/${item.id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "rejected" });

        expect(res.status).toBe(403);
        expect(res.body.error.message).toBe(
            "No access to change the status of this request.",
        );
    });

    it("allows assigned technician to reject request", async () => {
        const tech = await createTechnician();
        const token = await loginAs("technician", tech.id);
        const item = await createRequest({ status: "new" });
        await assignTechnician(item.id, tech.id, "lead");

        const res = await request(app)
            .patch(`/api/requests/${item.id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "rejected" });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe("rejected");
    });

    it("allows admin to create equipment", async () => {
        const token = await loginAs("admin");

        const res = await request(app)
            .post("/api/equipment")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Admin Pump",
                type: "sensor",
                serialNumber: "SN-ADMIN-1",
                location: { lat: 55.75, lon: 37.61 },
                status: "operational",
                installedAt: "2024-06-01",
            });

        expect(res.status).toBe(201);
        expect(res.body.data.serialNumber).toBe("SN-ADMIN-1");
    });

    it("forbids technician from creating equipment", async () => {
        const tech = await createTechnician();
        const token = await loginAs("technician", tech.id);

        const res = await request(app)
            .post("/api/equipment")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Tech Pump",
                type: "sensor",
                serialNumber: "SN-TECH-1",
                location: { lat: 55.75, lon: 37.61 },
                status: "operational",
                installedAt: "2024-06-01",
            });

        expect(res.status).toBe(403);
    });

    it("returns 409 for invalid status transition", async () => {
        const token = await loginAs("admin");
        const item = await createRequest({ status: "done" });

        const res = await request(app)
            .patch(`/api/requests/${item.id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "new" });

        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe("CONFLICT");
    });

    it("returns 409 for duplicate equipment serial", async () => {
        const token = await loginAs("admin");
        await createEquipment({ serialNumber: "SN-DUP-1" });

        const res = await request(app)
            .post("/api/equipment")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Dup Pump",
                type: "sensor",
                serialNumber: "SN-DUP-1",
                location: { lat: 55.75, lon: 37.61 },
                status: "operational",
                installedAt: "2024-06-01",
            });

        expect(res.status).toBe(409);
        expect(res.body.error.message).toContain("already exists");
    });
});
