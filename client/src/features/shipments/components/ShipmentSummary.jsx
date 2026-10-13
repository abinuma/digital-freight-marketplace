import { Badge, Card } from "../../../shared/components/index.js";
import { dateLabel, shipmentTones } from "../shipmentFormatters.js";

export function ShipmentHeading({ shipment, eyebrow = "SHIPMENT DETAILS" }) {
  return (
    <div className="grid justify-items-start gap-2">
      <p className="m-0 text-xs font-bold tracking-widest text-blue-700">
        {eyebrow}
      </p>
      <h1 className="m-0 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {shipment.goodsDescription}
      </h1>
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Badge tone={shipmentTones[shipment.status]}>
          {shipment.status.replace("_", " ")}
        </Badge>
        <span>{shipment.goodsType}</span>
        <span aria-hidden="true">·</span>
        <span>{shipment.weightKg} kg</span>
      </div>
    </div>
  );
}

export function ShipmentInformation({
  shipment,
  pickupLabel = "Preferred pickup",
  categoryLabel = "Category",
  weightLabel = "Estimated weight",
  postedLabel = "Listing posted",
  description = "Pickup schedule and shipment information.",
  photoDescription = "Photos provided with this listing.",
  canEditPhotos = false,
  onRemoveImage,
}) {
  return (
    <>
      <Card className="grid gap-5 p-5">
        <div>
          <h2 className="m-0 text-base font-semibold text-slate-900">
            Route and cargo
          </h2>
          <p className="mb-0 mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <Location label="PICKUP" tone="blue" location={shipment.pickupLocation} lat={shipment.pickupLat} lng={shipment.pickupLng} />
          <Location label="DELIVERY" tone="amber" location={shipment.deliveryLocation} lat={shipment.deliveryLat} lng={shipment.deliveryLng} />
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 max-sm:grid-cols-1">
          <Detail label={pickupLabel} value={dateLabel(shipment.pickupDate)} />
          <Detail label={categoryLabel} value={shipment.goodsType} />
          <Detail label={weightLabel} value={`${shipment.weightKg} kg`} />
          <Detail label={postedLabel} value={dateLabel(shipment.createdAt)} />
        </div>

        {shipment.specialRequirements && (
          <div className="grid gap-1 border-t border-slate-100 pt-4">
            <h3 className="m-0 text-sm font-semibold text-slate-800">
              Special requirements
            </h3>
            <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {shipment.specialRequirements}
            </p>
          </div>
        )}
      </Card>

      {shipment.images?.length > 0 && (
        <Card className="grid gap-4 p-5">
          <div>
            <h2 className="m-0 text-base font-semibold text-slate-900">
              Cargo photos
            </h2>
            <p className="mb-0 mt-1 text-sm text-slate-500">
              {canEditPhotos
                ? `${shipment.images.length} photo${shipment.images.length === 1 ? "" : "s"}`
                : photoDescription}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-2">
            {shipment.images.map((image) => (
              <figure
                className="relative m-0 overflow-hidden rounded-lg"
                key={image.id}
              >
                <img
                  className="h-36 w-full object-cover"
                  src={image.url}
                  alt="Shipment cargo"
                />
                {canEditPhotos && (
                  <button
                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-lg text-slate-700 shadow transition-colors hover:bg-red-50 hover:text-red-700"
                    type="button"
                    onClick={() => onRemoveImage(image)}
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                )}
              </figure>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function Location({ label, tone, location, lat, lng }) {
  const labelColor = tone === "blue" ? "text-blue-700" : "text-amber-700";
  return (
    <div className="grid content-start gap-2 rounded-lg bg-slate-50 p-4">
      <span className={`text-xs font-bold tracking-wide ${labelColor}`}>
        {label}
      </span>
      <strong className="text-sm text-slate-800">{location}</strong>
      {lat != null && (
        <span className="text-xs text-slate-500">
          {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
        </span>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      <strong className="text-sm text-slate-800">{value}</strong>
    </div>
  );
}
