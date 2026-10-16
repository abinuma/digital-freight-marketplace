import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '../../../shared/components/index.js';
import { dateLabel, initials, timeLabel } from '../messaging.formatters.js';
import { PreviewableImage } from '../../../shared/components/PreviewableImage.jsx';

const statusTones = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  DECLINED: 'danger',
  WITHDRAWN: 'neutral',
};

export function ConversationBidCard({
  bid,
  role,
  profile,
  vehicle,
  counterpartName,
  accepting,
  onAcceptBid,
}) {
  const shipment = bid?.shipment;
  const shipmentPath = bid && (role === 'SHIPPER'
    ? `/shipper/shipments/${bid.shipmentId}`
    : `/transporter/shipments/${bid.shipmentId}`);
  const canAccept = role === 'SHIPPER'
    && shipment?.status === 'PUBLISHED'
    && bid?.status === 'PENDING';

  const tone = statusTones[bid?.status] || 'neutral';
  const name = profile?.name || counterpartName || 'User';

  return (
    <Card className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm">
      {/* 1. Transporter / Profile Section */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-blue-200 bg-blue-100 text-sm font-bold text-blue-700 shadow-xs">
          {profile?.profilePhoto ? (
            <PreviewableImage className="h-full w-full object-cover" src={profile.profilePhoto} alt={`${name} profile photo`} />
          ) : (
            initials(name)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <strong className="truncate text-sm font-semibold text-slate-900">
              {name}
            </strong>
            <Badge tone={tone}>{bid.status}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            {profile?.averageRating > 0 ? (
              <span className="font-medium text-amber-600">
                ★ {Number(profile.averageRating).toFixed(1)}{' '}
                <span className="text-slate-400">({profile.reviewCount})</span>
              </span>
            ) : (
              <span>No ratings yet</span>
            )}
            {role === 'SHIPPER' && vehicle && (
              <>
                <span className="text-slate-300">·</span>
                <span className="truncate">
                  {vehicle.type} ({vehicle.capacityTons}t{vehicle.volumeM3 ? ` · ${vehicle.volumeM3}m³` : ''})
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Shipment Details Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="m-0 truncate text-sm font-bold text-slate-900" title={shipment?.goodsDescription}>
              {shipment?.goodsDescription || 'Shipment details'}
            </h3>
            <p className="m-0 truncate text-xs text-slate-600">
              {shipment?.pickupLocation} <span aria-hidden="true">→</span> {shipment?.deliveryLocation}
            </p>
          </div>
          <strong className="shrink-0 text-base font-extrabold text-blue-700">
            ETB {Number(bid.price).toLocaleString()}
          </strong>
        </div>

        <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Shipment pickup</span>
            <span className="font-medium text-slate-700">{shipment?.pickupDate ? dateLabel(shipment.pickupDate) : '—'}</span>
          </div>
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bid pickup</span>
            <span className="font-medium text-slate-700">{bid.pickupDate ? `${dateLabel(bid.pickupDate)} · ${timeLabel(bid.pickupDate)}` : '—'}</span>
          </div>
          {shipment?.weightKg != null && (
            <div className="col-span-2 pt-0.5 text-xs text-slate-500">
              Cargo weight: <span className="font-medium text-slate-700">{shipment.weightKg} kg</span>
            </div>
          )}
        </div>

        {bid.message && (
          <p className="m-0 rounded-lg bg-slate-50 p-2 text-xs italic leading-relaxed text-slate-600">
            "{bid.message}"
          </p>
        )}

        {bid.declineReason && (
          <p className="m-0 rounded-lg bg-red-50 p-2 text-xs text-red-700">
            Decline reason: {bid.declineReason}
          </p>
        )}

        {shipmentPath && (
          <Link
            to={shipmentPath}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 no-underline hover:text-blue-800 hover:underline"
          >
            View shipment listing ↗
          </Link>
        )}
      </div>

      {/* 3. Action Buttons Section */}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
        {role === 'SHIPPER' && canAccept && (
          <Button
            className="min-h-10 w-full bg-green-600 text-sm font-semibold hover:bg-green-700"
            disabled={accepting}
            onClick={() => onAcceptBid(bid)}
          >
            {accepting ? 'Accepting…' : 'Accept Bid'}
          </Button>
        )}
        {role === 'SHIPPER' && bid.status === 'ACCEPTED' && (
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-green-50 py-2 text-xs font-bold text-green-700">
            <span>✓</span> Bid Accepted
          </div>
        )}
        {role === 'TRANSPORTER' && (
          <div className="text-center text-xs text-slate-500">
            Your bid is <strong className="text-slate-700">{bid.status.toLowerCase()}</strong>
          </div>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="min-h-9 w-full text-xs text-slate-600"
          disabled
          title="Issue reporting is not configured yet."
        >
          Report Issue
        </Button>
      </div>
    </Card>
  );
}
