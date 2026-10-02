import { authService } from "../services/authService.js";

export const authController = {
    async register(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await authService.register({ email, password });
            res.status(201).json({ data: user });
        } catch (error) {
            next(error);
        }
    },
};
