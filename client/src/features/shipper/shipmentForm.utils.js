import { createElement } from "react";

export const fieldClass =
  "grid content-start gap-2 text-sm font-medium text-slate-700";

export function fieldError(errors, name) {
  return errors[name]
    ? createElement(
        "small",
        { className: "text-sm text-red-700", role: "alert" },
        errors[name],
      )
    : null;
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}
