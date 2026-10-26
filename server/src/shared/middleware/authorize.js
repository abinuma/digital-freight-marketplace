import { AppError } from "../utils/AppError.js";

export function authorize(roles) {
  const allowedRoles = new Set(Array.isArray(roles) ? roles : [roles]);

  if (
    allowedRoles.size === 0 ||
    [...allowedRoles].some((role) => typeof role !== "string")
  ) {
    throw new TypeError("authorize requires one or more role names");
  }

  return (req, res, next) => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (!allowedRoles.has(req.user.role))
      return next(
        new AppError("You are not authorized to access this resource", 403),
      );

    return next();
  };
}

export default authorize;
