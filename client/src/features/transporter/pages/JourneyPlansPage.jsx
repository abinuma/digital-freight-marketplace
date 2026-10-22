import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
  useSuccessToast,
} from '../../../shared/components/index.js';
import { CityLocationPicker } from '../../profile/components/CityLocationPicker.jsx';
import { createJourneyPlan, deleteJourneyPlan, listMyJourneyPlans, updateJourneyPlan } from '../journeyPlan.api.js';
import { formatLoadSize } from '../../../shared/constants/loadSizes.js';

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
  const showSuccess = useSuccessToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [formValues, setFormValues] = useState({
    originCity: '',
    destinationCity: '',
    departureDate: '',
    fullLoadPrice: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [requestError, setRequestError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const departureTimeSelection = useRef(null);

  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ['transporter', 'journeyPlans', statusFilter, page],
    queryFn: () => listMyJourneyPlans({ status: statusFilter || undefined, page, limit: 10 }),
    refetchInterval: 15_000,
  });

  const plans = query.data?.journeyPlans || [];
  const editingPlan = plans.find((plan) => plan.id === editingPlanId);
  const isEditingLocked = Boolean(editingPlan?.assignments?.length)
    || ['COMPLETED', 'CANCELLED'].includes(editingPlan?.status);

  function updateDepartureDate(event) {
    const input = event.currentTarget;
    const [date = '', time = ''] = input.value.split('T');
    setFormValues((prev) => ({ ...prev, departureDate: input.value }));

    if (!date || !time) return;

    const selection = departureTimeSelection.current;
    if (!selection || selection.date !== date) {
      departureTimeSelection.current = { date, time, timePartsChanged: 0 };
      return;
    }

    if (selection.time !== time) {
      selection.time = time;
      selection.timePartsChanged += 1;
      if (selection.timePartsChanged >= 3) {
        input.blur();
        departureTimeSelection.current = null;
      }
    }
  }

  function resetForm() {
    setEditingPlanId(null);
    setFormValues({
      originCity: '',
      destinationCity: '',
      departureDate: '',
      fullLoadPrice: '',
    });
    setFormErrors({});
    setRequestError('');
  }

  function openEditForm(plan) {
    setEditingPlanId(plan.id);
    setFormValues({
      originCity: plan.originCity,
      destinationCity: plan.destinationCity,
      departureDate: toLocalDateTime(plan.departureDate),
      fullLoadPrice: String(plan.fullLoadPrice),
    });
    setFormErrors({});
    setRequestError('');
    setIsModalOpen(true);
  }

  async function handleDeletePlan() {
    if (!planToDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteJourneyPlan(planToDelete.id);
      await cache.invalidateQueries({ queryKey: ['transporter', 'journeyPlans'] });
      setPlanToDelete(null);
      resetForm();
      setIsModalOpen(false);
      showSuccess('Plan deleted');
    } catch (err) {
      setDeleteError(err.message || 'Could not delete journey plan');
    } finally {
      setIsDeleting(false);
    }
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
    const wasEditing = Boolean(editingPlanId);

    try {
      if (editingPlanId) await updateJourneyPlan(editingPlanId, parsed.data);
      else await createJourneyPlan(parsed.data);
      await cache.invalidateQueries({ queryKey: ['transporter', 'journeyPlans'] });
      resetForm();
      setIsModalOpen(false);
      showSuccess(wasEditing ? 'Plan updated' : 'Plan created');
    } catch (err) {
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        const fieldErrors = {};
        const globalErrors = [];
        for (const issue of err.details) {
          const field = issue.path?.[issue.path.length - 1];
          if (field) {
            fieldErrors[field] = issue.message;
          } else {
            globalErrors.push(issue.message);
          }
        }
        if (Object.keys(fieldErrors).length > 0) {
          setFormErrors(fieldErrors);
        }
        setRequestError(globalErrors.join(', ') || err.message || `Could not ${editingPlanId ? 'update' : 'create'} journey plan`);
      } else {
        setRequestError(err.message || `Could not ${editingPlanId ? 'update' : 'create'} journey plan`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid w-full gap-6 px-6 py-6 max-md:gap-4 max-md:px-4 max-md:py-5">
      <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <div>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 max-md:text-2xl">
            My Journey Plans
          </h1>
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
            className="whitespace-nowrap"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            New plan
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
            const maxWeight = Number(plan.maxWeightKg || 10000);
            const allocatedWeight = Number(plan.allocatedWeightKg || 0);
            const allocatedPercent = maxWeight > 0
              ? Math.min(100, Math.round((allocatedWeight / maxWeight) * 100))
              : plan.allocatedLoadFraction != null
                ? Math.min(100, Math.round(Number(plan.allocatedLoadFraction) * 100))
                : 0;
            const remainingPercent = Math.max(0, 100 - allocatedPercent);
            const isFull = plan.status === 'FULL' || allocatedPercent >= 100;

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
                      {plan.originCity} <img src="/arrow-right-long-solid-full.svg" alt="to" aria-hidden="true" className="mx-1 inline h-3 w-4 align-middle" /> {plan.destinationCity}
                    </h2>
                  </div>
                  <div className="text-right max-sm:text-left">
                    <span className="text-xs uppercase tracking-wide text-slate-500">Full load price</span>
                    <p className="m-0 text-xl font-bold text-slate-900">{money(plan.fullLoadPrice)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="min-h-8 px-3 py-1 text-xs"
                    onClick={() => openEditForm(plan)}
                  >
                    Review
                  </Button>
                </div>
                {isFull && (
                  <Alert tone="success" title="Capacity Reached">
                    <strong>You are ready to collect the loads and go</strong>
                  </Alert>
                )}

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="grid gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Load Capacity</span>
                      <span>{allocatedWeight.toLocaleString()} kg</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full transition-all ${
                          allocatedPercent >= 100 ? 'bg-amber-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${allocatedPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {allocatedPercent >= 100
                        ? 'Full'
                        : `${remainingPercent}% capacity remaining`}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="m-0 mb-2 text-sm font-semibold uppercase tracking-wider text-slate-700">
                    Assigned Loads ({plan.assignments?.length || 0})
                  </h3>
                  {plan.assignments?.length ? (
                    <div className="grid gap-2">
                      {plan.assignments.map((assignment) => (
                        <Link
                          key={assignment.id}
                          to={`/transporter/shipments/${assignment.shipmentId}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-inherit no-underline transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                        >
                          <div>
                            <strong className="text-slate-900">
                              {assignment.shipment?.goodsDescription || 'Shipment load'}
                            </strong>
                            <div className="text-xs text-slate-500">
                              {assignment.shipment?.pickupLocation} <img src="/arrow-right-long-solid-full.svg" alt="to" aria-hidden="true" className="mx-1 inline h-3 w-4 align-middle" /> {assignment.shipment?.deliveryLocation}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                            <span className="font-semibold text-blue-900">
                              {formatLoadSize(assignment.shipment?.loadSize || assignment.loadSize)}
                            </span>
                            {assignment.bid?.price != null && (
                              <strong className="text-slate-900">{money(assignment.bid.price)}</strong>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="m-0 text-xs italic text-slate-500">No loads assigned yet.</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-2 px-4 py-12 text-center">
          {statusFilter ? (
            <>
              <img src="/magnifying-glass-solid-full.svg" alt="" aria-hidden="true" className="h-8 w-8 opacity-25" />
              <h2 className="m-0 text-base font-semibold text-slate-800">No matching plan try adjusting filters</h2>
            </>
          ) : (
            <>
              <span className="text-3xl text-slate-400" aria-hidden="true">⛟</span>
              <h2 className="m-0 text-base font-semibold text-slate-800">No journey plans listed</h2>
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
            </>
          )}
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
        title={editingPlanId ? 'Review journey plan' : 'List trip availability'}
      >
        {requestError && (
          <div className="mb-4">
            <Alert tone="danger" title={`Could not ${editingPlanId ? 'update' : 'create'} journey plan`}>
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
            required
            disabled={isEditingLocked}
            onChange={(item) =>
              setFormValues((prev) => ({
                ...prev,
                originCity: item.city,
                destinationCity:
                  prev.destinationCity.toLowerCase() === item.city.toLowerCase()
                    ? ''
                    : prev.destinationCity,
              }))
            }
          />

          <CityLocationPicker
            label="Destination City"
            id="plan-destination-city"
            placeholder="Search destination city..."
            city={formValues.destinationCity}
            excludeCity={formValues.originCity}
            error={formErrors.destinationCity}
            required
            disabled={isEditingLocked}
            onChange={(item) =>
              setFormValues((prev) => ({ ...prev, destinationCity: item.city }))
            }
          />

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1.5">
              Departure schedule <i className="text-red-700">*</i>
            </span>
            <div className={isEditingLocked ? 'cursor-not-allowed' : ''}>
              <Input
                className={isEditingLocked ? 'pointer-events-none' : ''}
                type="datetime-local"
                min={toLocalDateTime(new Date())}
                value={formValues.departureDate}
                onChange={updateDepartureDate}
                aria-invalid={Boolean(formErrors.departureDate)}
                onFocus={(event) => {
                  const [date = '', time = ''] = event.currentTarget.value.split('T');
                  departureTimeSelection.current = date && time
                    ? { date, time, timePartsChanged: 0 }
                    : null;
                }}
                onBlur={() => {
                  departureTimeSelection.current = null;
                }}
                required
                disabled={isEditingLocked}
              />
            </div>
            {formErrors.departureDate && (
              <small className="text-sm text-red-700">{formErrors.departureDate}</small>
            )}
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1.5">
              Full load price (ETB) <i className="text-red-700">*</i>
            </span>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 25000"
              value={formValues.fullLoadPrice}
              aria-invalid={Boolean(formErrors.fullLoadPrice)}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, fullLoadPrice: e.target.value }))
              }
              required
              disabled={isEditingLocked}
            />
            {formErrors.fullLoadPrice && (
              <small className="text-sm text-red-700">{formErrors.fullLoadPrice}</small>
            )}
          </label>

          <div className="relative mt-4 flex w-full items-center justify-end gap-2">
            {editingPlanId && (
              <Button
                size="sm"
                type="button"
                variant="danger"
                className="absolute left-0"
                disabled={isSubmitting}
                onClick={() => {
                  const plan = plans.find((item) => item.id === editingPlanId);
                  if (plan) {
                    setPlanToDelete(plan);
                    setDeleteError('');
                  }
                }}
              >
                Delete
              </Button>
            )}
            <Button size="sm" type="submit" disabled={isSubmitting || isEditingLocked}>
              {isSubmitting ? (
                <>
                  <Spinner /> {editingPlanId ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                editingPlanId ? 'Save changes' : 'Create Plan'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(planToDelete)} onClose={() => !isDeleting && setPlanToDelete(null)} title="Delete journey plan">
        {deleteError && <div className="mb-4"><Alert tone="danger" title="Could not delete journey plan">{deleteError}</Alert></div>}
        <p className="m-0 text-sm text-slate-600">
          Delete the plan for {planToDelete?.originCity} → {planToDelete?.destinationCity}? This cannot be undone.
          {planToDelete?.assignments?.length > 0 && (
            <> This will remove its {planToDelete.assignments.length === 1 ? 'assignment link' : `${planToDelete.assignments.length} assignment links`}; the shipments and accepted bids will remain.</>
          )}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPlanToDelete(null)} disabled={isDeleting}>Cancel</Button>
          <Button size="sm" variant="danger" onClick={handleDeletePlan} disabled={isDeleting}>
            {isDeleting ? <><Spinner /> Deleting...</> : 'Delete plan'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
