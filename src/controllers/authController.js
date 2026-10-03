import { authService } from "../services/authService.js";
import {
    setRefreshCookie,
    clearRefreshCookie,
} from "../utils/refreshCookie.js";
import { config } from "../config/index.js";

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
    async refresh(req, res, next) {
        try {
            const token = req?.cookies?.[config.refreshCookie.name];
            const { accessToken, refreshToken, user } =
                await authService.refresh(token);

            setRefreshCookie(res, refreshToken);
            res.status(200).json({ data: { accessToken, user } });
        } catch (error) {
            next(error);
        }
    },
    async logout(req, res, next) {
        try {
            clearRefreshCookie(res);
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    },
    async me(req, res, next) {
        try {
            res.status(200).json({ data: req.user });
        } catch (error) {
            next(error);
        }
    },
};
