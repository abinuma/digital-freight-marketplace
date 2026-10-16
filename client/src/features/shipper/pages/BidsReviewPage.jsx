import { Link } from "react-router-dom";
import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Card,
  Pagination,
  Skeleton,
} from "../../../shared/components/index.js";
import { getUserProfile, listShipmentBids, listShipments } from "../shipper.api.js";
import { dateLabel, money, shipmentTones } from "../../shipments/shipmentFormatters.js";

const bidTones = { PENDING: "warning", ACCEPTED: "success", DECLINED: "danger" };

export function BidsReviewPage() {
  const [page, setPage] = useState(1);
  const shipmentsQuery = useQuery({
    queryKey: ["shipper", "bidsReviewShipments", page],
    queryFn: () => listShipments({ page, limit: 10 }),
    refetchInterval: 15_000,
  });
  const shipments = shipmentsQuery.data?.shipments || [];
  const shipmentsWithBids = shipments.filter((shipment) => shipment.bidCount > 0);
  const bidQueries = useQueries({
    queries: shipmentsWithBids.map((shipment) => ({
      queryKey: ["shipper", "bids", shipment.id],
      queryFn: () => listShipmentBids(shipment.id),
      refetchInterval: 15_000,
    })),
  });
  const allBids = bidQueries.flatMap((query) => query.data || []);
  const transporterIds = [...new Set(allBids.map((bid) => bid.transporterId))];
  const profileQueries = useQueries({
    queries: transporterIds.map((id) => ({
      queryKey: ["users", "publicProfile", id],
      queryFn: () => getUserProfile(id),
      staleTime: 5 * 60_000,
    })),
  });
  const profiles = new Map(
    transporterIds.map((id, index) => [id, profileQueries[index]?.data]),
  );

  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <header>
        <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">
          Review bids
        </h1>
        <p className="mb-0 mt-2 text-sm text-slate-500">
          Compare transporter offers for each shipment.
        </p>
      </header>

      {shipmentsQuery.isError && (
        <Alert tone="danger" title="Could not load shipment bids">
          {shipmentsQuery.error.message}
        </Alert>
      )}

      {shipmentsQuery.isPending ? (
        <div className="grid gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : shipmentsQuery.isError ? null : shipmentsWithBids.length ? (
        <div className="grid gap-4">
          {shipmentsWithBids.map((shipment, index) => {
            const bidsQuery = bidQueries[index];
            const bids = bidsQuery.data || [];
            return (
              <Card className="grid gap-4 p-5" key={shipment.id}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="m-0 text-base font-semibold text-slate-900">
                        {shipment.goodsDescription}
                      </h2>
                      <Badge tone={shipmentTones[shipment.status]}>
                        {shipment.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="m-0 text-sm text-slate-600">
                      {shipment.pickupLocation} <span className="px-1 text-blue-700">→</span> {shipment.deliveryLocation}
                    </p>
                    <p className="m-0 text-xs text-slate-500">
                      {shipment.goodsType} · {Number(shipment.weightKg).toLocaleString()} kg · Pickup {dateLabel(shipment.pickupDate)}
                    </p>
                  </div>
                  <Link
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-blue-700 no-underline hover:bg-slate-50"
                    to={`/shipper/shipments/${shipment.id}`}
                  >
                    Manage shipment
                  </Link>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <h3 className="m-0 text-sm font-semibold text-slate-800">Transporter bids</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    {shipment.bidCount}
                  </span>
                </div>

                {bidsQuery.isPending ? (
                  <div className="grid gap-2"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
                ) : bidsQuery.isError ? (
                  <Alert tone="danger" title="Could not load bids">{bidsQuery.error.message}</Alert>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {bids.map((bid) => {
                      const profile = profiles.get(bid.transporterId);
                      return (
                        <article className="grid gap-2 rounded-lg border border-slate-200 p-4" key={bid.id}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <strong className="text-sm text-slate-900">{profile?.name || "Transporter"}</strong>
                              <p className="mb-0 mt-1 text-xs text-slate-500">
                                {profile?.averageRating
                                  ? `★ ${Number(profile.averageRating).toFixed(1)} (${profile.reviewCount} reviews)`
                                  : profile ? "No ratings yet" : "Loading transporter profile…"}
                              </p>
                            </div>
                            <Badge tone={bidTones[bid.status] || "neutral"}>{bid.status}</Badge>
                          </div>
                          <strong className="text-lg text-slate-900">{money(bid.price)}</strong>
                          <p className="m-0 text-xs text-slate-500">Pickup offered {dateLabel(bid.pickupDate)}</p>
                          {bid.message && <p className="m-0 whitespace-pre-wrap text-sm text-slate-600">{bid.message}</p>}
                        </article>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : shipments.length ? (
        <Card className="grid justify-items-center gap-2 px-4 py-8 text-center">
          <h2 className="m-0 text-base font-semibold text-slate-800">No bids on these shipments</h2>
          <p className="m-0 text-sm text-slate-500">Check another page of your shipments for transporter offers.</p>
        </Card>
      ) : (
        <Card className="grid justify-items-center gap-2 px-4 py-10 text-center">
          <h2 className="m-0 text-base font-semibold text-slate-800">No bids to review yet</h2>
          <p className="m-0 text-sm text-slate-500">Transporter offers will appear here when they bid on your shipments.</p>
          <Link className="mt-2 font-semibold text-blue-700 no-underline hover:text-blue-800" to="/shipper/shipments">
            View shipments →
          </Link>
        </Card>
      )}
      {!shipmentsQuery.isError && shipments.length > 0 && (
        <Pagination
          page={shipmentsQuery.data?.pagination?.page || page}
          pageCount={shipmentsQuery.data?.pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
