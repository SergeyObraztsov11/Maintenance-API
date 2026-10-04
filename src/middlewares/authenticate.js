import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { verifyAccessToken } from "../utils/accessToken.js";
import { userRepository } from "../repositories/userRepository.js";

export async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            throw new UnauthorizedError("Token is required");
        }

        const token = header.slice("Bearer ".length).trim();

        if (!token) {
            throw new UnauthorizedError("Token is required");
        }

        let payload;
        try {
            payload = verifyAccessToken(token);
        } catch {
            throw new UnauthorizedError("Invalid token");
        }

        const user = await userRepository.findById(payload.sub);
        if (!user) {
            throw new UnauthorizedError("User not found");
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            technicianId: user.technicianId,
        };

        next();
    } catch (error) {
        next(error);
    }
}
