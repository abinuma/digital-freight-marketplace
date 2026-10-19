import { Input } from "../../../shared/components/index.js";
import { LocationPicker } from "./LocationPicker.jsx";
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

  return (
    <div className="grid grid-cols-2 items-start gap-4 max-md:grid-cols-1">
      <label className={fieldClass}>
        <span>
          Pickup location <i className="ml-1 not-italic text-red-600">*</i>
        </span>
        <Input
          required
          maxLength={255}
          value={values.pickupLocation}
          onChange={(event) => setField("pickupLocation", event.target.value)}
          aria-invalid={Boolean(errors.pickupLocation)}
          placeholder="City, area, or address"
        />
        {fieldError(errors, "pickupLocation")}
      </label>
      <label className={fieldClass}>
        <span>
          Delivery location <i className="ml-1 not-italic text-red-600">*</i>
        </span>
        <Input
          required
          maxLength={255}
          value={values.deliveryLocation}
          onChange={(event) => setField("deliveryLocation", event.target.value)}
          aria-invalid={Boolean(errors.deliveryLocation)}
          placeholder="City, area, or address"
        />
        {fieldError(errors, "deliveryLocation")}
      </label>
      <LocationPicker
        label="Pickup pin"
        value={{ lat: values.pickupLat, lng: values.pickupLng }}
        onChange={({ lat, lng }) => {
          setField("pickupLat", lat);
          setField("pickupLng", lng);
        }}
      />
      <LocationPicker
        label="Delivery pin"
        value={{ lat: values.deliveryLat, lng: values.deliveryLng }}
        onChange={({ lat, lng }) => {
          setField("deliveryLat", lat);
          setField("deliveryLng", lng);
        }}
      />
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
