import { User } from "../models/index.js";

export const userRepository = {
    async create({
        email,
        passwordHash,
        role = "viewer",
        technicianId = null,
    }) {
        return await User.create({
            email,
            passwordHash,
            role,
            technicianId,
        });
    },

    async findByEmail(email) {
        return await User.findOne({ where: { email } });
    },

    async findById(id) {
        return await User.findByPk(id);
    }
};
