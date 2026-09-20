import { ValidationError } from "../errors/ValidationError.js";

export function validate(schemas = {}) {
    return (req, res, next) => {
        const details = [];

        for (const key of ["body", "params", "query"]) {
            const schema = schemas[key];
            if (!schema) continue;

            const result = schema.safeParse(req[key]);
            if (!result.success) {
                for (const issue of result.error.issues) {
                    details.push({
                        field: issue.path.join(".") || key,
                        message: issue.message,
                    });
                }
            } else if (key === "body") {
                req.body = result.data;
            } else {
                Object.defineProperty(req, key, {
                    value: result.data,
                    writable: true,
                    configurable: true,
                    enumerable: true,
                });
            }
        }

        if (details.length > 0) {
            return next(new ValidationError("Invalid request data", details));
        }

        return next();
    };
}
