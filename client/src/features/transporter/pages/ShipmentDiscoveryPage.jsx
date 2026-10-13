import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Pagination,
  Skeleton,
} from "../../../shared/components/index.js";
import { listAvailableShipments } from "../transporter.api.js";
import { ShipmentMap } from "../components/ShipmentMap.jsx";

const initialFilters = {
  q: "",
  pickupLocation: "",
  deliveryLocation: "",
  goodsType: "",
  pickupDateFrom: "",
  pickupDateTo: "",
};
const dateLabel = (date) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
const fieldClass =
  "grid content-start gap-1.5 text-sm font-medium text-slate-700";

export function ShipmentDiscoveryPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [draft, setDraft] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [view, setView] = useState("list");
  const [filterError, setFilterError] = useState("");
  const query = useQuery({
    queryKey: ["transporter", "discover", filters, page],
    queryFn: () => listAvailableShipments({ ...filters, page, limit: 10 }),
    refetchInterval: 15_000,
  });
  const shipments = query.data?.shipments || [];

  function updateDraft(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }
  function applyFilters(event) {
    event.preventDefault();
    if (
      draft.pickupDateFrom &&
      draft.pickupDateTo &&
      draft.pickupDateFrom > draft.pickupDateTo
    ) {
      setFilterError(
        "The earliest pickup date must be before the latest date.",
      );
      return;
    }
    setFilterError("");
    setFilters(
      Object.fromEntries(Object.entries(draft).filter(([, value]) => value)),
    );
    setPage(1);
  }
  function clearFilters() {
    setDraft(initialFilters);
    setFilters(initialFilters);
    setFilterError("");
    setPage(1);
  }

  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="mb-1 text-xs font-bold tracking-widest text-blue-700">
            MARKETPLACE
          </p>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">
            Find shipments
          </h1>
          <p className="mb-0 mt-2 text-sm text-slate-500">
            Browse published freight listings and make an offer.
          </p>
        </div>
        <Badge tone="brand">
          {query.data?.pagination?.total ?? "—"} available
        </Badge>
      </div>

      <div className="grid grid-cols-3 items-start gap-4 max-lg:grid-cols-1">
        <Card className="grid gap-4 p-4">
          <div>
            <h2 className="m-0 text-base font-semibold text-slate-900">
              Filter shipments
            </h2>
            <p className="mb-0 mt-1 text-sm text-slate-500">
              Find loads that work for your route.
            </p>
          </div>
          {filterError && <Alert tone="danger">{filterError}</Alert>}
          <form className="grid gap-3" onSubmit={applyFilters}>
            <label className={fieldClass}>
              <span>Search</span>
              <Input
                value={draft.q}
                onChange={(event) => updateDraft("q", event.target.value)}
                placeholder="Cargo or requirements"
              />
            </label>
            <label className={fieldClass}>
              <span>Pickup location</span>
              <Input
                value={draft.pickupLocation}
                onChange={(event) =>
                  updateDraft("pickupLocation", event.target.value)
                }
                placeholder="City or area"
              />
            </label>
            <label className={fieldClass}>
              <span>Delivery location</span>
              <Input
                value={draft.deliveryLocation}
                onChange={(event) =>
                  updateDraft("deliveryLocation", event.target.value)
                }
                placeholder="City or area"
              />
            </label>
            <label className={fieldClass}>
              <span>Goods type</span>
              <Input
                value={draft.goodsType}
                onChange={(event) =>
                  updateDraft("goodsType", event.target.value)
                }
                placeholder="e.g. agricultural"
              />
            </label>
            <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
              <label className={`${fieldClass} min-w-0`}>
                <span>Pickup from</span>
                <Input
                  className="min-w-0 max-w-full"
                  type="date"
                  value={draft.pickupDateFrom}
                  onChange={(event) =>
                    updateDraft("pickupDateFrom", event.target.value)
                  }
                />
              </label>
              <label className={`${fieldClass} min-w-0`}>
                <span>Pickup to</span>
                <Input
                  className="min-w-0 max-w-full"
                  type="date"
                  value={draft.pickupDateTo}
                  onChange={(event) =>
                    updateDraft("pickupDateTo", event.target.value)
                  }
                />
              </label>
            </div>
            <div className="grid gap-2 pt-1">
              <Button type="submit">Apply filters</Button>
              <Button variant="ghost" type="button" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </form>
        </Card>

        <section className="grid min-w-0 gap-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="m-0 text-lg font-semibold text-slate-900">
                Available loads
              </h2>
              <p className="mb-0 mt-1 text-sm text-slate-500">
                {query.data?.pagination?.total ?? 0} matching shipments
              </p>
            </div>
            <div className="flex gap-2" aria-label="Shipment results view">
              <Button
                size="sm"
                variant={view === "list" ? "primary" : "secondary"}
                onClick={() => setView("list")}
              >
                List
              </Button>
              <Button
                size="sm"
                variant={view === "map" ? "primary" : "secondary"}
                onClick={() => setView("map")}
              >
                Map
              </Button>
            </div>
          </div>

          {query.isError && (
            <Alert tone="danger" title="Could not load shipments">
              {query.error.message}
            </Alert>
          )}
          {view === "map" && !query.isPending && !query.isError ? (
            <Card className="relative overflow-hidden p-2">
              <ShipmentMap shipments={shipments} />
              {!shipments.some(
                (shipment) =>
                  shipment.pickupLat != null || shipment.deliveryLat != null,
              ) && (
                <p className="mb-1 mt-2 px-2 text-sm text-slate-500">
                  Map pins appear when shippers provide location coordinates.
                </p>
              )}
            </Card>
          ) : query.isPending ? (
            <div className="grid gap-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : query.isError ? null : shipments.length ? (
            <div className="grid gap-3">
              {shipments.map((shipment) => (
                <Card className="grid gap-3 p-4" key={shipment.id}>
                  <div className="flex items-start justify-between gap-4 max-sm:flex-col max-sm:gap-2">
                    <div className="grid justify-items-start gap-2">
                      <Badge tone="brand">{shipment.goodsType}</Badge>
                      <h3 className="m-0 text-base font-semibold text-slate-900">
                        <Link
                          className="text-inherit no-underline hover:text-blue-700"
                          to={`/transporter/shipments/${shipment.id}`}
                        >
                          {shipment.goodsDescription}
                        </Link>
                      </h3>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                      {shipment.weightKg} kg
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                    <span className="font-medium">
                      {shipment.pickupLocation}
                    </span>
                    <span className="text-blue-700" aria-hidden="true">
                      →
                    </span>
                    <span className="font-medium">
                      {shipment.deliveryLocation}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span>Pickup {dateLabel(shipment.pickupDate)}</span>
                      <span>
                        {shipment.specialRequirements
                          ? "Requirements included"
                          : "Standard handling"}
                      </span>
                    </div>
                    <Link
                      className="font-semibold text-blue-700 no-underline hover:text-blue-800"
                      to={`/transporter/shipments/${shipment.id}`}
                    >
                      View details&nbsp;→
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="text-2xl text-slate-400" aria-hidden="true">
                ⌕
              </span>
              <h3 className="m-0 text-base font-semibold text-slate-800">
                No matching shipments
              </h3>
              <p className="m-0 text-sm text-slate-500">
                Try changing the locations, goods type, or pickup date filters.
              </p>
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            </Card>
          )}
          {view === "list" && (
            <Pagination
              page={query.data?.pagination?.page || page}
              pageCount={query.data?.pagination?.totalPages || 1}
              onPageChange={setPage}
            />
          )}
        </section>
      </div>
    </div>
  );
}
