import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Modal,
  Skeleton,
  Spinner,
  Textarea,
  useSuccessToast,
} from "../../../shared/components/index.js";
import { transitionShipment } from "../shipper.api.js";
import {
  decideBid,
  getShipment,
  getUserProfile,
  listShipmentBids,
  removeShipmentImage,
} from "../shipper.api.js";
import { ShipmentReviews } from "../components/ShipmentReviews.jsx";
import { ShipperBidsPanel } from "../components/ShipperBidsPanel.jsx";
import { startConversation } from "../../messaging/messaging.api.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { ShipmentHeading, ShipmentInformation } from "../../shipments/components/ShipmentSummary.jsx";


export function ShipmentDetailPage() {
  const { user } = useAuth();
  const showSuccess = useSuccessToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/shipper/shipments");
    }
  };
  const cache = useQueryClient();
  const [confirmation, setConfirmation] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);
  const [chattingBidId, setChattingBidId] = useState(null);
  const shipmentQuery = useQuery({
    queryKey: ["shipper", "shipment", id],
    queryFn: () => getShipment(id),
  });
  const bidsQuery = useQuery({
    queryKey: ["shipper", "bids", id],
    queryFn: () => listShipmentBids(id),
    enabled: Boolean(shipmentQuery.data),
    refetchInterval: 15_000,
  });
  const bids = [...(bidsQuery.data || [])].sort(
    (first, second) => Number(first.price) - Number(second.price),
  );
  const profileQueries = useQueries({
    queries: [...new Set(bids.map((bid) => bid.transporterId))].map(
      (transporterId) => ({
        queryKey: ["users", "publicProfile", transporterId],
        queryFn: () => getUserProfile(transporterId),
        staleTime: 5 * 60_000,
      }),
    ),
  });
  const profiles = new Map(
    [...new Set(bids.map((bid) => bid.transporterId))].map(
      (transporterId, index) => [transporterId, profileQueries[index]?.data],
    ),
  );
  const shipment = shipmentQuery.data;

  async function refresh() {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ["shipper"] }),
      cache.invalidateQueries({ queryKey: ["shipper", "shipment", id] }),
      cache.invalidateQueries({ queryKey: ["shipper", "bids", id] }),
    ]);
  }

  async function performAction() {
    if (!confirmation) return;
    setWorking(true);
    setActionError("");
    try {
      if (confirmation.type === "bid") {
        await decideBid({
          shipmentId: id,
          bidId: confirmation.id,
          action: confirmation.action,
          declineReason: declineReason.trim() || undefined,
        });
      } else if (confirmation.type === "image") {
        await removeShipmentImage({ shipmentId: id, imageId: confirmation.id });
      } else {
        await transitionShipment({ id, action: confirmation.action });
      }
      const successMessage = confirmation.type === "bid"
        ? confirmation.action === "accept" ? "Bid accepted" : "Bid declined"
        : confirmation.type === "image" ? "Image removed"
          : confirmation.action === "publish" ? "Shipment published"
            : confirmation.action === "complete" ? "Shipment completed"
              : "Shipment cancelled";
      setConfirmation(null);
      setDeclineReason("");
      await refresh();
      showSuccess(successMessage);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setWorking(false);
    }
  }

  async function openDriverChat(bid) {
    if (!bid?.transporterId || chattingBidId) return;
    setChattingBidId(bid.id);
    setActionError("");
    try {
      const conversation = await startConversation({ transporterId: bid.transporterId });
      navigate(`/shipper/messages?conversationId=${conversation.id}`);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setChattingBidId(null);
    }
  }

  if (shipmentQuery.isPending)
    return (
      <div className="grid gap-4 px-6 py-6 max-md:px-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    );
  if (shipmentQuery.isError)
    return (
      <div className="grid gap-4 px-6 py-6 max-md:px-4">
        <Alert tone="danger" title="Shipment unavailable">
          {shipmentQuery.error.message}
        </Alert>
        <Link
          className="group inline-flex w-fit min-h-9 items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 text-sm font-semibold text-slate-900 no-underline transition-colors hover:border-blue-700 hover:bg-blue-700 hover:text-white"
          to="/shipper/shipments" onClick={(e) => { e.preventDefault(); handleBack(); }}
        >
          <img src="/chevron-left-solid-full.svg" alt="" aria-hidden="true" className="h-3.5 w-3.5 group-hover:brightness-0 group-hover:invert" />
          Back
        </Link>
      </div>
    );

  const canEditStatus = shipment.status === "PUBLISHED";
  const hasActiveBid = bids.some((bid) => ["PENDING", "ACCEPTED"].includes(bid.status));
  const hasAcceptedBid = bids.some((bid) => bid.status === "ACCEPTED");
  const canCancel = !["CANCELLED", "COMPLETED"].includes(shipment.status)
    && !bidsQuery.isPending
    && !bidsQuery.isError
    && !hasAcceptedBid;
  const canEdit = shipment.status === "PUBLISHED" &&
    !bidsQuery.isPending &&
    !bidsQuery.isError &&
    !hasActiveBid;
  const dialogTitle =
    confirmation?.type === "bid"
      ? `${confirmation.action === "accept" ? "Accept" : "Decline"} this bid?`
      : confirmation?.type === "image"
        ? "Remove this photo?"
        : `Confirm ${confirmation?.action || "shipment action"}?`;
  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <header className="grid gap-4">
        <div className="flex items-end justify-between gap-4 max-lg:flex-col max-lg:items-start">
          <ShipmentHeading shipment={shipment} eyebrow="SHIPMENT OVERVIEW" hideCargoSummary />
          <div className="flex shrink-0 flex-nowrap gap-2">
            {canEditStatus && (
              <Button
                variant="secondary"
                disabled={!canEdit}
                title={hasActiveBid ? "A driver has already sent a bid" : undefined}
                onClick={() => navigate(`/shipper/shipments/${id}/edit`)}
              >
                Edit shipment
              </Button>
            )}
            {shipment.status === "IN_PROGRESS" && (
              <Button
                onClick={() =>
                  setConfirmation({ action: "complete", type: "shipment" })
                }
              >
                Mark delivered
              </Button>
            )}
            {!["CANCELLED", "COMPLETED"].includes(shipment.status) && (
              <Button
                variant="danger"
                disabled={!canCancel}
                title={hasAcceptedBid
                  ? "A shipment cannot be cancelled after a bid has been accepted"
                  : bidsQuery.isPending || bidsQuery.isError
                    ? "Bid status must be checked before cancellation"
                    : undefined}
                onClick={() =>
                  setConfirmation({ action: "cancel", type: "shipment" })
                }
              >
                Cancel shipment
              </Button>
            )}
          </div>
        </div>
        {actionError && (
          <Alert tone="danger" title="Action could not be completed">
            {actionError}
          </Alert>
        )}
      </header>

      <div className="grid grid-cols-3 items-start gap-4 max-lg:grid-cols-1">
        <div className="grid gap-4 lg:col-span-2">
          <ShipmentInformation
            shipment={shipment}
            description="Shipment information for transporters."
            pickupLabel="Pickup date"
            categoryLabel="Goods category"
            weightLabel="Cargo weight"
            postedLabel="Posted on"
            canEditPhotos={canEdit}
            onRemoveImage={(image) =>
              setConfirmation({ type: "image", id: image.id })
            }
          />
          {shipment.status === "COMPLETED" && (
            <ShipmentReviews
              shipmentId={id}
              canReview={shipment.shipperId === user?.id}
            />
          )}
        </div>

        <aside className="grid min-w-0 gap-4 lg:col-span-1">
          <ShipperBidsPanel
            bids={bids}
            bidsQuery={bidsQuery}
            profiles={profiles}
            shipment={shipment}
            onAccept={(bid) =>
              setConfirmation({ type: "bid", id: bid.id, action: "accept" })
            }
            onDecline={(bid) => {
              setDeclineReason("");
              setConfirmation({ type: "bid", id: bid.id, action: "decline" });
            }}
            onChat={openDriverChat}
            chattingBidId={chattingBidId}
          />
        </aside>
      </div>

      <Link
        className="group inline-flex w-fit min-h-9 items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 text-sm font-semibold text-slate-900 no-underline transition-colors hover:border-blue-700 hover:bg-blue-700 hover:text-white"
        to="/shipper/shipments" onClick={(e) => { e.preventDefault(); handleBack(); }}
      >
        <img src="/chevron-left-solid-full.svg" alt="" aria-hidden="true" className="h-3.5 w-3.5 group-hover:brightness-0 group-hover:invert" />
        Back
      </Link>

      <Modal
        open={Boolean(confirmation)}
        onClose={() => !working && setConfirmation(null)}
        title={dialogTitle}
      >
        <p className="mb-4 mt-0 text-sm leading-6 text-slate-500">
          {confirmation?.type === "bid"
            ? confirmation.action === "accept"
              ? "Accepting this offer starts the shipment and closes the other pending bids."
              : "Decline this transporter’s offer."
            : confirmation?.type === "image"
              ? "This photo will be removed from the shipment."
              : confirmation?.action === "publish"
                ? "Publishing makes this shipment visible to transporters."
                : confirmation?.action === "complete"
                  ? "Confirm that this shipment has been delivered."
                  : "This shipment will be cancelled and pending bids declined."}
        </p>
        {confirmation?.type === "bid" && confirmation.action === "decline" && (
          <label className="grid content-start gap-1.5 text-sm font-medium text-slate-700">
            <span>Reason (optional)</span>
            <Textarea
              maxLength={2000}
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              placeholder="Add a note for the transporter"
            />
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2 max-sm:flex-col-reverse">
          <Button
            variant="secondary"
            disabled={working}
            onClick={() => setConfirmation(null)}
          >
            Cancel
          </Button>
          <Button
            variant={
              confirmation?.action === "cancel" ||
              confirmation?.action === "decline" ||
              confirmation?.type === "image"
                ? "danger"
                : "primary"
            }
            disabled={working}
            onClick={performAction}
          >
            {working ? (
              <Spinner />
            ) : confirmation?.action === "accept" ? (
              "Accept bid"
            ) : confirmation?.action === "decline" ? (
              "Decline bid"
            ) : confirmation?.type === "image" ? (
              "Remove photo"
            ) : confirmation?.action === "complete" ? (
              "Mark delivered"
            ) : confirmation?.action === "publish" ? (
              "Publish shipment"
            ) : (
              "Cancel shipment"
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
