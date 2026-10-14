import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Card,
  Skeleton,
} from "../../../shared/components/index.js";
import { getDashboardSummary } from "../shipper.api.js";

const metricCards = [
  {
    key: "activePostings",
    title: "Active postings",
    caption: "Currently open to bids",
    icon: "↗",
    tone: "blue",
  },
  {
    key: "bidsReceived",
    title: "Bids received",
    caption: "Offers from transporters",
    icon: "◇",
    tone: "amber",
  },
  {
    key: "inTransit",
    title: "In transit",
    caption: "Shipments underway",
    icon: "⇢",
    tone: "purple",
  },
  {
    key: "completed",
    title: "Completed deliveries",
    caption: "Successfully delivered",
    icon: "✓",
    tone: "green",
  },
];

const metricTones = {
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  purple: "bg-purple-50 text-purple-700",
  green: "bg-green-50 text-green-700",
};

const statusTones = {
  DRAFT: "neutral",
  PUBLISHED: "brand",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const shortDate = (date) =>
  date
    ? new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(date))
    : "—";

export function ShipperDashboardPage() {
  const query = useQuery({
    queryKey: ["shipper", "dashboard"],
    queryFn: getDashboardSummary,
    refetchInterval: 15_000,
  });
  const summary = query.data;

  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="mb-1 text-xs font-bold tracking-widest text-blue-700">
            SHIPPER WORKSPACE
          </p>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">
            Good to see you
          </h1>
          <p className="mb-0 mt-2 text-sm text-slate-500">
            Here’s what’s happening with your freight today.
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
        <Alert tone="danger" title="Dashboard unavailable">
          {query.error.message}
        </Alert>
      )}

      <section
        className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1"
        aria-label="Shipment summary"
      >
        {metricCards.map(({ key, title, caption, icon, tone }) => (
          <Card className="min-w-0 p-4" key={key}>
            <div className="flex items-start justify-between gap-3">
              <p className="m-0 text-xs font-medium uppercase tracking-wide text-slate-500">
                {title}
              </p>
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${metricTones[tone]}`}
                aria-hidden="true"
              >
                {icon}
              </span>
            </div>
            <div className="mt-3">
              {query.isPending ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <strong className="text-xl font-bold text-slate-900">
                  {summary?.counts?.[key] ?? 0}
                </strong>
              )}
              <p className="mb-0 mt-1 text-xs text-slate-500">{caption}</p>
            </div>
          </Card>
        ))}
      </section>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 max-sm:items-start">
          <div>
            <h2 className="m-0 text-base font-semibold text-slate-900">
              Recent shipments
            </h2>
            <p className="mb-0 mt-1 text-xs text-slate-500">
              Your latest freight activity and bids.
            </p>
          </div>
          <Link
            className="shrink-0 text-sm font-semibold text-blue-700 no-underline hover:text-blue-800"
            to="/shipper/shipments"
          >
            View all shipments&nbsp;↗
          </Link>
        </div>

        {query.isPending ? (
          <div className="grid gap-3 p-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ) : summary?.recentShipments?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-left text-xs">
              <thead className="bg-slate-50 font-medium text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Shipment</th>
                  <th className="px-3 py-3 font-medium">Route</th>
                  <th className="px-3 py-3 font-medium">Pickup date</th>
                  <th className="px-3 py-3 font-medium">Bids</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentShipments.map((shipment) => (
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
                      {shortDate(shipment.pickupDate)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {shipment.bidCount}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={statusTones[shipment.status]}>
                        {shipment.status.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="text-2xl text-slate-400" aria-hidden="true">
              ▤
            </span>
            <h3 className="m-0 text-base font-semibold text-slate-800">
              Your shipment activity starts here
            </h3>
            <p className="m-0 text-sm text-slate-500">
              Post your first shipment to receive offers from transporters.
            </p>
            <Link
              className="mt-2 inline-flex min-h-10 items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-blue-800"
              to="/shipper/shipments/new"
            >
              Post a shipment
            </Link>
          </div>
        )}
      </Card>

      <p className="m-0 flex items-center gap-2 text-xs text-slate-400">
        <span className="text-green-600" aria-hidden="true">
          ●
        </span>{" "}
        Shipment data updates automatically.
      </p>
    </div>
  );
}
