import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export function validate(schemas) {
  return (req, res, next) => {
    try {
      for (const key of ["body", "query", "params"]) {
        if (schemas[key]) {
          Object.defineProperty(req, key, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: schemas[key].parse(req[key]),
          });
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(
            "Validation failed",
            400,
            error.issues.map(({ path, message }) => ({ path, message })),
          ),
        );
      } else next(error);
    }
  };
}
