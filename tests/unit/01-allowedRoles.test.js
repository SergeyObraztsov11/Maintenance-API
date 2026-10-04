import { allowedRoles } from "../../src/middlewares/allowedRoles.js";
import { ForbiddenError } from "../../src/errors/ForbiddenError.js";
import { UnauthorizedError } from "../../src/errors/UnauthorizedError.js";

function runMiddleware(middleware, user) {
    return new Promise((resolve) => {
        const req = { user };
        middleware(req, {}, (error) => resolve(error));
    });
}

describe("allowedRoles", () => {
    const guard = allowedRoles(["admin", "technician"]);

    it("allows matching role", async () => {
        const error = await runMiddleware(guard, { role: "admin" });
        expect(error).toBeUndefined();
    });

    it("rejects missing user with 401", async () => {
        const error = await runMiddleware(guard, undefined);
        expect(error).toBeInstanceOf(UnauthorizedError);
        expect(error.message).toBe("Access token required");
    });

    it("rejects viewer with 403", async () => {
        const error = await runMiddleware(guard, { role: "viewer" });
        expect(error).toBeInstanceOf(ForbiddenError);
        expect(error.message).toBe("Insufficient permissions");
    });
});
