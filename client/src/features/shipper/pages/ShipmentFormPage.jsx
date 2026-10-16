import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Alert,
  Button,
  Spinner,
  Textarea,
  useSuccessToast,
} from "../../../shared/components/index.js";
import {
  getShipment,
  saveShipment,
  transitionShipment,
  uploadShipmentImages,
} from "../shipper.api.js";
import { ShipmentCargoFields } from "../components/ShipmentCargoFields.jsx";
import { ShipmentFormSection } from "../components/ShipmentFormSection.jsx";
import { ShipmentPhotoUploader } from "../components/ShipmentPhotoUploader.jsx";
import { ShipmentRouteFields } from "../components/ShipmentRouteFields.jsx";
import { fieldClass } from "../shipmentForm.utils.js";

const formSchema = z.object({
  goodsDescription: z
    .string()
    .trim()
    .min(10, "Describe the goods in at least 10 characters")
    .max(1000),
  goodsType: z.string().trim().min(1, "Choose a goods category").max(50),
  weightKg: z.coerce
    .number()
    .positive("Weight must be greater than zero")
    .max(99_999_999.99),
  volumeM3: z.coerce
    .number()
    .positive("Volume must be greater than zero")
    .max(99_999_999.99)
    .nullable()
    .optional(),
  pickupLocation: z.string().trim().min(1, "Enter a pickup location").max(255),
  deliveryLocation: z
    .string()
    .trim()
    .min(1, "Enter a delivery location")
    .max(255),
  pickupDate: z.iso
    .date("Choose a pickup date")
    .refine(
      (date) => date >= new Date().toISOString().slice(0, 10),
      "Pickup date must be today or later",
    ),
  specialRequirements: z.string().max(2000),
});

const empty = {
  goodsDescription: "",
  goodsType: "",
  weightKg: "",
  volumeM3: "",
  pickupLocation: "",
  pickupLat: null,
  pickupLng: null,
  deliveryLocation: "",
  deliveryLat: null,
  deliveryLng: null,
  pickupDate: "",
  specialRequirements: "",
};
export function ShipmentFormPage() {
  const { id: routeId } = useParams();
  const shipmentQuery = useQuery({
    queryKey: ["shipper", "shipment", routeId],
    queryFn: () => getShipment(routeId),
    enabled: Boolean(routeId),
  });

  if (routeId && shipmentQuery.isPending) {
    return (
      <div className="grid gap-4 px-6 py-6">
        <Spinner />
      </div>
    );
  }
  if (routeId && shipmentQuery.isError) {
    return (
      <div className="px-6 py-6">
        <Alert tone="danger" title="Shipment could not be loaded">
          {shipmentQuery.error.message}
        </Alert>
      </div>
    );
  }

  return (
    <ShipmentForm
      key={routeId || "new-shipment"}
      routeId={routeId}
      initialShipment={shipmentQuery.data || null}
    />
  );
}

function ShipmentForm({ routeId, initialShipment }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showSuccess = useSuccessToast();
  const [shipmentId, setShipmentId] = useState(routeId || null);
  const [values, setValues] = useState(() =>
    initialShipment
      ? {
          ...empty,
          ...initialShipment,
          weightKg: String(initialShipment.weightKg),
          volumeM3: initialShipment.volumeM3 != null ? String(initialShipment.volumeM3) : "",
          pickupDate: initialShipment.pickupDate?.slice(0, 10),
          specialRequirements: initialShipment.specialRequirements || "",
        }
      : empty,
  );
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }


  async function submit(event) {
    event.preventDefault();
    setSaveError("");
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
        ),
      );
      return;
    }
    setErrors({});
    const intent = event.nativeEvent.submitter?.value || "draft";
    setIsSaving(true);
    try {
      const payload = {
        ...parsed.data,
        weightKg: Number(parsed.data.weightKg),
      };
      for (const field of [
        "pickupLat",
        "pickupLng",
        "deliveryLat",
        "deliveryLng",
      ]) {
        if (values[field] == null && shipmentId) payload[field] = null;
        else if (values[field] == null) delete payload[field];
        else payload[field] = Number(values[field]);
      }
      if (!payload.specialRequirements.trim()) {
        if (shipmentId) payload.specialRequirements = null;
        else delete payload.specialRequirements;
      }
      const saved = await saveShipment({ id: shipmentId, values: payload });
      setShipmentId(saved.id);
      if (files.length) await uploadShipmentImages({ id: saved.id, files });
      if (intent === "publish" && saved.status === "DRAFT")
        await transitionShipment({ id: saved.id, action: "publish" });
      await queryClient.invalidateQueries({ queryKey: ["shipper"] });
      showSuccess(routeId ? 'Shipment updated' : intent === 'publish' ? 'Shipment posted' : 'Draft saved');
      navigate(`/shipper/shipments/${saved.id}`);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  const isEditable =
    !initialShipment || ["DRAFT", "PUBLISHED"].includes(initialShipment.status);

  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <div>
        <p className="mb-1 text-xs font-bold tracking-widest text-blue-700">
          {routeId ? "SHIPMENT DETAILS" : "NEW POSTING"}
        </p>
        <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">
          {routeId ? "Edit shipment" : "Post a shipment"}
        </h1>
        <p className="mb-0 mt-2 text-sm text-slate-500">
          Add the details transporters need to send you the right offer.
        </p>
      </div>

      {!isEditable && (
        <Alert tone="warning" title="This shipment can’t be edited">
          Shipments with accepted bids or a completed/cancelled status can no
          longer be changed.
        </Alert>
      )}
      {saveError && (
        <Alert tone="danger" title="Could not save shipment">
          {saveError}
        </Alert>
      )}

      <form className="grid gap-4" onSubmit={submit} noValidate>
        <ShipmentFormSection
          step="01"
          title="Shipment details"
          description="Tell transporters what you’re moving."
        >
          <ShipmentCargoFields
            values={values}
            errors={errors}
            setField={setField}
          />
        </ShipmentFormSection>

        <ShipmentFormSection
          step="02"
          title="Route & timing"
          description="Set the pickup and destination locations."
        >
          <ShipmentRouteFields
            values={values}
            errors={errors}
            setField={setField}
            setErrors={setErrors}
          />
        </ShipmentFormSection>

        <ShipmentFormSection
          step="03"
          title="Preferences"
          description="Share handling instructions and cargo photos."
        >
          <div className="grid gap-4">
            <label className={fieldClass}>
              <span>Special requirements</span>
              <Textarea
                maxLength={2000}
                value={values.specialRequirements}
                onChange={(event) =>
                  setField("specialRequirements", event.target.value)
                }
                placeholder="Fragile items, loading requirements, delivery notes…"
              />
              <small className="font-normal text-slate-500">
                Up to 2,000 characters
              </small>
            </label>
            <ShipmentPhotoUploader
              existingImages={initialShipment?.images || []}
              files={files}
              onFilesChange={setFiles}
              onError={setSaveError}
            />
          </div>
        </ShipmentFormSection>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 max-sm:flex-wrap">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            type="submit"
            name="intent"
            value="draft"
            disabled={!isEditable || isSaving}
          >
            {isSaving ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              "Save as draft"
            )}
          </Button>
          <Button
            type="submit"
            name="intent"
            value="publish"
            disabled={!isEditable || isSaving}
          >
            {isSaving ? (
              <>
                <Spinner /> Saving…
              </>
            ) : routeId && initialShipment?.status === "PUBLISHED" ? (
              "Save changes"
            ) : (
              "Publish shipment"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
