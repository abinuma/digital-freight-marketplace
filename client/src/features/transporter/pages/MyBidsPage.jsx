import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Button,
  Card,
  Modal,
  Pagination,
  Select,
  Skeleton,
  Spinner,
  useSuccessToast,
} from "../../../shared/components/index.js";
import { getShipment, listMyBids, withdrawBid } from "../transporter.api.js";
import { assignBidToJourneyPlan, listMyJourneyPlans } from "../journeyPlan.api.js";
import { formatLoadSize, formatShipmentLoad, getLoadFraction } from "../../../shared/constants/loadSizes.js";

const statuses = ["PENDING", "ACCEPTED", "DECLINED", "WITHDRAWN"];
const tones = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  WITHDRAWN: "neutral",
  CANCELLED: "danger",
};
const money = (amount) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(amount);
const dateLabel = (date) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

export function MyBidsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const assignShipmentId = searchParams.get("assignShipmentId");
  const showSuccess = useSuccessToast();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedBid, setSelectedBid] = useState(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [assigningBid, setAssigningBid] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [assignWorking, setAssignWorking] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignedPlans, setAssignedPlans] = useState({});

  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["transporter", "myBids", status, page, assignShipmentId],
    queryFn: () => listMyBids({
      status: assignShipmentId ? "ACCEPTED" : status || undefined,
      shipmentId: assignShipmentId || undefined,
      page,
      limit: 10,
    }),
    refetchInterval: 15_000,
  });
  const bids = query.data?.bids || [];
  useEffect(() => {
    if (!assignShipmentId || query.isPending || query.isError) return;
    const acceptedBid = bids.find((bid) => bid.status === "ACCEPTED");
    if (acceptedBid && !acceptedBid.journeyPlanAssignment) {
      setAssigningBid(acceptedBid);
      setSelectedPlanId("");
      setAssignError("");
    }
    setSearchParams({}, { replace: true });
  }, [assignShipmentId, bids, query.isError, query.isPending, setSearchParams]);
  const shipmentQueries = useQueries({
    queries: bids.map((bid) => ({
      queryKey: ["transporter", "bidShipment", bid.shipmentId],
      queryFn: () => getShipment(bid.shipmentId),
      staleTime: 60_000,
    })),
  });

  const activePlansQuery = useQuery({
    queryKey: ["transporter", "activeJourneyPlans"],
    queryFn: () => listMyJourneyPlans({ status: "ACTIVE", limit: 50 }),
    enabled: Boolean(assigningBid),
  });
  const activePlans = activePlansQuery.data?.journeyPlans || [];

  async function confirmAssignment() {
    if (!assigningBid || !selectedPlanId) return;
    setAssignWorking(true);
    setAssignError("");
    try {
      const assignment = await assignBidToJourneyPlan({
        journeyPlanId: selectedPlanId,
        bidId: assigningBid.id,
      });
      const assignedPlan = activePlans.find((plan) => plan.id === selectedPlanId);
      setAssignedPlans((current) => ({
        ...current,
        [assigningBid.id]: assignment?.journeyPlan || assignment?.assignment?.journeyPlan || assignedPlan,
      }));
      setAssigningBid(null);
      setSelectedPlanId("");
      await cache.invalidateQueries({ queryKey: ["transporter"] });
      showSuccess('Added to plan');
    } catch (err) {
      setAssignError(err.message || "Could not assign bid to journey plan");
    } finally {
      setAssignWorking(false);
    }
  }

  async function confirmWithdraw() {
    if (!selectedBid) return;
    setWorking(true);
    setError("");
    try {
      await withdrawBid({
        shipmentId: selectedBid.shipmentId,
        bidId: selectedBid.id,
      });
      setSelectedBid(null);
      await cache.invalidateQueries({ queryKey: ["transporter"] });
      showSuccess('Offer withdrawn');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
    }
  }

  function changeStatus(event) {
    setStatus(event.target.value);
    setPage(1);
    setError("");
  }
  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">
            My bids
          </h1>
        </div>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          <span>Filter by status</span>
          <Select
            className="min-w-48"
            value={status}
            onChange={changeStatus}
            aria-label="Filter bids by status"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {error && (
        <Alert tone="danger" title="Could not complete that action">
          {error}
        </Alert>
      )}
      {query.isError && (
        <Alert tone="danger" title="Could not load your bids">
          {query.error.message}
        </Alert>
      )}

      {query.isPending ? (
        <div className="grid gap-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : query.isError ? null : bids.length ? (
        <div className="grid gap-3">
          {bids.map((bid, index) => {
            const shipment = shipmentQueries[index]?.data;
            const shipmentUnavailable = shipmentQueries[index]?.isError;
            const shipmentSummary = bid.shipment;
            const isCancelled = shipment?.status === "CANCELLED"
              || shipmentSummary?.status === "CANCELLED"
              || Boolean(shipmentSummary?.removedAt);
            const displayedStatus = isCancelled ? "CANCELLED" : bid.status;
            return (
              <Card className="grid gap-4 p-4" key={bid.id}>
                <div className="flex items-start justify-between gap-4 max-sm:flex-col max-sm:gap-2">
                  <div className="grid justify-items-start gap-2">
                    <Badge tone={tones[displayedStatus]}>{displayedStatus}</Badge>
                    <h2 className="m-0 text-base font-semibold text-slate-900">
                      {shipment?.goodsDescription ||
                        shipmentSummary?.goodsDescription ||
                        (isCancelled
                          ? "This shipment is cancelled"
                          : shipmentUnavailable
                          ? "Shipment details unavailable"
                          : "Loading shipment…")}
                    </h2>
                  </div>
                  <div className="grid justify-items-end gap-1 max-sm:justify-items-start">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Your offer
                    </span>
                    <strong className="text-lg font-bold text-slate-900">
                      {money(bid.price)}
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                  <span className="font-medium">
                    {shipment?.pickupLocation || shipmentSummary?.pickupLocation || "—"}
                  </span>
                  <span className="text-blue-700" aria-hidden="true">
                    →
                  </span>
                  <span className="font-medium">
                    {shipment?.deliveryLocation || shipmentSummary?.deliveryLocation || "—"}
                  </span>
                </div>

                {bid.status === "ACCEPTED" && !isCancelled && (
                  bid.journeyPlanAssignment || assignedPlans[bid.id] ? (
                    <div className="text-sm">
                      <Link
                        className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
                        to="/transporter/journey-plans"
                      >
                        Journey plan
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                      <div className="text-amber-800">
                        Assign this load to a Journey Plan to reserve truckload capacity.
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setAssigningBid(bid);
                          setSelectedPlanId("");
                          setAssignError("");
                        }}
                      >
                        Assign to Journey Plan
                      </Button>
                    </div>
                  )
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                    <span>Offer sent {dateLabel(bid.createdAt)}</span>
                    <span>Pickup offered {dateLabel(bid.pickupDate)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isCancelled ? (
                      <span className="inline-flex min-h-8 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400" aria-disabled="true">
                        Shipment cancelled
                      </span>
                    ) : (
                      <Link
                        className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 no-underline hover:bg-slate-50"
                        to={`/transporter/shipments/${bid.shipmentId}`}
                      >
                        View shipment
                      </Link>
                    )}
                    {bid.status === "PENDING" && !isCancelled && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setSelectedBid(bid);
                          setError("");
                        }}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <span className="text-2xl text-slate-400" aria-hidden="true">
            ▤
          </span>
          <h3 className="m-0 text-base font-semibold text-slate-800">
            {status ? `No ${status.toLowerCase()} bids` : "No bids yet"}
          </h3>
          <p className="m-0 text-sm text-slate-500">
            {status
              ? "Choose a different status or browse available shipments."
              : "Find a shipment that fits your route and send your first offer."}
          </p>
          <Link
            className="mt-2 inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-blue-800"
            to="/transporter/shipments"
          >
            Browse shipments
          </Link>
        </Card>
      )}

      {!query.isError && (
        <Pagination
          page={query.data?.pagination?.page || page}
          pageCount={query.data?.pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      )}
      <Modal
        open={Boolean(selectedBid)}
        onClose={() => !working && setSelectedBid(null)}
        title="Withdraw this bid?"
      >
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 font-bold text-amber-800"
            aria-hidden="true"
          >
            !
          </span>
          <div className="grid gap-1">
            <strong className="text-sm text-slate-800">
              This offer will be withdrawn
            </strong>
            <p className="m-0 text-sm leading-6 text-slate-600">
              The shipper will no longer see it as an active bid. You can submit
              another offer later if the shipment is still open.
            </p>
          </div>
        </div>
        {selectedBid && (
          <div className="mt-4 flex items-center justify-between border-b border-slate-100 pb-4 text-sm">
            <span className="text-slate-500">Offer amount</span>
            <strong className="text-slate-900">
              {money(selectedBid.price)}
            </strong>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2 max-sm:flex-col-reverse">
          <Button
            className="max-sm:w-full"
            variant="secondary"
            onClick={() => setSelectedBid(null)}
            disabled={working}
          >
            Keep bid
          </Button>
          <Button
            className="max-sm:w-full"
            variant="danger"
            onClick={confirmWithdraw}
            disabled={working}
          >
            {working ? <Spinner /> : "Withdraw bid"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(assigningBid)}
        onClose={() => !assignWorking && setAssigningBid(null)}
        title="Assign load to journey plan"
        className="flex max-h-[calc(100dvh-1.5rem)] max-w-2xl flex-col rounded-2xl"
        contentClassName="flex min-h-0 flex-1 flex-col"
      >
        {(() => {
          const assigningShipment = shipmentQueries.find(
            (sq, idx) => bids[idx]?.id === assigningBid?.id
          )?.data;

          return (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <span className="block text-[10px] font-bold tracking-[0.16em] text-blue-700">SHIPMENT</span>
                <strong className="mt-1 block text-sm text-slate-900">{assigningShipment?.goodsDescription || "Shipment load"}</strong>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-slate-600">Load size <strong className="text-slate-900">{formatShipmentLoad(assigningShipment) || "Full load"}</strong></span>
                  <span className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-slate-600">Route <strong className="text-slate-900">{assigningShipment?.pickupLocation} <span className="px-1 text-blue-600">→</span> {assigningShipment?.deliveryLocation}</strong></span>
                </div>
              </div>

              {assignError && (
                <Alert tone="danger" title="Assignment rejected">
                  {assignError}
                </Alert>
              )}

              {activePlansQuery.isPending ? (
                <div className="grid gap-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : activePlans.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
                  <p className="m-0 text-sm font-semibold text-amber-900">No active journey plans available</p>
                  <p className="mb-0 mt-1 text-xs text-amber-700">
                    Create a new journey plan with available capacity first.
                  </p>
                  <Link
                    className="mt-3 inline-flex min-h-8 items-center justify-center rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-blue-800"
                    to="/transporter/journey-plans"
                  >
                    Go to Journey Plans
                  </Link>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                  <p className="m-0 text-sm font-semibold text-slate-700">
                    Select a suitable journey plan for this delivery:
                  </p>
                  {activePlans.map((plan) => {
                    const isSmallLoad = assigningShipment?.loadSize === 'SMALL_LOAD';
                    const maxWeight = Number(plan.maxWeightKg || 10000);
                    const allocatedWeight = Number(plan.allocatedWeightKg || 0);
                    const requiredWeightKg = isSmallLoad
                      ? Number(assigningShipment?.weightKg || 0)
                      : maxWeight * getLoadFraction(assigningShipment?.loadSize);
                    const capacityPercent = maxWeight > 0
                      ? Math.min(100, Math.round((allocatedWeight / maxWeight) * 100))
                      : plan.allocatedLoadFraction != null
                        ? Math.min(100, Math.round(Number(plan.allocatedLoadFraction) * 100))
                        : 0;
                    const remainingPercent = Math.max(0, 100 - capacityPercent);
                    const remainingWeight = Math.max(0, maxWeight - allocatedWeight);

                    // Capacity remaining is strictly calculated for mass
                    const fitsWeight = Number.isFinite(requiredWeightKg)
                      && requiredWeightKg > 0
                      && remainingWeight + 0.01 >= requiredWeightKg;
                    const fitsPlanStatus = plan.status === "ACTIVE";
                    const isEligible = fitsWeight && fitsPlanStatus;

                    return (
                      <label
                        key={plan.id}
                        aria-disabled={!isEligible}
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-sm transition-colors ${
                          !isEligible
                            ? "cursor-not-allowed border-slate-200 bg-slate-50"
                            : selectedPlanId === plan.id
                            ? "cursor-pointer border-2 border-blue-600 bg-blue-50/70"
                            : "cursor-pointer border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="journeyPlanSelection"
                          value={plan.id}
                          disabled={!isEligible}
                          checked={selectedPlanId === plan.id}
                          onChange={() => setSelectedPlanId(plan.id)}
                          className="sr-only"
                        />
                        <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selectedPlanId === plan.id ? "border-blue-600 bg-blue-600 text-white" : "border-slate-400 bg-white text-transparent"}`} aria-hidden="true">
                          <span className="text-xs font-bold">✓</span>
                        </span>
                        <div className="grid min-w-0 flex-1 gap-2">
                          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                            <div>
                              <strong className="block text-slate-900">
                              {plan.originCity} → {plan.destinationCity}
                              </strong>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] text-slate-500">Full load price</span>
                              <strong className="text-base text-slate-900">{money(plan.fullLoadPrice)}</strong>
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 flex justify-between gap-2 text-[10px] text-slate-500">
                              <span>Load Capacity</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${capacityPercent}%` }} />
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                            <span>Remaining: <strong className="text-slate-700">{Math.max(0, 100 - capacityPercent)}% capacity</strong></span>
                            <span>{plan.assignments?.length ?? plan._count?.assignments ?? 0} assigned loads</span>
                          </div>
                          {!isEligible && (
                            <span className="w-fit rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-semibold text-red-800">
                              {!fitsPlanStatus ? "Plan is inactive" : "Not enough load capacity on this plan"}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="-mx-5 -mb-5 mt-1 flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 max-sm:flex-col-reverse">
                <Button
                  variant="secondary"
                  onClick={() => setAssigningBid(null)}
                  disabled={assignWorking}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmAssignment}
                  disabled={!selectedPlanId || assignWorking}
                >
                  {assignWorking ? (
                    <>
                      <Spinner /> Assigning...
                    </>
                  ) : (
                    "Assign load"
                  )}
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
