import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Alert, Badge, Button, Card, Input, Modal, Skeleton, Spinner, Textarea } from '../../../shared/components/index.js';
import { getShipment, listMyBids, submitBid, withdrawBid } from '../transporter.api.js';
import { ShipmentConversation } from '../../messaging/ShipmentConversation.jsx';
import { ShipmentReviews } from '../../shipper/components/ShipmentReviews.jsx';

const tones = { DRAFT: 'neutral', PUBLISHED: 'brand', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'danger', PENDING: 'warning', ACCEPTED: 'success', DECLINED: 'danger', WITHDRAWN: 'neutral' };
const money = (amount) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(amount);
const dateLabel = (date) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
const toLocalDateTime = (date) => {
  if (!date) return '';
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
};
const bidSchema = z.object({ price: z.coerce.number().positive('Enter an offer greater than zero').max(999_999_999_999.99), pickupDate: z.string().min(1, 'Choose your available pickup date and time').refine((value) => new Date(value).getTime() > Date.now(), 'Pickup time must be in the future'), message: z.string().max(5000) });

export function ShipmentDetailPage() {
  const { id } = useParams();
  const cache = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const shipmentQuery = useQuery({ queryKey: ['transporter', 'shipment', id], queryFn: () => getShipment(id) });
  const ownBidQuery = useQuery({ queryKey: ['transporter', 'bidForShipment', id], queryFn: () => listMyBids({ shipmentId: id, limit: 1 }), enabled: Boolean(shipmentQuery.data) });
  const shipment = shipmentQuery.data;
  const latestBid = ownBidQuery.data?.bids?.[0] || null;
  const activeBid = latestBid && ['PENDING', 'ACCEPTED'].includes(latestBid.status) ? latestBid : null;
  const canBid = !ownBidQuery.isPending && !ownBidQuery.isError && shipment?.status === 'PUBLISHED' && latestBid?.status !== 'PENDING' && latestBid?.status !== 'ACCEPTED';

  async function doWithdraw() {
    if (!activeBid) return;
    setIsWithdrawing(true);
    setActionError('');
    try {
      await withdrawBid({ shipmentId: id, bidId: activeBid.id });
      setWithdrawOpen(false);
      await cache.invalidateQueries({ queryKey: ['transporter'] });
    } catch (error) {
      setActionError(error.message);
    } finally {
      setIsWithdrawing(false);
    }
  }

  if (shipmentQuery.isPending) return <div className="shipper-page transporter-page"><div className="transporter-load-list"><Skeleton /><Skeleton /></div></div>;
  if (shipmentQuery.isError) return <div className="shipper-page transporter-page"><Alert tone="danger" title="Shipment unavailable">{shipmentQuery.error.message}</Alert><Link className="shipper-text-link" to="/transporter/shipments">← Back to available shipments</Link></div>;
  return (
    <div className="shipper-page transporter-page">
      <div><Link className="shipper-text-link" to="/transporter/shipments">← Find shipments</Link></div>
      {actionError && <Alert tone="danger" title="Action could not be completed">{actionError}</Alert>}
      <div className="shipper-page__heading transporter-detail-heading"><div><p className="shipper-eyebrow">SHIPMENT DETAILS</p><h1>{shipment.goodsDescription}</h1><div className="shipper-detail-tags"><Badge tone={tones[shipment.status]}>{shipment.status.replace('_', ' ')}</Badge><span>{shipment.goodsType} · {shipment.weightKg} kg</span></div></div><Link className="ui-button ui-button--secondary" to="/transporter/bids">My bids</Link></div>
      <div className="transporter-detail-grid">
        <div className="shipper-detail-main">
          <Card className="shipper-detail-card"><div className="shipper-panel__heading"><div><h2>Route &amp; cargo</h2><p>Pickup schedule and cargo information</p></div></div><div className="shipper-route"><div className="shipper-route__stop"><span className="shipper-route__dot shipper-route__dot--start" /><div><small>PICKUP</small><strong>{shipment.pickupLocation}</strong>{shipment.pickupLat != null && <small>{Number(shipment.pickupLat).toFixed(4)}, {Number(shipment.pickupLng).toFixed(4)}</small>}</div></div><div className="shipper-route__line" /><div className="shipper-route__stop"><span className="shipper-route__dot shipper-route__dot--end" /><div><small>DELIVERY</small><strong>{shipment.deliveryLocation}</strong>{shipment.deliveryLat != null && <small>{Number(shipment.deliveryLat).toFixed(4)}, {Number(shipment.deliveryLng).toFixed(4)}</small>}</div></div></div><div className="shipper-info-grid"><div><span>Preferred pickup</span><strong>{dateLabel(shipment.pickupDate)}</strong></div><div><span>Category</span><strong>{shipment.goodsType}</strong></div><div><span>Estimated weight</span><strong>{shipment.weightKg} kg</strong></div><div><span>Listing posted</span><strong>{dateLabel(shipment.createdAt)}</strong></div></div>{shipment.specialRequirements && <div className="shipper-requirements"><h3>Special requirements</h3><p>{shipment.specialRequirements}</p></div>}</Card>
          {shipment.images?.length > 0 && <Card className="shipper-detail-card"><div className="shipper-panel__heading"><div><h2>Cargo photos</h2><p>Photos provided with this listing</p></div></div><div className="shipper-gallery">{shipment.images.map((image) => <figure key={image.id}><img src={image.url} alt="Shipment cargo" /></figure>)}</div></Card>}
          {activeBid && <ShipmentConversation shipmentId={id} />}
          {shipment.status === 'COMPLETED' && <ShipmentReviews shipmentId={id} canReview={latestBid?.status === 'ACCEPTED'} />}
        </div>
        <aside className="transporter-offer-column">
          {ownBidQuery.isError && <Alert tone="danger" title="Your bid status could not be checked">{ownBidQuery.error.message}</Alert>}
          {ownBidQuery.isPending ? <Card className="shipper-detail-card"><Skeleton /><Skeleton /></Card> : activeBid ? <><Card className="shipper-detail-card transporter-own-bid"><div className="shipper-panel__heading"><div><h2>Your offer</h2><p>Submitted {dateLabel(activeBid.createdAt)}</p></div><Badge tone={tones[activeBid.status]}>{activeBid.status}</Badge></div><strong className="shipper-bid__price">{money(activeBid.price)}</strong><div className="shipper-bid__meta"><span>Your pickup offer</span><strong>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activeBid.pickupDate))}</strong></div>{activeBid.message && <p className="shipper-bid__message">{activeBid.message}</p>}{activeBid.status === 'PENDING' && <Button variant="danger" onClick={() => setWithdrawOpen(true)}>Withdraw bid</Button>}{activeBid.status === 'ACCEPTED' && <Alert tone="success" title="Your offer was accepted">You can now message the shipper about this shipment.</Alert>}</Card>{activeBid.status === 'PENDING' && <BidEditor key={activeBid.id} shipmentId={id} initialBid={activeBid} />}</> : canBid ? <BidEditor key={latestBid?.id || 'new'} shipmentId={id} initialBid={null} /> : ownBidQuery.isError ? <Card className="shipper-detail-card"><h2>Bid status unavailable</h2><p className="transporter-muted">Refresh this page to check whether you have already bid on this listing.</p></Card> : latestBid && ['DECLINED', 'WITHDRAWN'].includes(latestBid.status) && shipment.status === 'PUBLISHED' ? <><Alert tone="info" title={`Your last bid was ${latestBid.status.toLowerCase()}`}>You may submit a new offer while this listing is still open.</Alert><BidEditor key={`new-${latestBid.id}`} shipmentId={id} initialBid={null} /></> : <Card className="shipper-detail-card"><h2>Bidding is closed</h2><p className="transporter-muted">This listing is no longer accepting bids.</p>{latestBid && <div className="shipper-detail-tags"><Badge tone={tones[latestBid.status]}>{latestBid.status}</Badge></div>}</Card>}
        </aside>
      </div>
      <Modal open={withdrawOpen} onClose={() => !isWithdrawing && setWithdrawOpen(false)} title="Withdraw your bid?"><p className="shipper-confirm-copy">The shipper will no longer see this as an active offer. You may submit a new offer later if the listing remains open.</p><div className="shipper-modal-actions"><Button variant="secondary" onClick={() => setWithdrawOpen(false)} disabled={isWithdrawing}>Keep bid</Button><Button variant="danger" onClick={doWithdraw} disabled={isWithdrawing}>{isWithdrawing ? <Spinner /> : 'Withdraw bid'}</Button></div></Modal>
    </div>
  );
}
function BidEditor({ shipmentId, initialBid }) {
  const cache = useQueryClient();
  const [values, setValues] = useState({ price: initialBid ? String(initialBid.price) : '', pickupDate: toLocalDateTime(initialBid?.pickupDate), message: initialBid?.message || '' });
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  function update(name, value) { setValues((current) => ({ ...current, [name]: value })); }
  async function submit(event) {
    event.preventDefault();
    const parsed = bidSchema.safeParse(values);
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]))); return; }
    setErrors({});
    setRequestError('');
    setIsSaving(true);
    try {
      await submitBid({ shipmentId, bidId: initialBid?.id, values: { ...parsed.data, price: Number(parsed.data.price) } });
      await cache.invalidateQueries({ queryKey: ['transporter'] });
    } catch (error) { setRequestError(error.message); }
    finally { setIsSaving(false); }
  }
  return <Card className="shipper-detail-card transporter-bid-editor"><div className="shipper-panel__heading"><div><h2>{initialBid ? 'Update your offer' : 'Make an offer'}</h2><p>Send the shipper a clear price and pickup time.</p></div></div>{requestError && <Alert tone="danger" title="Your bid could not be saved">{requestError}</Alert>}<form onSubmit={submit} noValidate><label className="shipper-field"><span>Your price (ETB) <i>*</i></span><Input required type="number" min="0.01" step="0.01" value={values.price} onChange={(event) => update('price', event.target.value)} placeholder="Enter your offer" />{errors.price && <small className="shipper-field__error">{errors.price}</small>}</label><label className="shipper-field"><span>Available pickup time <i>*</i></span><Input required type="datetime-local" value={values.pickupDate} onChange={(event) => update('pickupDate', event.target.value)} />{errors.pickupDate && <small className="shipper-field__error">{errors.pickupDate}</small>}</label><label className="shipper-field"><span>Message to shipper</span><Textarea maxLength={5000} value={values.message} onChange={(event) => update('message', event.target.value)} placeholder="Introduce your service or ask a question" />{errors.message && <small className="shipper-field__error">{errors.message}</small>}</label><Button type="submit" disabled={isSaving}>{isSaving ? <><Spinner /> Sending…</> : initialBid ? 'Save offer changes' : 'Submit bid'}</Button></form></Card>;
}
