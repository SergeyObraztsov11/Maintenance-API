import { userRepository } from "../repositories/userRepository.js";
import {
    bcryptHashPassword,
    bcryptCheckPassword,
} from "../utils/bcryptPassword.js";
import { ConflictError } from "../errors/ConflictError.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { signAccessToken } from "../utils/accessToken.js";
import { signRefreshToken, verifyRefreshToken } from "../utils/refreshToken.js";

export const authService = {
    async register({ email, password }) {
        const isEmailRegistered = await userRepository.findByEmail(email);
        if (isEmailRegistered) {
            throw new ConflictError("Email already registered");
        }
        const passwordHash = await bcryptHashPassword(password);
        const user = await userRepository.create({ email, passwordHash });
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            technicianId: user.technicianId,
        };
    },
    async login({ email, password }) {
        const user = await userRepository.findByEmailWithPassword(email);

        if (!user) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const isPasswordValid = await bcryptCheckPassword(
            password,
            user.passwordHash,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedError("Invalid email or password");
        }

        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                technicianId: user.technicianId,
            },
        };
    },
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new UnauthorizedError("Refresh token is required");
        }

        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            throw new UnauthorizedError("Invalid or expired refresh token");
        }

        const user = await userRepository.findById(payload.sub);

        if (!user) {
            throw new UnauthorizedError("Invalid or expired refresh token");
        }

        const newAccessToken = signAccessToken(user.id);
        const newRefreshToken = signRefreshToken(user.id);

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                technicianId: user.technicianId,
            },
        };
    },
};
