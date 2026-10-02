import { config } from "../config/index.js";

export function setRefreshCookie(res, token) {
    res.cookie(config.refreshCookie.name, token, {
        httpOnly: config.refreshCookie.httpOnly,
        secure: config.refreshCookie.secure,
        sameSite: config.refreshCookie.sameSite,
        path: config.refreshCookie.path,
        maxAge: config.jwt.refreshTtlSeconds * 1000,
    });
}

export function clearRefreshCookie(res) {
    res.clearCookie(config.refreshCookie.name, {
        httpOnly: config.refreshCookie.httpOnly,
        secure: config.refreshCookie.secure,
        sameSite: config.refreshCookie.sameSite,
        path: config.refreshCookie.path,
    });
}
