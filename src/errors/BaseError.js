export class BaseError extends Error {
    constructor(message, { statusCode, code, details } = {}) {
        super(message);
        this.name = "BaseError";
        this.statusCode = statusCode ?? 500;
        this.code = code ?? "INTERNAL_ERROR";
        this.details = details ?? [];
    }
}
