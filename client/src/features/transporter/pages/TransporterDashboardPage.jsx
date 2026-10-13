import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Card,
  Skeleton,
} from "../../../shared/components/index.js";
import { listAvailableShipments, listMyBids } from "../transporter.api.js";
import { listNotifications } from "../../notifications/notifications.api.js";

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

const notificationDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

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
      {
        queryKey: ["notifications", "recent"],
        queryFn: () => listNotifications({ limit: 12 }),
        refetchInterval: 15_000,
      },
    ],
  });
  const error = results.find((query) => query.isError);
  const messages = (results[4].data?.notifications || [])
    .filter((notification) => notification.type === "NEW_MESSAGE")
    .slice(0, 5);

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

      <section className="grid grid-cols-3 items-start gap-4 max-lg:grid-cols-1">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 max-sm:items-start">
            <div>
              <h2 className="m-0 text-base font-semibold text-slate-900">
                Recent messages
              </h2>
              <p className="mb-0 mt-1 text-xs text-slate-500">
                Updates from your shipment conversations.
              </p>
            </div>
            <Link
              className="shrink-0 text-sm font-semibold text-blue-700 no-underline hover:text-blue-800"
              to="/transporter/messages"
            >
              View messages&nbsp;↗
            </Link>
          </div>
          {results[4].isPending ? (
            <div className="grid gap-3 p-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : messages.length ? (
            <div>
              {messages.map((message) => (
                <Link
                  className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 no-underline hover:bg-slate-50 ${message.read ? "text-slate-600" : "bg-blue-50 text-slate-800"}`}
                  to={`/transporter/messages?conversationId=${message.referenceId}`}
                  key={message.id}
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-sm text-blue-700"
                    aria-hidden="true"
                  >
                    ✉
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <strong className="truncate text-sm">
                      {message.title}
                    </strong>
                    <span className="truncate text-xs text-slate-500">
                      {message.message}
                    </span>
                  </span>
                  <time className="shrink-0 text-xs text-slate-400">
                    {notificationDate(message.createdAt)}
                  </time>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="text-2xl text-slate-400" aria-hidden="true">
                ✉
              </span>
              <h3 className="m-0 text-base font-semibold text-slate-800">
                No recent messages
              </h3>
              <p className="m-0 text-sm text-slate-500">
                Messages about your bids will show up here.
              </p>
            </div>
          )}
        </Card>

        <Card className="grid gap-4 bg-slate-900 p-5 text-white">
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-blue-200">
              ETHIOFREIGHT
            </p>
            <h2 className="m-0 text-lg font-semibold">
              Find a load that fits your route.
            </h2>
            <p className="mb-0 mt-2 text-sm text-slate-300">
              Browse current postings and send a clear offer to the shipper.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 no-underline hover:bg-slate-100"
            to="/transporter/shipments"
          >
            Explore shipments&nbsp;↗
          </Link>
        </Card>
      </section>

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
