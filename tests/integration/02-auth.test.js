import request from "supertest";
import app from "../../src/app.js";
import { connectTestDb, resetDb } from "../helpers/db.js";
import { createUser } from "../helpers/factories.js";

describe("auth API", () => {
    beforeAll(async () => {
        await connectTestDb();
    });

    beforeEach(async () => {
        await resetDb();
    });

    it("registers viewer and returns user without password", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "new@example.com",
            password: "password123",
        });

        expect(res.status).toBe(201);
        expect(res.body.data.email).toBe("new@example.com");
        expect(res.body.data.role).toBe("viewer");
        expect(res.body.data.passwordHash).toBeUndefined();
    });

    it("logs in and returns access token", async () => {
        const { email, password } = await createUser({
            email: "admin@example.com",
            role: "admin",
        });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email, password });

        expect(res.status).toBe(200);
        expect(res.body.data.accessToken).toEqual(expect.any(String));
        expect(res.body.data.user.email).toBe(email);
        expect(res.headers["set-cookie"]).toEqual(
            expect.arrayContaining([expect.stringContaining("refreshToken=")]),
        );
    });

    it("returns same 401 for unknown user and bad password", async () => {
        await createUser({
            email: "known@example.com",
            password: "password123",
        });

        const unknown = await request(app)
            .post("/api/auth/login")
            .send({ email: "missing@example.com", password: "password123" });
        const badPassword = await request(app)
            .post("/api/auth/login")
            .send({ email: "known@example.com", password: "wrong-password" });

        expect(unknown.status).toBe(401);
        expect(badPassword.status).toBe(401);
        expect(unknown.body.error.message).toBe("Invalid email or password");
        expect(badPassword.body.error.message).toBe(
            "Invalid email or password",
        );
    });

    it("GET /api/auth/me requires token", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("GET /api/auth/me returns current user", async () => {
        const { email, password } = await createUser({ role: "viewer" });
        const login = await request(app)
            .post("/api/auth/login")
            .send({ email, password });

        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${login.body.data.accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe(email);
        expect(res.body.data.role).toBe("viewer");
    });

    it("refreshes access token from cookie and logs out", async () => {
        const { email, password } = await createUser({ role: "viewer" });
        const login = await request(app)
            .post("/api/auth/login")
            .send({ email, password });

        const cookies = login.headers["set-cookie"];
        expect(cookies).toBeDefined();

        const refreshed = await request(app)
            .post("/api/auth/refresh")
            .set("Cookie", cookies);

        expect(refreshed.status).toBe(200);
        expect(refreshed.body.data.accessToken).toEqual(expect.any(String));

        const logout = await request(app)
            .post("/api/auth/logout")
            .set("Cookie", cookies);

        expect(logout.status).toBe(200);

        const refreshWithoutCookie =
            await request(app).post("/api/auth/refresh");
        expect(refreshWithoutCookie.status).toBe(401);
    });
});
