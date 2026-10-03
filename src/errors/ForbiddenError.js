import { BaseError } from "./BaseError.js";

export class ForbiddenError extends BaseError {
    constructor(message = "Forbidden") {
        super(message, {
            statusCode: 403,
            code: "FORBIDDEN",
        });
        this.name = "ForbiddenError";
    }
}
