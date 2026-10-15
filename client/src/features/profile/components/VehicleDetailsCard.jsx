import {
  Alert,
  Button,
  Card,
  Input,
  Spinner,
} from "../../../shared/components/index.js";
import { ProfileField } from "./ProfileField.jsx";

export function VehicleDetailsCard({
  vehicle,
  errors,
  hasVehicle,
  isLoading,
  loadError,
  busy,
  onChange,
  onSave,
}) {
  return (
    <Card className="grid gap-4 p-5 md:col-start-2 md:col-span-2">
      <div>
        <h2 className="m-0 text-base font-bold text-slate-900">
          Vehicle Details
        </h2>
        <p className="mb-0 mt-2 text-sm text-slate-500">
          {hasVehicle
            ? "Keep your vehicle information up to date."
            : "Add your vehicle to start finding loads."}
        </p>
      </div>
      {isLoading ? (
        <div className="grid min-h-24 place-items-center">
          <Spinner label="Loading vehicle details" />
        </div>
      ) : (
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={onSave}
          noValidate
        >
          {loadError && (
            <div className="sm:col-span-2">
              <Alert tone="danger">{loadError}</Alert>
            </div>
          )}
          <ProfileField
            id="vehicle-type"
            label="Vehicle Type"
            error={errors.type}
          >
            <select
              id="vehicle-type"
              name="type"
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={vehicle.type}
              onChange={onChange}
              aria-invalid={Boolean(errors.type)}
              aria-describedby={errors.type ? "vehicle-type-error" : undefined}
            >
              <option value="" disabled>Select vehicle type</option>
              <option value="Isuzu">Isuzu</option>
              <option value="FSR">FSR</option>
              <option value="Sinotruk">Sinotruk</option>
              <option value="Other">Other</option>
            </select>
          </ProfileField>
          <ProfileField
            id="vehicle-capacity"
            label="Maximum Load (Tons)"
            error={errors.capacityTons}
          >
            <Input
              id="vehicle-capacity"
              name="capacityTons"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="e.g. 10"
              value={vehicle.capacityTons}
              onChange={onChange}
              aria-invalid={Boolean(errors.capacityTons)}
              aria-describedby={
                errors.capacityTons ? "vehicle-capacity-error" : undefined
              }
            />
          </ProfileField>
          <ProfileField
            id="vehicle-volume"
            label="Volume (m³)"
            error={errors.volumeM3}
            helperText="Cargo capacity in cubic meters"
          >
            <Input
              id="vehicle-volume"
              name="volumeM3"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="e.g. 35"
              value={vehicle.volumeM3}
              onChange={onChange}
              aria-invalid={Boolean(errors.volumeM3)}
              aria-describedby={
                errors.volumeM3 ? "vehicle-volume-error" : undefined
              }
            />
          </ProfileField>
          <ProfileField
            id="vehicle-plate"
            label="Plate Number"
            error={errors.plateNumber}
          >
            <Input
              id="vehicle-plate"
              name="plateNumber"
              placeholder="ET-23456"
              value={vehicle.plateNumber}
              onChange={onChange}
              aria-invalid={Boolean(errors.plateNumber)}
              aria-describedby={
                errors.plateNumber ? "vehicle-plate-error" : undefined
              }
            />
          </ProfileField>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save Vehicle"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
