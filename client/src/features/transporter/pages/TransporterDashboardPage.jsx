import { Link } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Card,
  Skeleton,
  useSuccessToast,
} from "../../../shared/components/index.js";
import { listAvailableShipments, listMyBids } from "../transporter.api.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { setLoadAvailability } from "../../profile/profile.api.js";

const metrics = [
  {
    key: "PENDING",
    title: "Pending bids",
    stage: "Pending",
    marker: "bg-teal-400",
  },
  {
    key: "ACCEPTED",
    title: "Accepted bids",
    stage: "Accepted",
    marker: "bg-cyan-400",
  },
  {
    key: "DECLINED",
    title: "Declined bids",
    stage: "Closed",
    marker: "bg-blue-400",
  },
  {
    key: "AVAILABLE",
    title: "Available shipments",
    stage: "Available",
    marker: "border-2 border-slate-500 bg-slate-900",
  },
];

export function TransporterDashboardPage() {
  const { user, refreshUser } = useAuth();
  const showSuccess = useSuccessToast();
  const cache = useQueryClient();
  const availabilityMutation = useMutation({
    mutationFn: (lookingForLoads) => setLoadAvailability(user.id, lookingForLoads),
    onSuccess: async (availability) => {
      await Promise.all([refreshUser(), cache.invalidateQueries({ queryKey: ["transporter"] })]);
      showSuccess(availability.lookingForLoads ? 'Availability enabled' : 'Availability disabled');
    },
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
  const invitesQuery = useQuery({
    queryKey: ["transporter", "directInvites"],
    queryFn: () => listAvailableShipments({ invitedOnly: "true", limit: 5 }),
    refetchInterval: 15_000,
  });
  const invites = invitesQuery.data?.shipments ?? [];
  const invitesCount = invitesQuery.data?.pagination?.total ?? invites.length;
  const error = results.find((query) => query.isError) || (invitesQuery.isError ? invitesQuery : null);

  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">Dashboard</h1>
          <p className="mb-0 mt-1 text-sm text-slate-500">Keep track of your offers and find your next delivery.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-2">
          <span id="load-availability-label" className="text-sm font-medium text-slate-800">I’m available right now</span>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(user.lookingForLoads)}
            aria-labelledby="load-availability-label"
            aria-busy={availabilityMutation.isPending}
            disabled={availabilityMutation.isPending}
            onClick={() => availabilityMutation.mutate(!user.lookingForLoads)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-0 p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${user.lookingForLoads ? "bg-emerald-600" : "bg-slate-300"}`}
          >
            <span aria-hidden="true" className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${user.lookingForLoads ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {availabilityMutation.isError && <Alert tone="danger">{availabilityMutation.error.message}</Alert>}

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
        {metrics.map(({ key, title, stage, marker }, index) => (
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

      <section aria-labelledby="direct-invites-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="direct-invites-heading" className="m-0 text-lg font-bold text-slate-900">
                Direct load invitations
              </h2>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                {invitesCount} {invitesCount === 1 ? 'invite' : 'invites'}
              </span>
            </div>
            <p className="m-0 mt-1 text-xs text-slate-500">Exclusive loads sent directly to you by shippers.</p>
          </div>
          {invitesCount > 0 && (
            <Link
              to="/transporter/shipments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline"
            >
              Browse all loads &rarr;
            </Link>
          )}
        </div>

        {invitesQuery.isPending ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : invites.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {invites.map((shipment) => (
              <div
                key={shipment.id}
                className="flex min-w-0 flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800">★ Direct invite for you</span>
                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="min-w-0">
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">From</span>
                      <strong className="block truncate text-sm text-slate-900">{shipment.pickupLocation}</strong>
                    </div>
                    <span className="text-xl leading-none text-blue-500" aria-hidden="true">→</span>
                    <div className="min-w-0">
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">To</span>
                      <strong className="block truncate text-sm text-slate-900">{shipment.deliveryLocation}</strong>
                    </div>
                  </div>
                  {shipment.specialRequirements && (
                    <p className="mb-0 mt-2 line-clamp-2 text-xs text-slate-500">{shipment.specialRequirements}</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <span className="text-sm font-semibold text-slate-900">{Number(shipment.weightKg)?.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span></span>
                  <Link
                    to={`/transporter/shipments/${shipment.id}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white no-underline transition-colors hover:bg-blue-700"
                  >
                    Review & place bid
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-dashed border-slate-200 bg-slate-50/60 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <svg className="h-5 w-5 fill-none stroke-current" strokeWidth="1.75" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <p className="m-0 text-sm font-semibold text-slate-800">
                  No pending direct invitations
                </p>
                <p className="m-0 mt-0.5 text-xs text-slate-500">
                  When shippers select your profile from the directory and send you loads, they'll appear here for quick review.
                </p>
              </div>
            </div>
            <div className="shrink-0 text-xs font-medium text-slate-500">
              {user.lookingForLoads ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Availability is ON
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                  Availability is OFF
                </span>
              )}
            </div>
          </Card>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="relative flex min-h-48 flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-6 text-white">
          <div className="relative z-10">
            <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-blue-200">
              ETHIOFREIGHT MARKETPLACE
            </p>
            <h2 className="m-0 text-lg font-semibold text-white">
              Find a load that fits your route.
            </h2>
            <p className="mb-0 mt-2 max-w-xs text-xs leading-5 text-blue-100">
              Browse current postings and send a clear offer to the shipper.
            </p>
          </div>
          <Link
            className="relative z-10 inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg bg-white px-4 py-2 text-xs font-semibold text-blue-900 no-underline transition-colors hover:bg-blue-50"
            to="/transporter/shipments"
          >
            Explore shipments&nbsp;↗
          </Link>
          <div className="pointer-events-none absolute -bottom-8 right-0 h-20 w-40 rounded-[50%] border-2 border-dashed border-blue-300/40" aria-hidden="true" />
        </Card>

        <Card className="flex min-h-48 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.16em] text-blue-700">
              TRIP AVAILABILITY
            </p>
            <h2 className="m-0 text-lg font-semibold text-slate-900">
              Schedule your journey plans.
            </h2>
            <p className="mb-0 mt-2 max-w-sm text-xs leading-5 text-slate-600">
              List origin & destination cities, full load price, and manage capacity per trip.
            </p>
            <Link
              className="mt-4 inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white no-underline transition-colors hover:bg-blue-700"
              to="/transporter/journey-plans"
            >
              Manage journey plans&nbsp;→
            </Link>
          </div>
          <div className="hidden h-16 w-20 shrink-0 rounded-xl bg-blue-50 p-2 sm:grid sm:grid-cols-3 sm:grid-rows-2 sm:gap-1" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => <span key={index} className={`rounded-sm ${index === 4 ? 'bg-blue-600' : 'bg-blue-200'}`} />)}
          </div>
        </Card>
      </div>

    </div>
  );
}
