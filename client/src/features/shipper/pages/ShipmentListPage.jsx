import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Card,
  Pagination,
  Select,
  Skeleton,
} from "../../../shared/components/index.js";
import { listShipments } from "../shipper.api.js";

const statuses = [
  "DRAFT",
  "PUBLISHED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];
const tones = {
  DRAFT: "neutral",
  PUBLISHED: "brand",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
};
const formatDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

export function ShipmentListPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["shipper", "shipments", { status, page }],
    queryFn: () =>
      listShipments({ status: status || undefined, page, limit: 10 }),
    refetchInterval: 15_000,
  });
  const shipments = query.data?.shipments || [];

  function changeStatus(event) {
    setStatus(event.target.value);
    setPage(1);
  }

  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="mb-1 text-xs font-bold tracking-widest text-blue-700">
            SHIPMENTS
          </p>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">
            My shipments
          </h1>
          <p className="mb-0 mt-2 text-sm text-slate-500">
            Track and manage the freight you’ve posted.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-slate-800"
          to="/shipper/shipments/new"
        >
          Post a shipment
        </Link>
      </div>

      {query.isError && (
        <Alert tone="danger" title="Could not load shipments">
          {query.error.message}
        </Alert>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 max-sm:flex-col max-sm:items-start">
          <div>
            <h2 className="m-0 text-base font-semibold text-slate-900">
              All shipments
            </h2>
            <p className="mb-0 mt-1 text-xs text-slate-500">
              {query.data?.pagination?.total ?? "—"} shipments
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 max-sm:w-full max-sm:justify-between">
            <span>Status</span>
            <Select
              className="min-h-9 max-w-52"
              value={status}
              onChange={changeStatus}
              aria-label="Filter shipments by status"
            >
              <option value="">All statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item.replace("_", " ")}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {query.isPending ? (
          <div className="grid gap-3 p-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ) : shipments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-left text-xs">
              <thead className="bg-slate-50 font-medium text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Shipment</th>
                  <th className="px-3 py-3 font-medium">Route</th>
                  <th className="px-3 py-3 font-medium">Pickup date</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr className="border-t border-slate-100" key={shipment.id}>
                    <td className="max-w-64 px-3 py-2">
                      <Link
                        className="block truncate font-semibold text-slate-800 no-underline hover:text-blue-700"
                        to={`/shipper/shipments/${shipment.id}`}
                      >
                        {shipment.goodsDescription}
                      </Link>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {shipment.goodsType} · {shipment.weightKg} kg
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      <span className="block max-w-64 truncate">
                        {shipment.pickupLocation}{" "}
                        <span className="px-1 text-blue-700">→</span>{" "}
                        {shipment.deliveryLocation}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                      {formatDate(shipment.pickupDate)}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={tones[shipment.status]}>
                        {shipment.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        className="whitespace-nowrap font-semibold text-blue-700 no-underline hover:text-blue-800"
                        to={`/shipper/shipments/${shipment.id}`}
                      >
                        View&nbsp;→
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : query.isError ? null : (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="text-2xl text-slate-400" aria-hidden="true">
              ▤
            </span>
            <h3 className="m-0 text-base font-semibold text-slate-800">
              {status ? "No shipments match this status" : "No shipments yet"}
            </h3>
            <p className="m-0 text-sm text-slate-500">
              {status
                ? "Choose another status filter to see more shipments."
                : "Create a shipment to begin receiving transporter bids."}
            </p>
            {!status && (
              <Link
                className="mt-2 inline-flex min-h-10 items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-blue-800"
                to="/shipper/shipments/new"
              >
                Post a shipment
              </Link>
            )}
          </div>
        )}

        <Pagination
          className="border-t border-slate-100 px-4 py-3"
          page={query.data?.pagination?.page || page}
          pageCount={query.data?.pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
