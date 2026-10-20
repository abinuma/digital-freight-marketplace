import { Input, Select, Textarea } from "../../../shared/components/index.js";
import { fieldClass, fieldError } from "../shipmentForm.utils.js";
import { LOAD_CATEGORY_KEYS } from "../../../shared/constants/loadCategories.js";
import { LOAD_SIZE_OPTIONS } from "../../../shared/constants/loadSizes.js";

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
          aria-invalid={Boolean(errors.goodsDescription)}
          placeholder="Describe your cargo, packaging, and anything transporters should know"
        />
        {fieldError(errors, "goodsDescription")}
        <small className="font-normal text-slate-500">10–1,000 characters</small>
      </label>
      <label className={fieldClass}>
        <span>
          Goods category <i className="ml-1 not-italic text-red-600">*</i>
        </span>
        <Select
          required
          value={values.goodsType}
          onChange={(event) => setField("goodsType", event.target.value)}
          aria-invalid={Boolean(errors.goodsType)}
        >
          <option value="">Select goods category</option>
          {LOAD_CATEGORY_KEYS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          {values.goodsType && !LOAD_CATEGORY_KEYS.includes(values.goodsType) && (
            <option value={values.goodsType}>{values.goodsType}</option>
          )}
        </Select>
        {fieldError(errors, "goodsType")}
      </label>
      <label className={fieldClass}>
        <span>
          Load Size <i className="ml-1 not-italic text-red-600">*</i>
        </span>
        <Select
          required
          value={values.loadSize || "FULL_LOAD"}
          onChange={(event) => {
            const newSize = event.target.value;
            setField("loadSize", newSize);
          }}
          aria-invalid={Boolean(errors.loadSize)}
        >
          <option value="">Select load size</option>
          {LOAD_SIZE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        {fieldError(errors, "loadSize")}
      </label>

      {values.loadSize === "SMALL_LOAD" && (
        <label className={fieldClass}>
          <span>
            Mass (kg) <i className="ml-1 not-italic text-red-600">*</i>
          </span>
          <Input
            type="number"
            min="0.1"
            step="any"
            required
            value={values.weightKg ?? ""}
            onChange={(event) => setField("weightKg", event.target.value)}
            aria-invalid={Boolean(errors.weightKg)}
            placeholder="e.g. 50"
          />
          {fieldError(errors, "weightKg")}
          <small className="font-normal text-slate-500">Specify cargo mass in kilograms</small>
        </label>
      )}
    </div>
  );
}
