import { userRepository } from "../repositories/userRepository.js";
import { bcryptHashPassword } from "../utils/bcryptPassword.js";
import { ConflictError } from "../errors/ConflictError.js";

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
};
