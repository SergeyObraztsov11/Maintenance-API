import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export function signRefreshToken(userId) {
    return jwt.sign(
        { sub: userId, type: "refresh" },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshTtlSeconds },
    );
}

export function verifyRefreshToken(token) {
    const payload = jwt.verify(token, config.jwt.refreshSecret);
    if (payload.type !== "refresh") {
        throw new Error("Invalid refresh token");
    }
    return payload;
}
