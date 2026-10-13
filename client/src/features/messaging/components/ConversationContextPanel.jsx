import { Link } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Skeleton,
} from '../../../shared/components/index.js';
import { dateLabel, initials, timeLabel } from '../messaging.formatters.js';

const headingClass = 'm-0 text-base font-bold text-slate-800';

export function ConversationContextPanel({
  conversation,
  role,
  bids,
  bidIndex,
  bidsPending,
  bidsError,
  profile,
  profilePending,
  vehicle,
  bid,
  accepting,
  actionError,
  onPreviousBid,
  onNextBid,
  onAcceptBid,
}) {
  const shipment = bid?.shipment;
  const shipmentPath = bid && (role === 'SHIPPER'
    ? `/shipper/shipments/${bid.shipmentId}`
    : `/transporter/shipments/${bid.shipmentId}`);
  const canAccept = role === 'SHIPPER'
    && shipment?.status === 'PUBLISHED'
    && bid?.status === 'PENDING';

  return (
    <aside className="grid content-start gap-6 border-t border-slate-200 bg-slate-50 p-5 md:col-span-2 md:grid-cols-2 xl:col-span-1 xl:grid-cols-1 xl:overflow-y-auto xl:border-l xl:border-t-0">
      <section className="grid content-start gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className={headingClass}>Shipment Context</h2>
          {bids.length > 1 && (
            <div className="flex items-center gap-2" aria-label="Navigate bids">
              <Button size="sm" variant="secondary" onClick={onPreviousBid} aria-label="Previous bid">‹</Button>
              <span className="whitespace-nowrap text-xs text-slate-500">{bidIndex + 1} of {bids.length}</span>
              <Button size="sm" variant="secondary" onClick={onNextBid} aria-label="Next bid">›</Button>
            </div>
          )}
        </div>
        {bidsPending ? (
          <Card className="grid gap-3 p-4"><Skeleton className="h-5" /><Skeleton className="h-16" /></Card>
        ) : bidsError ? (
          <Alert tone="danger" title="Bid details unavailable">{bidsError}</Alert>
        ) : bid && shipment ? (
          <Card className="grid gap-3 p-4">
            <div>
              <p className="mb-1 mt-0 text-xs font-bold tracking-wide text-blue-700">BID {bidIndex + 1} OF {bids.length}</p>
              <h3 className="m-0 text-sm font-bold text-slate-900">{shipment.goodsDescription}</h3>
            </div>
            <p className="m-0 text-sm text-slate-600">{shipment.pickupLocation} <span aria-hidden="true">→</span> {shipment.deliveryLocation}</p>
            <p className="m-0 text-sm text-slate-500">Shipment pickup: {dateLabel(shipment.pickupDate)}</p>
            <p className="m-0 text-sm text-slate-500">Bid pickup: {dateLabel(bid.pickupDate)} · {timeLabel(bid.pickupDate)}</p>
            <div className="flex items-center justify-between gap-3">
              <strong className="text-base text-slate-900">ETB {bid.price.toLocaleString()}</strong>
              <Badge tone={bid.status === 'ACCEPTED' ? 'success' : bid.status === 'PENDING' ? 'warning' : 'neutral'}>{bid.status}</Badge>
            </div>
            {shipment.weightKg != null && <p className="m-0 text-sm text-slate-500">Cargo weight: {shipment.weightKg} kg</p>}
            <Link className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-50" to={shipmentPath}>
              View Full Listing
            </Link>
          </Card>
        ) : (
          <Card className="p-4 text-sm text-slate-500">No bids are available in this conversation yet.</Card>
        )}
      </section>

      <section className="grid content-start gap-4">
        <h2 className={headingClass}>{role === 'SHIPPER' ? 'Transporter Profile' : 'Shipper Profile'}</h2>
        {profilePending ? (
          <Card className="grid justify-items-center gap-3 p-5"><Skeleton className="h-20 w-20 rounded-full" /><Skeleton className="h-5 w-32" /></Card>
        ) : profile ? (
          <Card className="grid justify-items-center gap-2 p-5 text-center">
            <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-4 border-white bg-blue-100 text-xl font-bold text-blue-700 shadow">
              {profile.profilePhoto
                ? <img className="h-full w-full object-cover" src={profile.profilePhoto} alt="" />
                : initials(profile.name)}
            </span>
            <strong className="text-base text-slate-900">{profile.name || conversation.counterpart.name}</strong>
            {profile.averageRating > 0 ? (
              <p className="m-0 text-sm text-amber-600">★ {Number(profile.averageRating).toFixed(1)} <span className="text-slate-500">({profile.reviewCount} reviews)</span></p>
            ) : (
              <p className="m-0 text-sm text-slate-500">No ratings yet</p>
            )}
            <p className="m-0 text-xs text-slate-500">Member since {new Date(profile.createdAt).getFullYear()}</p>
            {role === 'SHIPPER' && vehicle && (
              <p className="m-0 text-xs text-slate-500">{vehicle.type} · {vehicle.capacityTons} ton capacity</p>
            )}
          </Card>
        ) : (
          <Card className="p-4 text-sm text-slate-500">Profile details are unavailable.</Card>
        )}
      </section>

      {actionError && <Alert tone="danger" title="Could not accept bid">{actionError}</Alert>}
      {role === 'SHIPPER' && (
        <div className="grid gap-3 md:col-span-2 xl:col-span-1">
          <Button
            className="min-h-12 w-full bg-green-600 text-base hover:bg-green-700"
            disabled={!canAccept || accepting || bidsPending}
            onClick={onAcceptBid}
          >
            {accepting ? 'Accepting…' : bid?.status === 'ACCEPTED' ? 'Bid Accepted' : 'Accept Bid'}
          </Button>
          <Button className="min-h-12 w-full" variant="secondary" disabled title="Issue reporting is not configured yet.">
            Report Issue
          </Button>
          {!canAccept && bid?.status !== 'ACCEPTED' && (
            <p className="m-0 text-center text-xs text-slate-500">
              {bidsPending ? 'Loading bid details…' : 'A pending bid on a published shipment can be accepted here.'}
            </p>
          )}
        </div>
      )}
      {role === 'TRANSPORTER' && (
        <div className="grid gap-3 md:col-span-2 xl:col-span-1">
          {bid && <Badge tone={bid.status === 'ACCEPTED' ? 'success' : bid.status === 'PENDING' ? 'warning' : 'neutral'}>Your bid: {bid.status}</Badge>}
          <Button className="min-h-12 w-full" variant="secondary" disabled title="Issue reporting is not configured yet.">Report Issue</Button>
        </div>
      )}
    </aside>
  );
}
