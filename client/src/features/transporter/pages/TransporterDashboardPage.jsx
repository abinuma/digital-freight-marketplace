import { Link } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Card,
  Skeleton,
  useSuccessToast,
} from "../../../shared/components/index.js";
import { listAvailableShipments, listMyBids } from "../transporter.api.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { setLoadAvailability } from "../../profile/profile.api.js";

const dateLabel = (date) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

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
  const showSuccess = useSuccessToast();
  const cache = useQueryClient();
  const availabilityMutation = useMutation({
    mutationFn: (lookingForLoads) => setLoadAvailability(user.id, lookingForLoads),
    onSuccess: async (availability) => {
      await Promise.all([refreshUser(), cache.invalidateQueries({ queryKey: ["transporter"] })]);
      showSuccess(availability.lookingForLoads ? 'Availability turned on' : 'Availability turned off');
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
          aria-label="Available for loads"
          aria-busy={availabilityMutation.isPending}
          disabled={availabilityMutation.isPending}
          onClick={() => availabilityMutation.mutate(!user.lookingForLoads)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-0 p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${user.lookingForLoads ? "bg-emerald-600" : "bg-slate-300"}`}
        >
          <span
            aria-hidden="true"
            className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${user.lookingForLoads ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      </Card>

      <section aria-labelledby="direct-invites-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="direct-invites-heading" className="m-0 text-base font-bold text-slate-900">
                  Direct Load Invitations
                </h2>
                {invitesCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    {invitesCount} {invitesCount === 1 ? 'invite' : 'invites'}
                  </span>
                )}
              </div>
              <p className="m-0 text-xs text-slate-500">
                Exclusive loads sent directly to you by shippers
              </p>
            </div>
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
          <Skeleton className="h-28 rounded-xl" />
        ) : invites.length > 0 ? (
          <div className="grid gap-3">
            {invites.map((shipment) => (
              <div
                key={shipment.id}
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/40 p-4 shadow-xs transition-all hover:border-amber-400 hover:shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                      ★ Direct invite for you
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                      {shipment.goodsType}
                    </span>
                    <span className="text-xs text-slate-500">
                      Pickup {dateLabel(shipment.pickupDate)}
                    </span>
                  </div>

                  <h3 className="m-0 text-base font-bold text-slate-900 truncate">
                    {shipment.goodsDescription}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{shipment.pickupLocation} &rarr; {shipment.deliveryLocation}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path d="M12 3a4 4 0 0 0-4 4v1H6a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-2V7a4 4 0 0 0-4-4zm-2 4a2 2 0 1 1 4 0v1h-4V7z" />
                      </svg>
                      <span>{Number(shipment.weightKg)?.toLocaleString()} kg</span>
                    </div>

                    {shipment.specialRequirements && (
                      <span className="text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                        Note: {shipment.specialRequirements}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-amber-100">
                  <Link
                    to={`/transporter/shipments/${shipment.id}`}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-semibold text-white no-underline shadow-xs transition-colors"
                  >
                    Review & place bid &rarr;
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
