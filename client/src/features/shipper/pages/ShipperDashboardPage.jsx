import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Card,
  Skeleton,
  Select,
  Modal,
  useSuccessToast,
} from "../../../shared/components/index.js";
import { getDashboardSummary } from "../shipper.api.js";
import { listAvailableTransporters, getPublicProfile, updateProfile } from "../../profile/profile.api.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { CityLocationPicker } from "../../profile/components/CityLocationPicker.jsx";
import { readLastDriverSearchCity, saveLastDriverSearchCity } from "../driverSearchStorage.js";

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
const usualLoadTypes = ["Construction", "Timber", "Beverage", "Bottled water", "Agriculture"];

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

const availabilityDate = (date) => date
  ? new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(date))
  : "—";
const cityFromLocation = (location) => location?.split(",")[0]?.trim().toLocaleLowerCase();
const dateWeekday = (date) => new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${date.slice(0, 10)}T12:00:00`));

export function ShipperDashboardPage() {
  const navigate = useNavigate();
  const cache = useQueryClient();
  const { user, refreshUser } = useAuth();
  const showSuccess = useSuccessToast();
  const [city, setCity] = useState(() => user?.city || readLastDriverSearchCity(user?.id));
  const [shipmentId, setShipmentId] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [usualLoads, setUsualLoads] = useState(user?.preferredLoadTypes || []);
  const query = useQuery({
    queryKey: ["shipper", "dashboard"],
    queryFn: getDashboardSummary,
    refetchInterval: 15_000,
  });
  const summary = query.data;
  const shipmentWithBids = summary?.recentShipments?.find((shipment) => shipment.bidCount > 0);
  const selectedShipment = summary?.recentShipments?.find(({ id }) => id === shipmentId);
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
      state: {
        invitedDriver: driver,
        prefillShipment: selectedShipment || null,
      },
    });
  }
  const preferencesMutation = useMutation({
    mutationFn: () => updateProfile(user.id, { preferredLoadTypes: usualLoads }),
    onSuccess: async () => {
      await refreshUser();
      showSuccess('Preferences saved');
    },
  });
  const matchingDrivers = (driversQuery.data || []).filter((driver) => {
    if (!selectedShipment) return true;
    const pickupCity = cityFromLocation(selectedShipment.pickupLocation);
    const destinationCity = cityFromLocation(selectedShipment.deliveryLocation);
    const routeMatches = Boolean(pickupCity) && pickupCity === driver.city?.toLocaleLowerCase() && driver.city?.toLocaleLowerCase() === city.toLocaleLowerCase();
    const destinationMatches = !driver.intendedDestination || !destinationCity || driver.intendedDestination.toLocaleLowerCase() === destinationCity;
    const plannedDate = driver.plannedDepartureDate ? new Date(driver.plannedDepartureDate).toISOString().slice(0, 10) : null;
    const pickupDate = new Date(selectedShipment.pickupDate).toISOString().slice(0, 10);
    const dayMatches = Boolean(driver.availableDays?.some((day) => day.toLocaleLowerCase() === dateWeekday(pickupDate).toLocaleLowerCase()));
    const scheduleMatches = plannedDate === pickupDate || dayMatches;
    const weightMatches = driver.capacityTons * 1000 >= Number(selectedShipment.weightKg);
    const volumeMatches = selectedShipment.volumeM3 == null || (driver.volumeM3 != null && driver.volumeM3 >= Number(selectedShipment.volumeM3));
    const vehicle = driver.vehicleType.toLocaleLowerCase();
    const goods = `${selectedShipment.goodsType} ${selectedShipment.goodsDescription}`.toLocaleLowerCase();
    const needsRefrigeration = goods.includes("refriger") || goods.includes("perishable") || goods.includes("frozen") || goods.includes("cold chain");
    const needsTanker = goods.includes("liquid") || goods.includes("fuel") || goods.includes("chemical");
    const needsLowbed = goods.includes("heavy machinery") || goods.includes("oversized equipment");
    const vehicleMatches = (!needsRefrigeration || vehicle.includes("refriger") || vehicle.includes("reefer"))
      && (!needsTanker || vehicle.includes("tanker"))
      && (!needsLowbed || vehicle.includes("lowbed") || vehicle.includes("low bed"));
    return routeMatches && destinationMatches && scheduleMatches && weightMatches && volumeMatches && vehicleMatches;
  });

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
          to={shipmentWithBids ? `/shipper/shipments/${shipmentWithBids.id}` : "/shipper/shipments"}
        >
          Review bids
        </Link>
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="m-0 text-xs font-bold tracking-widest text-emerald-700">AVAILABLE DRIVERS</p>
            <h2 className="mb-0 mt-1 text-lg font-semibold text-slate-900">Find drivers looking for a load</h2>
            <p className="mb-0 mt-1 text-sm text-slate-500">Choose a city to see transporters who are available now.</p>
          </div>
          <div className="w-full max-w-xs">
            <CityLocationPicker
              id="driver-city"
              label={user?.city ? "See drivers in" : "Where is your load?"}
              placeholder="Type or select a city..."
              city={city}
              onChange={({ city: selectedCity }) => {
                setCity(selectedCity);
                saveLastDriverSearchCity(user?.id, selectedCity);
                setShipmentId("");
              }}
            />
          </div>
          <label className="w-full max-w-xs text-sm font-medium text-slate-700" htmlFor="driver-shipment">
            Match a shipment (optional)
            <Select id="driver-shipment" className="mt-1" value={shipmentId} onChange={(event) => setShipmentId(event.target.value)} disabled={!city || !summary?.recentShipments?.length}>
              <option value="">Show all available drivers</option>
              {(summary?.recentShipments || []).map((shipment) => <option key={shipment.id} value={shipment.id}>{shipment.goodsDescription} · {shipment.pickupLocation} → {shipment.deliveryLocation}</option>)}
            </Select>
          </label>
        </div>
        {!city ? (
          <p className="m-0 px-5 py-6 text-sm text-slate-500">Select a city to see available drivers there.</p>
        ) : driversQuery.isPending ? (
          <div className="grid gap-3 p-5"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        ) : driversQuery.isError ? (
          <Alert tone="danger" className="m-4" title="Couldn’t load available drivers">{driversQuery.error.message}</Alert>
        ) : matchingDrivers.length ? (
          <div className="divide-y divide-slate-100">
            {matchingDrivers.map((driver) => (
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" key={driver.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><strong className="text-sm text-slate-900">{driver.name}</strong><Badge tone="success">Available now</Badge></div>
                  <p className="mb-0 mt-1 text-sm text-slate-600">{driver.vehicleType} · {driver.capacityTons} t capacity{driver.volumeM3 ? ` · ${driver.volumeM3} m³` : ""}</p>
                  <p className="mb-0 mt-1 text-xs text-slate-500">{driver.intendedDestination ? `Heading to ${driver.intendedDestination} · ` : "Destination not specified · "}Updated {availabilityDate(driver.availabilityUpdatedAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" className="min-h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setSelectedDriver(driver)}>View profile</button>
                  <button type="button" className="min-h-9 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800" onClick={() => handleContactInvite(driver)}>Contact / invite</button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="m-0 px-5 py-6 text-sm text-slate-500">{selectedShipment ? "No available drivers match this shipment’s route, timing, capacity, volume, and vehicle needs." : `No drivers are looking for loads in ${city} right now.`}</p>}
        {city && selectedShipment && <p className="m-0 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Matching checks include pickup and destination cities, planned date and availability days, weight, volume, and refrigerated vehicle needs.</p>}
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 border border-blue-100 bg-blue-50/50 p-4">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-sm font-semibold text-slate-900">Tell us your usual loads for quicker transport recommendations.</h2>
          <p className="mb-0 mt-1 text-xs text-slate-500">Choose the cargo types you ship most often.</p>
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

      <Modal open={Boolean(selectedDriver)} onClose={() => setSelectedDriver(null)} title="Transporter profile">
        {selectedDriver && <div className="grid gap-3">
          {driverProfileQuery.isPending ? <Skeleton className="h-20" /> : driverProfileQuery.isError ? <Alert tone="danger">{driverProfileQuery.error.message}</Alert> : <>
            <div><h3 className="m-0 text-base font-semibold text-slate-900">{driverProfileQuery.data?.name}</h3><p className="mb-0 mt-1 text-sm text-slate-600">{driverProfileQuery.data?.city || selectedDriver.city}</p>{driverProfileQuery.data?.phone && <p className="mb-0 mt-1 text-sm text-slate-600">{driverProfileQuery.data.phone}</p>}</div>
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><p className="m-0">Vehicle: {selectedDriver.vehicleType}</p><p className="mb-0 mt-1">Capacity: {selectedDriver.capacityTons} tonnes{selectedDriver.volumeM3 ? ` · ${selectedDriver.volumeM3} m³` : ""}</p></div>
          </>}
          <button type="button" className="min-h-10 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800" onClick={() => handleContactInvite(selectedDriver)}>Contact / invite</button>
        </div>}
      </Modal>

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
