import { BaseError } from "./BaseError.js";

export class NotFoundError extends BaseError {
    constructor(message = "Not found") {
        super(message, { statusCode: 404, code: "NOT_FOUND" });
        this.name = "NotFoundError";
    }
}
