import { Card } from "../../../shared/components/index.js";

export function ShipmentFormSection({ step, title, description, children }) {
  return (
    <Card className="grid gap-4 p-5 max-sm:p-4">
      <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
          {step}
        </span>
        <div>
          <h2 className="m-0 text-base font-semibold text-slate-900">
            {title}
          </h2>
          <p className="mb-0 mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}
