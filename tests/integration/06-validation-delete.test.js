import request from "supertest";
import app from "../../src/app.js";
import { connectTestDb, resetDb } from "../helpers/db.js";
import {
    createEquipment,
    createRequest,
    createUser,
} from "../helpers/factories.js";

async function loginAdmin() {
    const { email, password } = await createUser({ role: "admin" });
    const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password });
    return res.body.data.accessToken;
}

describe("validation and deletes", () => {
    beforeAll(async () => {
        await connectTestDb();
    });

    beforeEach(async () => {
        await resetDb();
    });

    it("returns 422 for invalid register body", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "not-an-email",
            password: "1",
        });

        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 422 for invalid equipment payload", async () => {
        const token = await loginAdmin();

        const res = await request(app)
            .post("/api/equipment")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "x",
                type: "turbine",
            });

        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deletes equipment without related requests", async () => {
        const token = await loginAdmin();
        const item = await createEquipment({ serialNumber: "SN-DEL-OK" });

        const res = await request(app)
            .delete(`/api/equipment/${item.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(204);
    });

    it("returns 409 when deleting equipment with requests", async () => {
        const token = await loginAdmin();
        const item = await createEquipment({ serialNumber: "SN-DEL-BLOCK" });
        await createRequest({ equipmentId: item.id });

        const res = await request(app)
            .delete(`/api/equipment/${item.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe("CONFLICT");
    });

    it("deletes a request", async () => {
        const token = await loginAdmin();
        const item = await createRequest();

        const res = await request(app)
            .delete(`/api/requests/${item.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(204);

        const missing = await request(app)
            .get(`/api/requests/${item.id}`)
            .set("Authorization", `Bearer ${token}`);
        expect(missing.status).toBe(404);
    });
});
