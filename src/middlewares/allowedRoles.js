import { ForbiddenError } from "../errors/ForbiddenError.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export function allowedRoles(roles = []) {
    if (!Array.isArray(roles) || roles.length === 0) {
        throw new Error("Empty list of available roles for access");
    }
    return (req, res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError("Access token required"));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ForbiddenError("Insufficient permissions"));
        }
        return next();
    };
}
