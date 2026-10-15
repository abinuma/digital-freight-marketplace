import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Card,
  Skeleton,
} from "../../../shared/components/index.js";
import { listAvailableShipments, listMyBids } from "../transporter.api.js";

const metrics = [
  {
    key: "PENDING",
    title: "Pending bids",
    subtitle: "Waiting for shipper response",
    tone: "blue",
    icon: "◷",
  },
  {
    key: "ACCEPTED",
    title: "Accepted bids",
    subtitle: "Ready or underway",
    tone: "green",
    icon: "✓",
  },
  {
    key: "DECLINED",
    title: "Declined bids",
    subtitle: "Offers that have closed",
    tone: "amber",
    icon: "↗",
  },
  {
    key: "AVAILABLE",
    title: "Available shipments",
    subtitle: "Open listings to bid on",
    tone: "purple",
    icon: "⌕",
  },
];

const metricTones = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  purple: "bg-purple-50 text-purple-700",
};

export function TransporterDashboardPage() {
  const results = useQueries({
    queries: [
      ...metrics.slice(0, 3).map(({ key }) => ({
        queryKey: ["transporter", "bidCount", key],
        queryFn: () => listMyBids({ status: key, limit: 1 }),
        refetchInterval: 15_000,
      })),
      {
        queryKey: ["transporter", "availableCount"],
        queryFn: () => listAvailableShipments({ limit: 1 }),
        refetchInterval: 15_000,
      },
    ],
  });
  const error = results.find((query) => query.isError);

  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="mb-1 text-xs font-bold tracking-widest text-blue-700">
            TRANSPORTER WORKSPACE
          </p>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">
            Good to see you
          </h1>
          <p className="mb-0 mt-2 text-sm text-slate-500">
            Keep track of your offers and find your next delivery.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-slate-800"
          to="/transporter/shipments"
        >
          Browse shipments <span aria-hidden="true">↗</span>
        </Link>
      </div>

      {error && (
        <Alert tone="danger" title="Some dashboard information is unavailable">
          {error.error.message}
        </Alert>
      )}

      <section
        className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1"
        aria-label="Bid and shipment summary"
      >
        {metrics.map(({ key, title, subtitle, tone, icon }, index) => (
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
              {results[index].isPending ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <strong className="text-xl font-bold text-slate-900">
                  {results[index].data?.pagination?.total ?? 0}
                </strong>
              )}
              <p className="mb-0 mt-1 text-xs text-slate-500">{subtitle}</p>
            </div>
          </Card>
        ))}
      </section>

      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-slate-900 p-6 text-white rounded-xl">
        <div>
          <p className="mb-2 text-xs font-bold tracking-widest text-blue-200">
            ETHIOFREIGHT
          </p>
          <h2 className="m-0 text-lg font-semibold text-white">
            Find a load that fits your route.
          </h2>
          <p className="mb-0 mt-2 text-sm text-slate-300">
            Browse current postings and send a clear offer to the shipper.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 no-underline hover:bg-slate-100 transition-colors"
          to="/transporter/shipments"
        >
          Explore shipments&nbsp;↗
        </Link>
      </Card>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span>
          <Badge tone="warning">PENDING</Badge> bids need a response
        </span>
        <span>
          <Badge tone="success">ACCEPTED</Badge> bids open shipment messages
        </span>
        <span className="flex items-center gap-2 text-slate-400">
          <span className="text-green-600" aria-hidden="true">
            ●
          </span>{" "}
          Dashboard data updates automatically.
        </span>
      </div>
    </div>
  );
}
