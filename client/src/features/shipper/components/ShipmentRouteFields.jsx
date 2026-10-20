import { Input } from "../../../shared/components/index.js";
import { ShipmentCityPicker } from "./ShipmentCityPicker.jsx";
import { fieldClass, fieldError, todayDate } from "../shipmentForm.utils.js";

export function ShipmentRouteFields({ values, errors, setField, setErrors }) {
  function updatePickupDate(value) {
    setField("pickupDate", value);
    setErrors((current) => ({
      ...current,
      pickupDate:
        value && value < todayDate()
          ? "Choose today or a future date."
          : undefined,
    }));
  }

  function updatePickupLocation(value) {
    setField("pickupLocation", value);
    if (value === values.deliveryLocation) setField("deliveryLocation", "");
  }

  return (
    <div className="grid grid-cols-2 items-start gap-4 max-md:grid-cols-1">
      <label className={fieldClass}>
        <span>
          Pickup location <i className="ml-1 not-italic text-red-600">*</i>
        </span>
        <ShipmentCityPicker
          id="pickup-city"
          label="Pickup"
          value={values.pickupLocation}
          onChange={updatePickupLocation}
          error={errors.pickupLocation}
        />
        {fieldError(errors, "pickupLocation")}
      </label>
      <label className={fieldClass}>
        <span>
          Delivery location <i className="ml-1 not-italic text-red-600">*</i>
        </span>
        <ShipmentCityPicker
          id="delivery-city"
          label="Delivery"
          value={values.deliveryLocation}
          excludeCity={values.pickupLocation}
          disabled={!values.pickupLocation}
          onChange={(city) => setField("deliveryLocation", city)}
          error={errors.deliveryLocation}
        />
        {fieldError(errors, "deliveryLocation")}
      </label>
      <label className={fieldClass}>
        <span>
          Pickup date <i className="ml-1 not-italic text-red-600">*</i>
        </span>
        <Input
          required
          type="date"
          min={todayDate()}
          value={values.pickupDate}
          onChange={(event) => updatePickupDate(event.target.value)}
          aria-invalid={Boolean(errors.pickupDate)}
        />
        {fieldError(errors, "pickupDate")}
      </label>
    </div>
  );
}
