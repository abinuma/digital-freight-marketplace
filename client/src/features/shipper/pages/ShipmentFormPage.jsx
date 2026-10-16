import { useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { startConversation, sendConversationMessage } from "../../messaging/messaging.api.js";
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

const dateLabel = (date) =>
  date
    ? new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(date))
    : "—";

export function ShipmentFormPage() {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const invitedDriverId = searchParams.get("driverId") || location.state?.invitedDriver?.id || null;
  const invitedDriverName = searchParams.get("driverName") || location.state?.invitedDriver?.name || "Driver";
  const invitedCity = searchParams.get("city") || location.state?.invitedDriver?.city || "";
  const invitedDestination = searchParams.get("destination") || location.state?.invitedDriver?.intendedDestination || "";
  const invitedVehicle = searchParams.get("vehicleType") || location.state?.invitedDriver?.vehicleType || "";
  const prefillShipment = location.state?.prefillShipment || null;

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
      key={routeId || (invitedDriverId ? `invite-${invitedDriverId}` : "new-shipment")}
      routeId={routeId}
      initialShipment={shipmentQuery.data || null}
      invitedDriver={
        invitedDriverId
          ? {
              id: invitedDriverId,
              name: invitedDriverName,
              city: invitedCity,
              destination: invitedDestination,
              vehicleType: invitedVehicle,
            }
          : null
      }
      prefillShipment={prefillShipment}
    />
  );
}

function ShipmentForm({ routeId, initialShipment, invitedDriver, prefillShipment }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showSuccess = useSuccessToast();
  const [shipmentId, setShipmentId] = useState(routeId || null);
  const [values, setValues] = useState(() => {
    if (initialShipment) {
      return {
        ...empty,
        ...initialShipment,
        weightKg: String(initialShipment.weightKg),
        volumeM3: initialShipment.volumeM3 != null ? String(initialShipment.volumeM3) : "",
        pickupDate: initialShipment.pickupDate?.slice(0, 10),
        specialRequirements: initialShipment.specialRequirements || "",
      };
    }
    if (prefillShipment) {
      return {
        ...empty,
        ...prefillShipment,
        weightKg: String(prefillShipment.weightKg || ""),
        volumeM3: prefillShipment.volumeM3 != null ? String(prefillShipment.volumeM3) : "",
        pickupDate: prefillShipment.pickupDate ? prefillShipment.pickupDate.slice(0, 10) : "",
        specialRequirements: prefillShipment.specialRequirements || "",
      };
    }
    return {
      ...empty,
      pickupLocation: invitedDriver?.city || "",
      deliveryLocation: invitedDriver?.destination || "",
    };
  });
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
      let specialReq = (payload.specialRequirements || "").trim();
      if (invitedDriver?.id) {
        const cleanReq = specialReq.replace(/\[INVITED_DRIVER:[a-f0-9-]+\]\s*/g, '').trim();
        specialReq = `[INVITED_DRIVER:${invitedDriver.id}] ${cleanReq}`.trim();
      }
      if (!specialReq) {
        if (shipmentId) payload.specialRequirements = null;
        else delete payload.specialRequirements;
      } else {
        payload.specialRequirements = specialReq;
      }
      const saved = await saveShipment({ id: shipmentId, values: payload });
      setShipmentId(saved.id);
      if (files.length) await uploadShipmentImages({ id: saved.id, files });
      if (intent === "publish" && saved.status === "DRAFT")
        await transitionShipment({ id: saved.id, action: "publish" });
      await queryClient.invalidateQueries({ queryKey: ["shipper"] });

      if (invitedDriver?.id) {
        try {
          const conversation = await startConversation(invitedDriver.id);
          const inviteMsg =
            `Hello ${invitedDriver.name}, I would like to invite you to take this load:\n` +
            `• Cargo: ${saved.goodsDescription} (${saved.goodsType})\n` +
            `• Weight: ${saved.weightKg} kg${saved.volumeM3 ? ` · Volume: ${saved.volumeM3} m³` : ""}\n` +
            `• Route: ${saved.pickupLocation} → ${saved.deliveryLocation}\n` +
            `• Pickup date: ${dateLabel(saved.pickupDate)}\n` +
            `Please check the details and submit your bid here: /transporter/shipments/${saved.id}`;

          await sendConversationMessage({
            conversationId: conversation.id,
            content: inviteMsg,
          });
          showSuccess(`Load invite sent directly to ${invitedDriver.name}`);
          navigate(`/shipper/messages?conversationId=${conversation.id}`);
          return;
        } catch (inviteError) {
          showSuccess(`Shipment posted. Message not delivered: ${inviteError.message}`);
          navigate(`/shipper/shipments/${saved.id}`);
          return;
        }
      }

      showSuccess(routeId ? "Shipment updated" : intent === "publish" ? "Shipment posted" : "Draft saved");
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
        {(routeId || invitedDriver?.id) && (
          <p className="mb-1 text-xs font-bold tracking-widest text-blue-700">
            {routeId ? "SHIPMENT DETAILS" : "DIRECT LOAD INVITATION"}
          </p>
        )}
        <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">
          {routeId
            ? "Edit shipment"
            : invitedDriver?.id
            ? `Send load invite to ${invitedDriver.name}`
            : "Post a shipment"}
        </h1>
        <p className="mb-0 mt-2 text-sm text-slate-500">
          {invitedDriver?.id
            ? `Add the details below to dispatch this load invite directly to ${invitedDriver.name}.`
            : "Add the details transporters need to send you the right offer."}
        </p>
      </div>

      {invitedDriver?.id && (
        <div className="flex items-center gap-3.5 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 shadow-2xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Inviting: {invitedDriver.name}</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">Direct Invite</span>
            </div>
            <p className="m-0 mt-0.5 text-xs text-slate-600">
              {invitedDriver.vehicleType ? `Vehicle: ${invitedDriver.vehicleType} · ` : ""}
              {invitedDriver.city ? `Available in ${invitedDriver.city}` : "Available driver"}
              {invitedDriver.destination ? ` → Heading to ${invitedDriver.destination}` : ""}
            </p>
          </div>
        </div>
      )}

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
          {!invitedDriver?.id && (
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
          )}
          <Button
            type="submit"
            name="intent"
            value="publish"
            disabled={!isEditable || isSaving}
          >
            {isSaving ? (
              <>
                <Spinner /> {invitedDriver?.id ? "Sending invite…" : "Saving…"}
              </>
            ) : routeId && initialShipment?.status === "PUBLISHED" ? (
              "Save changes"
            ) : invitedDriver?.id ? (
              "Send load invite"
            ) : (
              "Publish shipment"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
