import { useState } from "react";
import { Link } from "react-router-dom";
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
} from "../../../shared/components/index.js";
import { getShipment, listMyBids, withdrawBid } from "../transporter.api.js";

const statuses = ["PENDING", "ACCEPTED", "DECLINED", "WITHDRAWN"];
const tones = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  WITHDRAWN: "neutral",
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
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedBid, setSelectedBid] = useState(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["transporter", "myBids", status, page],
    queryFn: () => listMyBids({ status: status || undefined, page, limit: 10 }),
    refetchInterval: 15_000,
  });
  const bids = query.data?.bids || [];
  const shipmentQueries = useQueries({
    queries: bids.map((bid) => ({
      queryKey: ["transporter", "bidShipment", bid.shipmentId],
      queryFn: () => getShipment(bid.shipmentId),
      staleTime: 60_000,
    })),
  });

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
          <p className="mb-1 text-xs font-bold tracking-widest text-blue-700">
            YOUR OFFERS
          </p>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">
            My bids
          </h1>
          <p className="mb-0 mt-2 text-sm text-slate-500">
            Review the offers you’ve sent to shippers.
          </p>
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
            return (
              <Card className="grid gap-4 p-4" key={bid.id}>
                <div className="flex items-start justify-between gap-4 max-sm:flex-col max-sm:gap-2">
                  <div className="grid justify-items-start gap-2">
                    <Badge tone={tones[bid.status]}>{bid.status}</Badge>
                    <h2 className="m-0 text-base font-semibold text-slate-900">
                      {shipment?.goodsDescription ||
                        (shipmentUnavailable
                          ? "Shipment unavailable"
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
                    {shipment?.pickupLocation || "Pickup location"}
                  </span>
                  <span className="text-blue-700" aria-hidden="true">
                    →
                  </span>
                  <span className="font-medium">
                    {shipment?.deliveryLocation || "Delivery location"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                    <span>Offer sent {dateLabel(bid.createdAt)}</span>
                    <span>Pickup offered {dateLabel(bid.pickupDate)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 no-underline hover:bg-slate-50"
                      to={`/transporter/shipments/${bid.shipmentId}`}
                    >
                      View shipment
                    </Link>
                    {bid.status === "PENDING" && (
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
    </div>
  );
}
