import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Pagination,
  Skeleton,
} from "../../../shared/components/index.js";
import { PreviewableImage } from "../../../shared/components/PreviewableImage.jsx";
import { CityLocationPicker } from "../../profile/components/CityLocationPicker.jsx";
import { listAvailableShipments } from "../transporter.api.js";
import { LOAD_SIZE_OPTIONS, formatLoadSize, formatShipmentLoad } from "../../../shared/constants/loadSizes.js";

const initialFilters = {
  pickupLocation: "",
  deliveryLocation: "",
  loadSize: [],
};

const dateLabel = (date) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

export function ShipmentDiscoveryPage() {
  const [filters, setFilters] = useState({});
  const [draft, setDraft] = useState(initialFilters);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const activeFilters = Object.fromEntries(
        Object.entries(draft).flatMap(([key, value]) => {
          if (Array.isArray(value)) return value.length ? [[key, value.join(",")]] : [];
          return value ? [[key, value]] : [];
        }),
      );
      setFilters(activeFilters);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [draft]);

  const query = useQuery({
    queryKey: ["transporter", "discover", filters, page],
    queryFn: () => listAvailableShipments({ ...filters, page, limit: 10 }),
    refetchInterval: 15_000,
  });

  const shipments = query.data?.shipments || [];

  function updateDraft(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setDraft(initialFilters);
    setFilters({});
    setPage(1);
  }

  return (
    <main className="mx-auto w-full max-w-6xl py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold tracking-widest text-blue-700">
            MARKETPLACE
          </p>
          <h1 className="m-0 text-3xl font-extrabold tracking-tight text-slate-900">
            Find shipments
          </h1>
          <p className="mb-0 mt-1.5 text-sm text-slate-500">
            Browse published freight listings and make an offer.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-2.5 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
            </div>
            <div>
              <p className="m-0 text-sm font-bold text-slate-900">
                {query.data?.pagination?.total ?? 0} available
              </p>
              <p className="m-0 text-xs text-slate-500">
                New loads match your route
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center h-20 w-60 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 p-1.5 overflow-hidden shadow-xs shrink-0 relative">
            <div className="absolute top-2 right-4 w-7 h-7 rounded-full bg-amber-300/80 blur-[1px]" />
            <div className="absolute top-4 right-8 w-12 h-3 rounded-full bg-white/40 blur-[0.5px]" />
            <svg
              viewBox="0 0 160 60"
              className="w-full h-full object-cover"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 38 Q30 24 65 34 T130 28 T160 36 V60 H0 Z" fill="#3B82F6" opacity="0.6" />
              <path d="M10 40 Q50 30 90 38 T160 34 V60 H0 Z" fill="#2563EB" opacity="0.8" />
              <path d="M20 60 L70 36 H90 L140 60 Z" fill="#334155" />
              <line x1="80" y1="38" x2="80" y2="44" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="80" y1="46" x2="80" y2="56" stroke="#FDE047" strokeWidth="2.5" strokeDasharray="4 4" />
              <g transform="translate(68, 30) scale(0.32)">
                <rect x="0" y="5" width="55" height="30" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
                <line x1="18" y1="5" x2="18" y2="35" stroke="#E2E8F0" strokeWidth="1.5" />
                <line x1="36" y1="5" x2="36" y2="35" stroke="#E2E8F0" strokeWidth="1.5" />
                <path d="M55 12 H70 C73 12 76 14 78 18 L82 25 C83 27 84 29 84 31 V37 H55 V12 Z" fill="#2563EB" />
                <path d="M58 15 H68 C70 15 71 16 72 19 L75 25 H58 V15 Z" fill="#93C5FD" />
                <rect x="4" y="37" width="78" height="3" fill="#1E293B" />
                <circle cx="16" cy="40" r="6" fill="#1E293B" />
                <circle cx="16" cy="40" r="2.5" fill="#94A3B8" />
                <circle cx="44" cy="40" r="6" fill="#1E293B" />
                <circle cx="44" cy="40" r="2.5" fill="#94A3B8" />
                <circle cx="72" cy="40" r="6" fill="#1E293B" />
                <circle cx="72" cy="40" r="2.5" fill="#94A3B8" />
              </g>
            </svg>
          </div>
        </div>
      </header>

      {/* Filter shipments card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <img src="/sliders-solid-full.svg" alt="" aria-hidden="true" className="w-5 h-5" />
          </div>
          <div>
            <h2 className="m-0 text-base font-bold text-slate-900">Filter shipments</h2>
            <p className="m-0 text-xs text-slate-500">Find loads that work for your route.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CityLocationPicker
              id="transporter-pickup-city-filter"
              label="Pickup location"
              placeholder="Type or select a city..."
              city={draft.pickupLocation}
              className=""
              onChange={({ city }) => updateDraft("pickupLocation", city)}
            />

            <CityLocationPicker
              id="transporter-delivery-city-filter"
              label="Delivery location"
              placeholder="Type or select a city..."
              city={draft.deliveryLocation}
              className=""
              onChange={({ city }) => updateDraft("deliveryLocation", city)}
            />

            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-1.5 block text-xs font-bold text-slate-800">Load size</legend>
              <div className="flex flex-wrap gap-2">
                {LOAD_SIZE_OPTIONS.map((option) => {
                  const selected = draft.loadSize.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => updateDraft(
                        "loadSize",
                        selected
                          ? draft.loadSize.filter((value) => value !== option.value)
                          : [...draft.loadSize, option.value],
                      )}
                      className={`min-h-10 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${selected ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500 bg-white hover:bg-blue-50 text-blue-600 text-xs font-semibold px-5 py-2.5 shadow-xs transition-colors cursor-pointer"
            >
              <img src="/rotate-left-solid-full.svg" alt="" aria-hidden="true" className="w-3.5 h-3.5" />
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {/* Available loads section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
            </div>
            <div>
              <h2 className="m-0 text-lg font-bold text-slate-900">Available loads</h2>
              <p className="m-0 text-xs text-slate-500">
                {query.data?.pagination?.total ?? 0} matching shipments
              </p>
            </div>
          </div>

        </div>

        {query.isError && (
          <Alert tone="danger" title="Could not load shipments">
            {query.error.message}
          </Alert>
        )}

        {query.isPending ? (
          <div className="grid gap-3">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : query.isError ? null : shipments.length ? (
          <div className="grid gap-3.5">
            {shipments.map((shipment) => (
              <div
                key={shipment.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row items-stretch md:items-center gap-5"
              >
                {/* Left: Image / placeholder */}
                <div className="relative h-36 w-full md:w-56 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-100 via-teal-50 to-blue-50 border border-slate-100">
                  {shipment.images?.[0]?.url || shipment.photoUrl ? (
                    <PreviewableImage
                      src={shipment.images?.[0]?.url || shipment.photoUrl}
                      alt={shipment.goodsDescription}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                      <svg
                        className="h-10 w-10 text-slate-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Goods category badge */}
                  <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
                    <span>{shipment.goodsType}</span>
                  </div>
                </div>

                {/* Middle: Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="m-0 text-base font-bold text-slate-900">
                      {shipment.goodsDescription}
                    </h3>
                    {shipment.isDirectInvite && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                        ★ Direct invite for you
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                    <img src="/truck-ramp-box-solid-full.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0 opacity-50" />
                    <span>{formatShipmentLoad(shipment) || (shipment.weightKg ? `${shipment.weightKg} kg` : "")}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                      <img src="/location-dot-solid-full.svg" alt="" aria-hidden="true" className="w-4 h-4 shrink-0 opacity-50" />
                    <span className="truncate">
                      {shipment.pickupLocation} to {shipment.deliveryLocation}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Pickup {dateLabel(shipment.pickupDate)}</span>
                    </div>

                  </div>
                </div>

                {/* Right: Divider & Button */}
                <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-3 pt-3 md:pt-0 md:pl-4 border-t md:border-t-0 md:border-l border-slate-100 md:self-stretch">
                  <Link
                    to={`/transporter/shipments/${shipment.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-6 py-2.5 shadow-xs transition-colors shrink-0"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white flex flex-col items-center gap-2 px-4 py-12 text-center shadow-xs">
            <img src="/magnifying-glass-solid-full.svg" alt="" aria-hidden="true" className="h-8 w-8 opacity-25" />
            <h3 className="m-0 text-base font-bold text-slate-900">No matching shipments try adjusting filters</h3>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              <img src="/rotate-left-solid-full.svg" alt="" aria-hidden="true" className="w-3.5 h-3.5" />
              Clear filters
            </button>
          </div>
        )}

        <Pagination
          page={query.data?.pagination?.page || page}
          pageCount={query.data?.pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      </section>
    </main>
  );
}
