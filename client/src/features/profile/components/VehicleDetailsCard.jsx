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
            label="Truck Type"
            error={errors.type}
          >
            <Input
              id="vehicle-type"
              name="type"
              placeholder="Flatbed Truck"
              value={vehicle.type}
              onChange={onChange}
              aria-invalid={Boolean(errors.type)}
              aria-describedby={errors.type ? "vehicle-type-error" : undefined}
            />
          </ProfileField>
          <ProfileField
            id="vehicle-capacity"
            label="Capacity (Tons)"
            error={errors.capacityTons}
          >
            <Input
              id="vehicle-capacity"
              name="capacityTons"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="10"
              value={vehicle.capacityTons}
              onChange={onChange}
              aria-invalid={Boolean(errors.capacityTons)}
              aria-describedby={
                errors.capacityTons ? "vehicle-capacity-error" : undefined
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
