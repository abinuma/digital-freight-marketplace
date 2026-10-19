import { Badge, Button, Card } from '../../../shared/components/index.js';
import { dateLabel, timeLabel } from '../messaging.formatters.js';

const statusTones = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  DECLINED: 'danger',
  WITHDRAWN: 'neutral',
};

export function ConversationBidCard({
  bid,
  role,
  vehicle,
  accepting,
  onAcceptBid,
}) {
  const shipment = bid?.shipment;
  const canAccept = role === 'SHIPPER'
    && shipment?.status === 'PUBLISHED'
    && bid?.status === 'PENDING';
  const tone = statusTones[bid?.status] || 'neutral';
  const bidTime = bid.createdAt ? timeLabel(bid.createdAt) : '';
  const vehicleLabel = vehicle
    ? `${vehicle.type}${vehicle.capacityTons ? ` (${vehicle.capacityTons}t)` : ''}`
    : '—';

  return (
    <Card className="overflow-hidden rounded-xl border border-blue-600 bg-white p-0 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-2.5 bg-blue-50 px-3.5 pb-3 pt-3">
        <h3 className="m-0 text-xs font-bold text-slate-900">
          {shipment?.goodsDescription || 'Shipment details'}
          {shipment?.weightKg != null && (
            <span> · {Number(shipment.weightKg).toLocaleString()} kg</span>
          )}
        </h3>
        <div className="flex min-w-0 items-end gap-2 text-xs font-semibold text-blue-900">
          <span className="min-w-0 flex-1">
            <span className="mb-0.5 block text-[9px] font-medium uppercase tracking-wide text-slate-500">From</span>
            <span className="block truncate">{shipment?.pickupLocation || 'Pickup location'}</span>
          </span>
          <span className="mb-1 min-w-4 flex-1 border-t border-dashed border-blue-300" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-right">
            <span className="mb-0.5 block text-[9px] font-medium uppercase tracking-wide text-slate-500">To</span>
            <span className="block truncate">{shipment?.deliveryLocation || 'Delivery location'}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-blue-200/70 pt-2 text-[11px] text-blue-700">
          <span>Pickup wanted</span>
          <strong className="text-slate-800">
            {shipment?.pickupDate ? dateLabel(shipment.pickupDate) : '—'}
          </strong>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-blue-100 px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current offer</span>
          <Badge tone={tone}>{bid.status.toLowerCase()}</Badge>
        </div>
        <strong className="text-2xl font-extrabold leading-none text-blue-950">
          ETB {Number(bid.price).toLocaleString()}
        </strong>
        <p className="m-0 text-[11px] text-slate-500">Sent{bidTime ? ` ${bidTime}` : ''}</p>
        <div className="grid gap-1.5 pt-1 text-xs">
          <div className="flex items-center justify-between gap-2 text-slate-600">
            <span>Bid pickup</span>
            <strong className="text-right text-slate-900">
              {bid.pickupDate ? dateLabel(bid.pickupDate) : '—'}
              {bid.pickupDate && <span className="block text-[10px] font-normal text-slate-500">Matches your date</span>}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-2 text-slate-600">
            <span>Vehicle</span>
            <strong className="text-right text-slate-900">{vehicleLabel}</strong>
          </div>
          <div className="flex items-center justify-between gap-2 text-slate-600">
            <span>Terms</span>
            <strong className="max-w-[65%] text-right text-slate-900">{bid.message || '—'}</strong>
          </div>
        </div>

        {bid.declineReason && (
          <p className="m-0 rounded-lg bg-red-50 p-2 text-xs text-red-700">
            Decline reason: {bid.declineReason}
          </p>
        )}

      </div>

      <div className="flex flex-col gap-2 border-t border-slate-100 px-3.5 py-3">
        {role === 'SHIPPER' && canAccept && (
          <Button
            className="min-h-9 w-full bg-blue-600 text-sm font-semibold hover:bg-blue-700"
            disabled={accepting}
            onClick={() => onAcceptBid(bid)}
          >
            {accepting ? 'Accepting…' : 'Accept offer'}
          </Button>
        )}
        {role === 'SHIPPER' && bid.status === 'ACCEPTED' && (
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 py-2 text-xs font-bold text-blue-700">
            <span aria-hidden="true">✓</span> Offer accepted
          </div>
        )}
        {role === 'TRANSPORTER' && (
          <div className="text-center text-xs text-slate-500">
            Your bid is <strong className="text-slate-700">{bid.status.toLowerCase()}</strong>
          </div>
        )}
      </div>
    </Card>
  );
}
