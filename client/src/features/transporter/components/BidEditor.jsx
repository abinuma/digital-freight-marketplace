import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Alert,
  Button,
  Card,
  Input,
  Spinner,
  useSuccessToast,
} from "../../../shared/components/index.js";
import { getShipment, submitBid } from "../transporter.api.js";
import { listMyJourneyPlans } from "../journeyPlan.api.js";
import { getLoadFraction } from "../../../shared/constants/loadSizes.js";

const toLocalDateTime = (date) => {
  if (!date) return "";
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
};
const bidSchema = z.object({
  price: z.coerce
    .number()
    .positive("Enter an offer greater than zero")
    .max(999_999_999_999.99),
  pickupDate: z
    .string()
    .min(1, "Choose your available pickup date and time")
    .refine(
      (value) => new Date(value).getTime() > Date.now(),
      "Pickup time must be in the future",
    ),
});
const fieldClass =
  "grid content-start gap-1.5 text-sm font-medium text-slate-700";

export function BidEditor({ shipmentId, initialBid, shipment: propShipment }) {
  const cache = useQueryClient();
  const showSuccess = useSuccessToast();
  const [values, setValues] = useState({
    price: initialBid ? String(initialBid.price) : "",
    pickupDate: toLocalDateTime(initialBid?.pickupDate),
  });
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const pickupTimeSelection = useRef(null);

  const shipmentQuery = useQuery({
    queryKey: ["transporter", "bidEditorShipment", shipmentId],
    queryFn: () => getShipment(shipmentId),
    enabled: !propShipment && Boolean(shipmentId),
    initialData: propShipment,
  });
  const shipment = propShipment || shipmentQuery.data;

  const plansQuery = useQuery({
    queryKey: ["transporter", "myJourneyPlansForBid"],
    queryFn: () => listMyJourneyPlans({ limit: 50 }),
  });
  const allPlans = plansQuery.data?.journeyPlans || [];
  const isSmallLoad = shipment?.loadSize === "SMALL_LOAD";

  const matchingRoutePlans = allPlans.filter(
    (p) =>
      shipment?.pickupLocation &&
      shipment?.deliveryLocation &&
      shipment.pickupLocation.toLowerCase().includes(p.originCity.toLowerCase()) &&
      shipment.deliveryLocation.toLowerCase().includes(p.destinationCity.toLowerCase())
  );
  const allMatchingRoutePlansFull =
    matchingRoutePlans.length > 0 &&
    matchingRoutePlans.every((p) => {
      if (p.status === "FULL") return true;
      const maxWeight = Number(p.maxWeightKg || 10000);
      const allocatedWeight = Number(p.allocatedWeightKg || 0);
      const requiredWeight = isSmallLoad
        ? Number(shipment?.weightKg || 0)
        : maxWeight * getLoadFraction(shipment?.loadSize);
      const remainingWeight = Math.max(0, maxWeight - allocatedWeight);
      return remainingWeight < requiredWeight - 0.01;
    });

  const isCapacityBlocked = allMatchingRoutePlansFull;

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function updatePickupTime(event) {
    const input = event.currentTarget;
    const [date = "", time = ""] = input.value.split("T");
    update("pickupDate", input.value);

    if (!date || !time) return;

    const selection = pickupTimeSelection.current;
    if (!selection || selection.date !== date) {
      pickupTimeSelection.current = { date, time, timePartsChanged: 0 };
      return;
    }

    if (selection.time !== time) {
      selection.time = time;
      selection.timePartsChanged += 1;
      if (selection.timePartsChanged >= 3) {
        input.blur();
        pickupTimeSelection.current = null;
      }
    }
  }

  async function submit(event) {
    event.preventDefault();
    const parsed = bidSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    setRequestError("");
    setIsSaving(true);
    try {
      await submitBid({
        shipmentId,
        bidId: initialBid?.id,
        values: { ...parsed.data, price: Number(parsed.data.price) },
      });
      await cache.invalidateQueries({ queryKey: ["transporter"] });
      showSuccess(initialBid ? 'Offer updated' : 'Offer sent');
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="grid gap-4 p-5">
      <div>
        <h2 className="m-0 text-base font-semibold text-slate-900">
          {initialBid ? "Update your offer" : "Make an offer"}
        </h2>
      </div>
      {requestError && (
        <Alert tone="danger" title="Your bid could not be saved">
          {requestError}
        </Alert>
      )}
      <form className="grid gap-4" onSubmit={submit} noValidate>
        <label className={fieldClass}>
          <span>
            Your price (ETB) <i className="text-red-700">*</i>
          </span>
          <Input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={values.price}
            onChange={(event) => update("price", event.target.value)}
            aria-invalid={Boolean(errors.price)}
            placeholder="Enter your offer"
          />
          {errors.price && (
            <small className="text-sm text-red-700">{errors.price}</small>
          )}
        </label>
        <label className={fieldClass}>
          <span>
            Available pickup time <i className="text-red-700">*</i>
          </span>
          <Input
            required
            type="datetime-local"
            min={toLocalDateTime(new Date())}
            value={values.pickupDate}
            onChange={updatePickupTime}
            aria-invalid={Boolean(errors.pickupDate)}
            onFocus={(event) => {
              const [date = "", time = ""] = event.currentTarget.value.split("T");
              pickupTimeSelection.current = date && time
                ? { date, time, timePartsChanged: 0 }
                : null;
            }}
            onBlur={() => {
              pickupTimeSelection.current = null;
            }}
          />
          {errors.pickupDate && (
            <small className="text-sm text-red-700">{errors.pickupDate}</small>
          )}
        </label>
        {isCapacityBlocked && (
          <Alert tone="danger" title="Limit reached">
            Your journey plan capacity limit is reached for this route
          </Alert>
        )}

        <Button type="submit" disabled={isSaving || isCapacityBlocked}>
          {isSaving ? (
            <>
              <Spinner /> Sending…
            </>
          ) : initialBid ? (
            "Save offer changes"
          ) : (
            "Submit bid"
          )}
        </Button>
      </form>
    </Card>
  );
}
