import { Input, Textarea } from "../../../shared/components/index.js";
import { fieldClass, fieldError } from "../shipmentForm.utils.js";

export function ShipmentCargoFields({ values, errors, setField }) {
  return (
    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
      <label className={`${fieldClass} col-span-2 max-md:col-span-1`}>
        <span>
          Goods description <i className="ml-1 not-italic text-red-600">*</i>
        </span>
        <Textarea
          required
          maxLength={1000}
          value={values.goodsDescription}
          onChange={(event) => setField("goodsDescription", event.target.value)}
          placeholder="Describe your cargo, packaging, and anything transporters should know"
        />
        {fieldError(errors, "goodsDescription")}
        <small className="font-normal text-slate-500">10–1,000 characters</small>
      </label>
      <label className={fieldClass}>
        <span>
          Goods category <i className="ml-1 not-italic text-red-600">*</i>
        </span>
        <Input
          required
          maxLength={50}
          value={values.goodsType}
          onChange={(event) => setField("goodsType", event.target.value)}
          placeholder="e.g. agricultural, industrial, household"
        />
        {fieldError(errors, "goodsType")}
      </label>
      <label className={fieldClass}>
        <span>
          Weight (kg) <i className="ml-1 not-italic text-red-600">*</i>
        </span>
        <Input
          required
          type="number"
          min="0.01"
          step="0.01"
          value={values.weightKg}
          onChange={(event) => setField("weightKg", event.target.value)}
          placeholder="e.g. 1200"
        />
        {fieldError(errors, "weightKg")}
      </label>
    </div>
  );
}
