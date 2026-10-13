import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Alert,
  Button,
  Card,
  Input,
  Spinner,
  Textarea,
} from "../../../shared/components/index.js";
import { submitBid } from "../transporter.api.js";

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
  message: z.string().max(5000),
});
const fieldClass =
  "grid content-start gap-1.5 text-sm font-medium text-slate-700";

export function BidEditor({ shipmentId, initialBid }) {
  const cache = useQueryClient();
  const [values, setValues] = useState({
    price: initialBid ? String(initialBid.price) : "",
    pickupDate: toLocalDateTime(initialBid?.pickupDate),
    message: initialBid?.message || "",
  });
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const pickupTimeSelection = useRef(null);

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
        <p className="mb-0 mt-1 text-sm text-slate-500">
          Send the shipper a clear price and pickup time.
        </p>
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
        <label className={fieldClass}>
          <span>Message to shipper</span>
          <Textarea
            maxLength={5000}
            value={values.message}
            onChange={(event) => update("message", event.target.value)}
            placeholder="Introduce your service or ask a question"
          />
          {errors.message && (
            <small className="text-sm text-red-700">{errors.message}</small>
          )}
        </label>
        <Button type="submit" disabled={isSaving}>
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
