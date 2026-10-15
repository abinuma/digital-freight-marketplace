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
    stage: "Pending",
    marker: "bg-teal-400",
  },
  {
    key: "ACCEPTED",
    title: "Accepted bids",
    subtitle: "Ready or underway",
    stage: "Accepted",
    marker: "bg-cyan-400",
  },
  {
    key: "DECLINED",
    title: "Declined bids",
    subtitle: "Offers that have closed",
    stage: "Closed",
    marker: "bg-blue-400",
  },
  {
    key: "AVAILABLE",
    title: "Available shipments",
    subtitle: "Open listings to bid on",
    stage: "Available",
    marker: "border-2 border-slate-500 bg-slate-900",
  },
];

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
        className="relative overflow-hidden rounded-xl bg-slate-900 px-6 py-5 pb-16 text-white shadow-sm max-sm:px-4"
        aria-label="Bid and shipment summary"
      >
        <div className="mb-6">
          <p className="m-0 text-xs font-bold tracking-[0.16em] text-sky-200">YOUR FREIGHT PIPELINE</p>
        </div>
        <div className="relative grid grid-cols-4 gap-4 max-sm:grid-cols-2 max-sm:gap-y-6">
          <div className="absolute left-[12.5%] right-[12.5%] top-[7px] border-t border-dashed border-slate-600 max-sm:hidden" aria-hidden="true" />
          {metrics.map(({ key, title, subtitle, stage, marker }, index) => (
            <div className="relative min-w-0" key={key}>
              <div className="mb-4 flex h-4 items-center max-sm:mb-2">
                <span className={`z-10 h-3.5 w-3.5 rounded-full ${marker}`} aria-hidden="true" />
              </div>
              {results[index].isPending ? <Skeleton className="h-9 w-12 bg-slate-700" /> : (
                <strong className="block text-4xl font-semibold leading-none tracking-tight text-white">
                  {results[index].data?.pagination?.total ?? 0}
                </strong>
              )}
              <p className="mb-0 mt-2 text-sm font-semibold text-white">{title}</p>
              <p className="mb-0 mt-0.5 text-xs text-slate-300">{subtitle}</p>
              <span className="sr-only">Pipeline stage: {stage}</span>
            </div>
          ))}
        </div>
        <Link
          className="absolute bottom-4 right-6 inline-flex min-h-9 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-blue-600 max-sm:right-4"
          to="/transporter/bids"
        >
          Review bids
        </Link>
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
