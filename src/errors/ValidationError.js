import { BaseError } from "./BaseError.js";
export class ValidationError extends BaseError {
  constructor(message = "Validation failed", details = []) {
    super(message, {
      statusCode: 422,
      code: "VALIDATION_ERROR",
      details,
    });
    this.name = "ValidationError";
  }
}