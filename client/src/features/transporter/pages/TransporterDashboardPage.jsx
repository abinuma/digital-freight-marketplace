import { Link } from "react-router-dom";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Card,
  Skeleton,
} from "../../../shared/components/index.js";
import { listAvailableShipments, listMyBids } from "../transporter.api.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { setLoadAvailability } from "../../profile/profile.api.js";

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
  const { user, refreshUser } = useAuth();
  const cache = useQueryClient();
  const availabilityMutation = useMutation({
    mutationFn: (lookingForLoads) => setLoadAvailability(user.id, lookingForLoads),
    onSuccess: async () => { await Promise.all([refreshUser(), cache.invalidateQueries({ queryKey: ["transporter"] })]); },
  });
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

      <Card className="flex flex-wrap items-center justify-between gap-4 border border-emerald-200 bg-emerald-50/70 p-5">
        <div>
          <p className="m-0 text-xs font-bold tracking-widest text-emerald-800">LOAD AVAILABILITY</p>
          <h2 className="mb-0 mt-1 text-lg font-semibold text-slate-900">
            {user.lookingForLoads ? "You’re visible to shippers" : "Looking for a load right now?"}
          </h2>
          <p className="mb-0 mt-1 text-sm text-slate-600">
            {user.lookingForLoads ? "Shippers can find you in your city." : "Turn this on when you’re ready to take a load."}
          </p>
          {availabilityMutation.isError && <p className="mb-0 mt-2 text-sm text-red-700">{availabilityMutation.error.message}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(user.lookingForLoads)}
          disabled={availabilityMutation.isPending}
          onClick={() => availabilityMutation.mutate(!user.lookingForLoads)}
          className={`inline-flex min-h-10 items-center rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${user.lookingForLoads ? "bg-emerald-700 hover:bg-emerald-800" : "bg-slate-900 hover:bg-slate-800"}`}
        >
          {availabilityMutation.isPending ? "Updating…" : user.lookingForLoads ? "Available now · Turn off" : "I’m available now"}
        </button>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="flex flex-col items-start justify-between gap-4 bg-slate-900 p-6 text-white rounded-xl">
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-blue-200">
              ETHIOFREIGHT MARKETPLACE
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

        <Card className="flex flex-col items-start justify-between gap-4 border border-blue-100 bg-blue-50/60 p-6 rounded-xl">
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-blue-700">
              TRIP AVAILABILITY
            </p>
            <h2 className="m-0 text-lg font-semibold text-slate-900">
              Schedule your journey plans.
            </h2>
            <p className="mb-0 mt-2 text-sm text-slate-600">
              List origin & destination cities, full load price, and manage capacity per trip.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-blue-800 transition-colors"
            to="/transporter/journey-plans"
          >
            Manage journey plans&nbsp;→
          </Link>
        </Card>
      </div>

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
