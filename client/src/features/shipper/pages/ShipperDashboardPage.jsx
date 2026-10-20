import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Card,
  Skeleton,
  Modal,
  useSuccessToast,
} from "../../../shared/components/index.js";
import { getDashboardSummary } from "../shipper.api.js";
import { listAvailableTransporters, getPublicProfile, updateProfile } from "../../profile/profile.api.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { CityLocationPicker } from "../../profile/components/CityLocationPicker.jsx";
import { UserReviews } from "../../profile/components/UserReviews.jsx";
import { readLastDriverSearchCity, saveLastDriverSearchCity } from "../driverSearchStorage.js";
import { LOAD_CATEGORY_KEYS } from "../../../shared/constants/loadCategories.js";
import { formatLoadSize, formatShipmentLoad } from "../../../shared/constants/loadSizes.js";
import { money } from "../../shipments/shipmentFormatters.js";

const metricCards = [
  {
    key: "activePostings",
    title: "Active postings",
    caption: "Currently open to bids",
    stage: "Posted",
    marker: "bg-teal-400",
  },
  {
    key: "bidsReceived",
    title: "Bids received",
    caption: "Offers from transporters",
    stage: "Bids",
    marker: "bg-cyan-400",
  },
  {
    key: "inTransit",
    title: "In transit",
    caption: "Shipments underway",
    stage: "On the road",
    marker: "bg-blue-400 ring-4 ring-blue-300/20",
  },
  {
    key: "completed",
    title: "Completed deliveries",
    caption: "Successfully delivered",
    stage: "Delivered",
    marker: "border-2 border-slate-500 bg-slate-900",
  },
];
const usualLoadTypes = LOAD_CATEGORY_KEYS;

const statusTones = {
  DRAFT: "neutral",
  PUBLISHED: "brand",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const bidTones = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
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
  const navigate = useNavigate();
  const cache = useQueryClient();
  const { user, refreshUser } = useAuth();
  const showSuccess = useSuccessToast();
  const [city, setCity] = useState(() => user?.city || readLastDriverSearchCity(user?.id));
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [usualLoads, setUsualLoads] = useState(user?.preferredLoadTypes || []);
  const query = useQuery({
    queryKey: ["shipper", "dashboard"],
    queryFn: getDashboardSummary,
    refetchInterval: 15_000,
  });
  const summary = query.data;
  const driversQuery = useQuery({
    queryKey: ["shipper", "availableTransporters", city],
    queryFn: () => listAvailableTransporters(city),
    enabled: Boolean(city),
    refetchInterval: 15_000,
  });
  const driverProfileQuery = useQuery({
    queryKey: ["shipper", "transporterProfile", selectedDriver?.id],
    queryFn: () => getPublicProfile(selectedDriver.id),
    enabled: Boolean(selectedDriver?.id),
  });
  function handleContactInvite(driver) {
    if (!driver) return;
    setSelectedDriver(null);
    const params = new URLSearchParams({
      driverId: driver.id,
      driverName: driver.name || "Driver",
    });
    if (driver.city || city) {
      params.set("city", driver.city || city);
    }
    if (driver.intendedDestination) {
      params.set("destination", driver.intendedDestination);
    }
    if (driver.vehicleType) {
      params.set("vehicleType", driver.vehicleType);
    }

    navigate(`/shipper/shipments/new?${params.toString()}`, {
      state: { invitedDriver: driver },
    });
  }
  const preferencesMutation = useMutation({
    mutationFn: () => updateProfile(user.id, { preferredLoadTypes: usualLoads }),
    onSuccess: async () => {
      await refreshUser();
      showSuccess('Preferences saved');
    },
  });
  const driversList = driversQuery.data || [];
  const displayedDrivers = [...driversList]
    .map((driver) => {
      const matchesLoads = Boolean(
        usualLoads.length &&
        driver.preferredLoadTypes?.some((dl) =>
          usualLoads.some((ul) => ul.toLowerCase() === dl.toLowerCase())
        )
      );
      return { ...driver, matchesLoads };
    })
    .sort((a, b) => {
      if (a.matchesLoads && !b.matchesLoads) return -1;
      if (!a.matchesLoads && b.matchesLoads) return 1;
      return new Date(b.availabilityUpdatedAt || 0) - new Date(a.availabilityUpdatedAt || 0);
    });

  const displayedShipments = (summary?.recentShipments || []).slice(0, 2);
  const displayedBids = (summary?.recentBids || []).slice(0, 2);

  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="mb-0 mt-2 text-sm text-slate-500">
            Here’s what’s happening with your freight today.
          </p>
        </div>
      </div>

      {query.isError && (
        <Alert tone="danger" title="Dashboard unavailable">
          {query.error.message}
        </Alert>
      )}

      <section
        className="relative overflow-hidden rounded-xl bg-slate-900 px-6 py-5 pb-16 text-white shadow-sm max-sm:px-4"
        aria-label="Shipment summary"
      >
        <div className="mb-6">
          <p className="m-0 text-xs font-bold tracking-[0.16em] text-sky-200">YOUR FREIGHT PIPELINE</p>
        </div>
        <div className="relative grid grid-cols-4 gap-4 max-sm:grid-cols-2 max-sm:gap-y-6">
          <div className="absolute left-[12.5%] right-[12.5%] top-[7px] border-t border-dashed border-slate-600 max-sm:hidden" aria-hidden="true" />
          {metricCards.map(({ key, title, caption, stage, marker }) => (
            <div className="relative min-w-0" key={key}>
              <div className="mb-4 flex h-4 items-center max-sm:mb-2">
                <span className={`z-10 h-3.5 w-3.5 rounded-full ${marker}`} aria-hidden="true" />
              </div>
              {query.isPending ? <Skeleton className="h-9 w-12 bg-slate-700" /> : (
                <strong className="block text-4xl font-semibold leading-none tracking-tight text-white">
                  {summary?.counts?.[key] ?? 0}
                </strong>
              )}
              <p className="mb-0 mt-2 text-sm font-semibold text-white">{title}</p>
              <p className="mb-0 mt-0.5 text-xs text-slate-300">{caption}</p>
              <span className="sr-only">Pipeline stage: {stage}</span>
            </div>
          ))}
        </div>
        <Link
          className="absolute bottom-4 right-6 inline-flex min-h-9 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white no-underline transition-colors hover:bg-blue-600 max-sm:right-4"
          to="/shipper/bids"
        >
          Review bids
        </Link>
      </section>

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="m-0 text-xs font-bold tracking-widest text-emerald-700">AVAILABLE DRIVERS in {city || "your selected city"}</h2>
          <div className="w-full max-w-xs">
            <CityLocationPicker
              id="driver-city"
              label={user?.city ? "See drivers in" : "Where is your load?"}
              placeholder="Type or select a city..."
              city={city}
              onChange={({ city: selectedCity }) => {
                setCity(selectedCity);
                saveLastDriverSearchCity(user?.id, selectedCity);
              }}
            />
          </div>
        </div>
        {!city ? (
          <p className="m-0 px-5 py-6 text-sm text-slate-500">Select a city to see available drivers there.</p>
        ) : driversQuery.isPending ? (
          <div className="grid gap-3 p-5"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        ) : driversQuery.isError ? (
          <Alert tone="danger" className="m-4" title="Couldn’t load available drivers">{driversQuery.error.message}</Alert>
        ) : displayedDrivers.length ? (
          <div className="divide-y divide-slate-100">
            {displayedDrivers.map((driver) => (
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" key={driver.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm text-slate-900">{driver.name}</strong>
                    <Badge tone="success">Available now</Badge>
                  </div>
                  {driver.reviewCount > 0 && driver.averageRating != null && (
                    <p className="mb-0 mt-1 text-sm text-slate-600">
                      <span className="text-amber-500" aria-hidden="true">★</span> {Number(driver.averageRating).toFixed(1)} ({driver.reviewCount} {driver.reviewCount === 1 ? "review" : "reviews"})
                    </p>
                  )}
                  <p className="mb-0 mt-1 text-sm text-slate-600">
                    {driver.vehicleType} · {driver.capacityTons ? `${driver.capacityTons} t capacity` : "Capacity pending"}
                  </p>
                  <p className="mb-0 mt-1 text-xs text-slate-500">
                    {driver.intendedDestination ? `Heading to ${driver.intendedDestination}` : "Destination not specified"}
                  </p>
                  <button type="button" className="mt-2 inline-flex w-fit items-center p-0 text-sm font-bold text-blue-700 hover:text-blue-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700" onClick={() => handleContactInvite(driver)}>
                    Invite driver
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="m-0 px-5 py-6 text-sm text-slate-500">No drivers are looking for loads in {city} right now.</p>}
      </Card>

      <Modal open={Boolean(selectedDriver)} onClose={() => setSelectedDriver(null)} title="Transporter profile">
        {selectedDriver ? (
          <div className="grid gap-3">
            {driverProfileQuery.isPending ? (
              <Skeleton className="h-20" />
            ) : driverProfileQuery.isError ? (
              <Alert tone="danger">{driverProfileQuery.error.message}</Alert>
            ) : driverProfileQuery.data ? (
              <div className="grid gap-3">
                <div>
                  <h3 className="m-0 text-base font-semibold text-slate-900">{driverProfileQuery.data.name}</h3>
                  <p className="mb-0 mt-1 text-sm text-slate-600">{driverProfileQuery.data.city || selectedDriver.city}</p>
                  {driverProfileQuery.data.phone && <p className="mb-0 mt-1 text-sm text-slate-600">{driverProfileQuery.data.phone}</p>}
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="m-0">Vehicle: {selectedDriver.vehicleType}</p>
                  <p className="mb-0 mt-1">Capacity: {selectedDriver.capacityTons} tonnes</p>
                </div>
                <button type="button" className="inline-flex w-fit items-center p-0 text-sm font-bold text-blue-700 hover:text-blue-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700" onClick={() => handleContactInvite(selectedDriver)}>
                  Invite driver
                </button>
                <UserReviews userId={selectedDriver.id} averageRating={driverProfileQuery.data.averageRating} reviewCount={driverProfileQuery.data.reviewCount} />
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Shipments Card */}
        <Card className="flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="m-0 text-base font-semibold text-slate-900">
                  Recent shipments
                </h2>
                <p className="mb-0 mt-0.5 text-xs text-slate-500">
                  Your latest freight postings
                </p>
              </div>
              <Link
                to="/shipper/shipments"
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="p-4 sm:p-5">
              {query.isPending ? (
                <div className="grid gap-3">
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                </div>
              ) : displayedShipments.length > 0 ? (
                <div className="grid gap-3">
                  {displayedShipments.map((shipment) => (
                    <Link
                      key={shipment.id}
                      to={`/shipper/shipments/${shipment.id}`}
                      className="group flex flex-col justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 text-inherit no-underline transition-all hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] text-sm font-semibold text-slate-900 group-hover:text-blue-700"
                          title={shipment.goodsDescription}
                        >
                          {shipment.goodsDescription}
                        </span>
                        <Badge tone={statusTones[shipment.status]}>
                          {shipment.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="truncate font-medium text-slate-700">
                          {shipment.pickupLocation}
                        </span>
                        <span className="font-bold text-blue-600" aria-hidden="true">
                          →
                        </span>
                        <span className="truncate font-medium text-slate-700">
                          {shipment.deliveryLocation}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2 text-xs text-slate-500">
                        <span>
                          {shipment.goodsType} · {formatShipmentLoad(shipment) || (shipment.weightKg ? `${shipment.weightKg} kg` : "")}
                        </span>
                        <div className="flex items-center gap-3">
                          <span>Pickup: {shortDate(shipment.pickupDate)}</span>
                          <span
                            className={`font-semibold ${shipment.bidCount > 0 ? "text-blue-700" : "text-slate-400"}`}
                          >
                            {shipment.bidCount} {shipment.bidCount === 1 ? "bid" : "bids"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <span className="text-2xl text-slate-300" aria-hidden="true">
                    ▤
                  </span>
                  <h3 className="m-0 text-sm font-semibold text-slate-800">
                    No shipments yet
                  </h3>
                  <p className="m-0 text-xs text-slate-500">
                    Post your first shipment to receive offers from transporters.
                  </p>
                  <Link
                    to="/shipper/shipments/new"
                    className="mt-2 inline-flex min-h-8 items-center justify-center rounded-md bg-blue-700 px-3 text-xs font-semibold text-white no-underline hover:bg-blue-600"
                  >
                    Post a shipment
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Recent Bids Card */}
        <Card className="flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="m-0 text-base font-semibold text-slate-900">
                  Recent bids
                </h2>
                <p className="mb-0 mt-0.5 text-xs text-slate-500">
                  Latest transporter offers on your freight
                </p>
              </div>
              <Link
                to="/shipper/bids"
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
              >
                Review all
              </Link>
            </div>

            <div className="p-4 sm:p-5">
              {query.isPending ? (
                <div className="grid gap-3">
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                </div>
              ) : displayedBids.length > 0 ? (
                <div className="grid gap-3">
                  {displayedBids.map((bid) => (
                    <Link
                      key={bid.id}
                      to="/shipper/bids"
                      className="group flex flex-col justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 text-inherit no-underline transition-all hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <strong className="block truncate text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                            {bid.transporter?.name || "Transporter"}
                          </strong>
                          {bid.shipment && (
                            <span
                            className="block min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] text-xs text-slate-500"
                              title={bid.shipment.goodsDescription}
                            >
                              for {bid.shipment.goodsDescription}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="block text-sm font-bold text-slate-900">
                            {money(bid.price)}
                          </span>
                          <Badge tone={bidTones[bid.status] || "neutral"}>
                            {bid.status}
                          </Badge>
                        </div>
                      </div>

                      {bid.shipment && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span className="truncate font-medium text-slate-700">
                            {bid.shipment.pickupLocation}
                          </span>
                          <span className="font-bold text-blue-600" aria-hidden="true">
                            →
                          </span>
                          <span className="truncate font-medium text-slate-700">
                            {bid.shipment.deliveryLocation}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2 text-xs text-slate-500">
                        <span>Pickup: {shortDate(bid.pickupDate)}</span>
                        <span className="text-slate-400">Received {shortDate(bid.createdAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <span className="text-2xl text-slate-300" aria-hidden="true">
                  
                  </span>
                  <h3 className="m-0 text-sm font-semibold text-slate-800">
                    No bids received yet
                  </h3>
                  <p className="m-0 text-xs text-slate-500">
                    Transporter bids for your shipments will appear here.
                  </p>
                  <Link
                    to="/shipper/bids"
                    className="mt-2 inline-flex min-h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 no-underline hover:bg-slate-50"
                  >
                    Check bids overview
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3 border border-blue-100 bg-blue-50/50 p-4">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-sm font-semibold text-slate-900">Tell us your usual loads for quicker transport recommendations.</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {usualLoadTypes.map((type) => {
              const checked = usualLoads.includes(type);
              return <label key={type} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium ${checked ? "border-blue-600 bg-blue-100 text-blue-800" : "border-slate-300 bg-white text-slate-600"}`}>
                <input className="sr-only" type="checkbox" checked={checked} onChange={() => setUsualLoads((current) => checked ? current.filter((item) => item !== type) : [...current, type])} />{type}
              </label>;
            })}
          </div>
          {preferencesMutation.isError && <p className="mb-0 mt-2 text-xs text-red-700">{preferencesMutation.error.message}</p>}
        </div>
        <button type="button" disabled={preferencesMutation.isPending} onClick={() => preferencesMutation.mutate()} className="min-h-9 shrink-0 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{preferencesMutation.isPending ? "Saving…" : "Save loads"}</button>
      </Card>

    </div>
  );
}
