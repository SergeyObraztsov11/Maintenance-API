import { BaseError } from "./BaseError.js";

export class TooManyRequestsError extends BaseError {
    constructor(message = "Too many requests") {
        super(message, {
            statusCode: 429,
            code: "RATE_LIMIT_EXCEEDED",
        });
        this.name = "TooManyRequestsError";
    }
}
