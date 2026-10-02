import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export function signRefreshToken(user) {
    return jwt.sign(
        { sub: user.id, type: "refresh" },
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
