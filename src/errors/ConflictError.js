import { BaseError } from "./BaseError.js";

export class ConflictError extends BaseError {
    constructor(message = "Conflict") {
        super(message, { statusCode: 409, code: "CONFLICT" });
        this.name = "ConflictError";
    }
}