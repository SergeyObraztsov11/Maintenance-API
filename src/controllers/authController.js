import { authService } from "../services/authService.js";
import { setRefreshCookie } from "../utils/refreshCookie.js";

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
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const { accessToken, refreshToken, user } = await authService.login(
                { email, password },
            );
            setRefreshCookie(res, refreshToken);
            res.status(200).json({ data: { accessToken, user } });
        } catch (error) {
            next(error);
        }
    },
};
