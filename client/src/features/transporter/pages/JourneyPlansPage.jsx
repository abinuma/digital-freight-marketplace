import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
  Spinner,
} from '../../../shared/components/index.js';
import { CityLocationPicker } from '../../profile/components/CityLocationPicker.jsx';
import { createJourneyPlan, listMyJourneyPlans } from '../journeyPlan.api.js';

const planStatuses = ['ACTIVE', 'FULL', 'COMPLETED', 'CANCELLED'];
const statusTones = {
  ACTIVE: 'success',
  FULL: 'warning',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
};

const money = (amount) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
  }).format(amount);

const dateLabel = (date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));

const toLocalDateTime = (date) => {
  if (!date) return '';
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
};

const planSchema = z.object({
  originCity: z.string().trim().min(1, 'Please select an origin city'),
  destinationCity: z.string().trim().min(1, 'Please select a destination city'),
  departureDate: z
    .string()
    .min(1, 'Choose your departure schedule date and time')
    .refine(
      (value) => new Date(value).getTime() > Date.now(),
      'Departure date must be in the future',
    ),
  fullLoadPrice: z.coerce
    .number()
    .positive('Enter a full load price greater than zero')
    .max(999_999_999_999.99),
});

export function JourneyPlansPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    originCity: '',
    destinationCity: '',
    departureDate: '',
    fullLoadPrice: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [requestError, setRequestError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ['transporter', 'journeyPlans', statusFilter, page],
    queryFn: () => listMyJourneyPlans({ status: statusFilter || undefined, page, limit: 10 }),
    refetchInterval: 15_000,
  });

  const plans = query.data?.journeyPlans || [];

  function resetForm() {
    setFormValues({
      originCity: '',
      destinationCity: '',
      departureDate: '',
      fullLoadPrice: '',
    });
    setFormErrors({});
    setRequestError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const parsed = planSchema.safeParse(formValues);
    if (!parsed.success) {
      setFormErrors(
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])),
      );
      return;
    }

    if (parsed.data.originCity.toLowerCase() === parsed.data.destinationCity.toLowerCase()) {
      setFormErrors((prev) => ({
        ...prev,
        destinationCity: 'Destination city must be different from origin city',
      }));
      return;
    }

    setFormErrors({});
    setRequestError('');
    setIsSubmitting(true);

    try {
      await createJourneyPlan(parsed.data);
      await cache.invalidateQueries({ queryKey: ['transporter', 'journeyPlans'] });
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      setRequestError(err.message || 'Could not create journey plan');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <p className="mb-1 text-xs font-bold tracking-widest text-blue-700">AVAILABILITY & TRIPS</p>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">
            My Journey Plans
          </h1>
          <p className="mb-0 mt-2 text-sm text-slate-500">
            List your scheduled routes, full load prices, and manage capacity per trip.
          </p>
        </div>
        <div className="flex items-center gap-3 max-sm:w-full max-sm:flex-col max-sm:items-stretch">
          <Select
            className="min-w-44"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter journey plans by status"
          >
            <option value="">All statuses</option>
            {planStatuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            + New Journey Plan
          </Button>
        </div>
      </div>

      {query.isError && (
        <Alert tone="danger" title="Could not load journey plans">
          {query.error.message}
        </Alert>
      )}

      {query.isPending ? (
        <div className="grid gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : plans.length > 0 ? (
        <div className="grid gap-5">
          {plans.map((plan) => {
            const weightPercent = plan.maxWeightKg
              ? Math.min(100, Math.round((plan.allocatedWeightKg / plan.maxWeightKg) * 100))
              : 0;
            const volumePercent = plan.maxVolumeM3
              ? Math.min(100, Math.round((plan.allocatedVolumeM3 / plan.maxVolumeM3) * 100))
              : 0;
            const isFull = plan.status === 'FULL' || weightPercent >= 100 || (plan.maxVolumeM3 && volumePercent >= 100);

            return (
              <Card className="grid gap-4 p-5" key={plan.id}>
                <div className="flex items-start justify-between gap-4 max-sm:flex-col">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTones[plan.status] || 'neutral'}>{plan.status}</Badge>
                      <span className="text-xs text-slate-500">
                        Departure: <strong>{dateLabel(plan.departureDate)}</strong>
                      </span>
                    </div>
                    <h2 className="mb-0 mt-2 text-xl font-bold text-slate-900">
                      {plan.originCity} <span className="text-blue-600">→</span> {plan.destinationCity}
                    </h2>
                  </div>
                  <div className="text-right max-sm:text-left">
                    <span className="text-xs uppercase tracking-wide text-slate-500">Full load price</span>
                    <p className="m-0 text-xl font-bold text-slate-900">{money(plan.fullLoadPrice)}</p>
                  </div>
                </div>

                {isFull && (
                  <Alert tone="success" title="Capacity Reached">
                    <strong>You are ready to collect the loads and go</strong>
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Weight Capacity</span>
                      <span>
                        {plan.allocatedWeightKg.toLocaleString()} / {plan.maxWeightKg.toLocaleString()} kg ({weightPercent}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full transition-all ${
                          weightPercent >= 100 ? 'bg-amber-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${weightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {plan.remainingWeightKg.toLocaleString()} kg remaining
                    </span>
                  </div>

                  <div className="grid gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Volume Capacity</span>
                      <span>
                        {plan.maxVolumeM3
                          ? `${plan.allocatedVolumeM3.toLocaleString()} / ${plan.maxVolumeM3.toLocaleString()} m³ (${volumePercent}%)`
                          : 'Vehicle volume unconstrained'}
                      </span>
                    </div>
                    {plan.maxVolumeM3 ? (
                      <>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full transition-all ${
                              volumePercent >= 100 ? 'bg-amber-600' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${volumePercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {plan.remainingVolumeM3?.toLocaleString()} m³ remaining
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">No volume limit specified</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="m-0 mb-2 text-sm font-semibold uppercase tracking-wider text-slate-700">
                    Assigned Loads ({plan.assignments?.length || 0})
                  </h3>
                  {plan.assignments?.length ? (
                    <div className="grid gap-2">
                      {plan.assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm"
                        >
                          <div>
                            <strong className="text-slate-900">
                              {assignment.shipment?.goodsDescription || 'Shipment load'}
                            </strong>
                            <div className="text-xs text-slate-500">
                              {assignment.shipment?.pickupLocation} → {assignment.shipment?.deliveryLocation}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                            <span>{assignment.shipment?.weightKg?.toLocaleString()} kg</span>
                            {assignment.shipment?.volumeM3 != null && (
                              <span>{assignment.shipment?.volumeM3} m³</span>
                            )}
                            {assignment.bid?.price != null && (
                              <strong className="text-slate-900">{money(assignment.bid.price)}</strong>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="m-0 text-xs italic text-slate-500">
                      No loads assigned yet. When shippers accept your bids, assign them to this journey plan.
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <span className="text-3xl text-slate-400" aria-hidden="true">
            ⛟
          </span>
          <h2 className="m-0 text-base font-semibold text-slate-800">
            {statusFilter ? `No ${statusFilter.toLowerCase()} journey plans` : 'No journey plans listed'}
          </h2>
          <p className="m-0 text-sm text-slate-500">
            Publish your travel schedules to easily manage truckload capacity and bundle shipper loads.
          </p>
          <Button
            className="mt-3"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            Create your first journey plan
          </Button>
        </Card>
      )}

      {!query.isError && plans.length > 0 && (
        <Pagination
          page={query.data?.pagination?.page || page}
          pageCount={query.data?.pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      )}

      <Modal
        open={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="List trip availability"
      >
        {requestError && (
          <div className="mb-4">
            <Alert tone="danger" title="Could not create journey plan">
              {requestError}
            </Alert>
          </div>
        )}
        <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
          <CityLocationPicker
            label="Origin City"
            id="plan-origin-city"
            placeholder="Search origin city..."
            city={formValues.originCity}
            error={formErrors.originCity}
            onChange={(item) =>
              setFormValues((prev) => ({ ...prev, originCity: item.city }))
            }
          />

          <CityLocationPicker
            label="Destination City"
            id="plan-destination-city"
            placeholder="Search destination city..."
            city={formValues.destinationCity}
            error={formErrors.destinationCity}
            onChange={(item) =>
              setFormValues((prev) => ({ ...prev, destinationCity: item.city }))
            }
          />

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>
              Departure schedule <i className="text-red-700">*</i>
            </span>
            <Input
              type="datetime-local"
              min={toLocalDateTime(new Date())}
              value={formValues.departureDate}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, departureDate: e.target.value }))
              }
              required
            />
            {formErrors.departureDate && (
              <small className="text-sm text-red-700">{formErrors.departureDate}</small>
            )}
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span>
              Full load price (ETB) <i className="text-red-700">*</i>
            </span>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 25000"
              value={formValues.fullLoadPrice}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, fullLoadPrice: e.target.value }))
              }
              required
            />
            {formErrors.fullLoadPrice && (
              <small className="text-sm text-red-700">{formErrors.fullLoadPrice}</small>
            )}
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner /> Creating...
                </>
              ) : (
                'Create Journey Plan'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
