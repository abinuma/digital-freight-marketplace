import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Button,
  Card,
  Modal,
  Skeleton,
  Spinner,
  useSuccessToast,
} from "../../../shared/components/index.js";
import {
  getInviterProfile,
  getShipment,
  listMyBids,
  withdrawBid,
} from "../transporter.api.js";
import { BidEditor } from "../components/BidEditor.jsx";
import { listConversations } from "../../messaging/messaging.api.js";
import { ShipmentHeading, ShipmentInformation } from "../../shipments/components/ShipmentSummary.jsx";
import { dateLabel, money, shipmentTones } from "../../shipments/shipmentFormatters.js";

const tones = { ...shipmentTones, PENDING: "warning", ACCEPTED: "success", DECLINED: "danger", WITHDRAWN: "neutral" };
export function ShipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/transporter/shipments");
    }
  };
  const cache = useQueryClient();
  const showSuccess = useSuccessToast();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const shipmentQuery = useQuery({
    queryKey: ["transporter", "shipment", id],
    queryFn: () => getShipment(id),
    refetchInterval: 15_000,
  });
  const inviterQuery = useQuery({
    queryKey: ["users", "publicProfile", shipmentQuery.data?.shipperId],
    queryFn: () => getInviterProfile(shipmentQuery.data.shipperId),
    enabled: Boolean(shipmentQuery.data?.isDirectInvite && shipmentQuery.data?.shipperId),
    staleTime: 5 * 60_000,
  });
  const ownBidQuery = useQuery({
    queryKey: ["transporter", "bidForShipment", id],
    queryFn: () => listMyBids({ shipmentId: id, limit: 1 }),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
  const conversationsQuery = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: listConversations,
    enabled: Boolean(ownBidQuery.data?.bids?.[0]?.status === "ACCEPTED" && shipmentQuery.data?.shipperId),
  });
  const shipment = shipmentQuery.data;
  const inviterName = inviterQuery.data?.name || "The shipper";
  const latestBid = ownBidQuery.data?.bids?.[0] || null;
  const activeBid =
    latestBid && ["PENDING", "ACCEPTED"].includes(latestBid.status)
      ? latestBid
      : null;
  const shipperConversation = conversationsQuery.data?.find(
    (conversation) => conversation.counterpart?.id === shipment?.shipperId,
  );
  const canBid =
    !ownBidQuery.isPending &&
    !ownBidQuery.isError &&
    shipment?.status === "PUBLISHED" &&
    latestBid?.status !== "PENDING" &&
    latestBid?.status !== "ACCEPTED";

  async function doWithdraw() {
    if (!activeBid) return;
    setIsWithdrawing(true);
    setActionError("");
    try {
      await withdrawBid({ shipmentId: id, bidId: activeBid.id });
      setWithdrawOpen(false);
      await cache.invalidateQueries({ queryKey: ["transporter"] });
      showSuccess('Offer withdrawn');
    } catch (error) {
      setActionError(error.message);
    } finally {
      setIsWithdrawing(false);
    }
  }

  if (shipmentQuery.isPending) {
    return (
      <div className="grid gap-4 px-6 py-6 max-md:px-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (shipmentQuery.isError) {
    const unavailableBid = ownBidQuery.data?.bids?.[0];
    const isCancelled = Boolean(unavailableBid?.shipment?.removedAt)
      || unavailableBid?.shipment?.status === "CANCELLED";
    return (
      <div className="grid gap-4 px-6 py-6 max-md:px-4">
        <Alert tone="danger" title={isCancelled ? "This shipment is cancelled" : "Shipment unavailable"}>
          {isCancelled ? "This shipment was cancelled or removed and is no longer available." : shipmentQuery.error.message}
        </Alert>
        {unavailableBid?.shipment?.pickupLocation && unavailableBid?.shipment?.deliveryLocation && (
          <p className="m-0 text-sm text-slate-600">
            {unavailableBid.shipment.pickupLocation} <img src="/arrow-right-long-solid-full.svg" alt="to" aria-hidden="true" className="mx-1 inline h-3 w-4 align-middle" /> {unavailableBid.shipment.deliveryLocation}
          </p>
        )}
        <Link
          className="group inline-flex w-fit min-h-10 items-center gap-2 rounded-full border border-blue-200 bg-white px-5 text-sm font-semibold text-slate-900 no-underline transition-colors hover:border-blue-700 hover:bg-blue-700 hover:text-white"
          to="/transporter/shipments" onClick={(e) => { e.preventDefault(); handleBack(); }}
        >
          <img src="/chevron-left-solid-full.svg" alt="" aria-hidden="true" className="h-4 w-4 group-hover:brightness-0 group-hover:invert" />
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <header className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div className="min-w-0 max-w-3xl">
          <ShipmentHeading shipment={shipment} hidePublishedStatus hideCargoSummary />
        </div>
        <Link
          className="inline-flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 no-underline hover:bg-slate-50"
          to="/transporter/bids"
        >
          My bids
        </Link>
      </header>

      {actionError && (
        <Alert tone="danger" title="Action could not be completed">
          {actionError}
        </Alert>
      )}

      {shipment.isDirectInvite && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 shadow-2xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            ★
          </div>
          <div>
            <p className="m-0 text-sm font-semibold text-slate-900">{inviterName} sent this load invitation to you.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 items-start gap-4 max-lg:grid-cols-1">
        <div className="grid gap-4 lg:col-span-2">
          <ShipmentInformation shipment={shipment} />
        </div>

        <aside className="grid gap-4 lg:col-span-1">
          {ownBidQuery.isError && (
            <Alert tone="danger" title="Your bid status could not be checked">
              {ownBidQuery.error.message}
            </Alert>
          )}
          {ownBidQuery.isPending ? (
            <Card className="grid gap-4 p-5">
              <Skeleton className="h-8" />
              <Skeleton className="h-24" />
            </Card>
          ) : activeBid ? (
            <>
              <Card className="grid gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="m-0 text-base font-semibold text-slate-900">
                      Your offer
                    </h2>
                    <p className="mb-0 mt-1 text-xs text-slate-500">
                      Submitted {dateLabel(activeBid.createdAt)}
                    </p>
                  </div>
                  <Badge tone={tones[activeBid.status]}>
                    {activeBid.status}
                  </Badge>
                </div>
                <strong className="text-2xl font-bold text-slate-900">
                  {money(activeBid.price)}
                </strong>
                <div className="grid gap-1 border-t border-slate-100 pt-3 text-sm">
                  <span className="text-slate-500">Your pickup offer</span>
                  <strong className="text-slate-800">
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(activeBid.pickupDate))}
                  </strong>
                </div>
                {activeBid.message && (
                  <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {activeBid.message}
                  </p>
                )}
                {activeBid.status === "PENDING" && (
                  <Button
                    variant="danger"
                    onClick={() => setWithdrawOpen(true)}
                  >
                    Withdraw bid
                  </Button>
                )}
                {activeBid.status === "ACCEPTED" && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <Link
                      className="font-semibold text-blue-700 underline hover:text-blue-900"
                      to={shipperConversation ? `/transporter/messages?conversationId=${shipperConversation.id}` : "/transporter/messages"}
                    >
                      chat
                    </Link>
                    {!latestBid?.journeyPlanAssignment && (
                      <Link
                        className="inline-flex min-h-8 items-center justify-center rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-blue-800"
                        to={`/transporter/bids?assignShipmentId=${id}`}
                      >
                        Assign to journey plan
                      </Link>
                    )}
                  </div>
                )}
              </Card>
              {activeBid.status === "PENDING" && (
                <BidEditor
                  key={activeBid.id}
                  shipmentId={id}
                  initialBid={activeBid}
                  shipment={shipment}
                />
              )}
            </>
          ) : canBid ? (
            <BidEditor
              key={latestBid?.id || "new"}
              shipmentId={id}
              initialBid={null}
              shipment={shipment}
            />
          ) : ownBidQuery.isError ? (
            <Card className="grid gap-3 p-5">
              <h2 className="m-0 text-base font-semibold text-slate-900">
                Bid status unavailable
              </h2>
              <p className="m-0 text-sm leading-6 text-slate-500">
                Refresh this page to check whether you have already bid.
              </p>
            </Card>
          ) : latestBid &&
            ["DECLINED", "WITHDRAWN"].includes(latestBid.status) &&
            shipment.status === "PUBLISHED" ? (
            <>
              <Alert
                tone="info"
                title={`Your last bid was ${latestBid.status.toLowerCase()}`}
              >
                You may submit a new offer while this listing is still open.
              </Alert>
              <BidEditor
                key={`new-${latestBid.id}`}
                shipmentId={id}
                initialBid={null}
                shipment={shipment}
              />
            </>
          ) : (
            <Card className="grid gap-3 p-5">
              <h2 className="m-0 text-base font-semibold text-slate-900">
                Bidding is closed
              </h2>
              <p className="m-0 text-sm leading-6 text-slate-500">
                This shipment is no longer accepting offers.
              </p>
              {latestBid && (
                <Badge tone={tones[latestBid.status]}>{latestBid.status}</Badge>
              )}
            </Card>
          )}
        </aside>
      </div>

      <Link
        className="group inline-flex w-fit min-h-10 items-center gap-2 rounded-full border border-blue-200 bg-white px-5 text-sm font-semibold text-slate-900 no-underline transition-colors hover:border-blue-700 hover:bg-blue-700 hover:text-white"
        to="/transporter/shipments" onClick={(e) => { e.preventDefault(); handleBack(); }}
      >
        <img src="/chevron-left-solid-full.svg" alt="" aria-hidden="true" className="h-4 w-4 group-hover:brightness-0 group-hover:invert" />
        Back
      </Link>

      <Modal
        open={withdrawOpen}
        onClose={() => !isWithdrawing && setWithdrawOpen(false)}
        title="Withdraw your bid?"
      >
        <p className="mb-4 mt-0 text-sm leading-6 text-slate-500">
          The shipper will no longer see this as an active offer. You may submit
          a new offer later if the listing remains open.
        </p>
        <div className="mt-5 flex justify-end gap-2 max-sm:flex-col-reverse">
          <Button
            variant="secondary"
            onClick={() => setWithdrawOpen(false)}
            disabled={isWithdrawing}
          >
            Keep bid
          </Button>
          <Button
            variant="danger"
            onClick={doWithdraw}
            disabled={isWithdrawing}
          >
            {isWithdrawing ? <Spinner /> : "Withdraw bid"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

