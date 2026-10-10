import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, Card, Modal, Skeleton, Spinner, Textarea } from '../../../shared/components/index.js';
import { decideBid, getShipment, getUserProfile, listShipmentBids, removeShipmentImage, transitionShipment } from '../shipper.api.js';
import { ShipmentConversation } from '../../messaging/ShipmentConversation.jsx';

const tones = { DRAFT: 'neutral', PUBLISHED: 'brand', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'danger', PENDING: 'warning', ACCEPTED: 'success', DECLINED: 'danger' };
const dateLabel = (date) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
const money = (amount) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(amount);

export function ShipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [confirmation, setConfirmation] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [working, setWorking] = useState(false);
  const shipmentQuery = useQuery({ queryKey: ['shipper', 'shipment', id], queryFn: () => getShipment(id) });
  const bidsQuery = useQuery({ queryKey: ['shipper', 'bids', id], queryFn: () => listShipmentBids(id), enabled: Boolean(shipmentQuery.data) });
  const bids = bidsQuery.data || [];
  const profileQueries = useQueries({ queries: [...new Set(bids.map((bid) => bid.transporterId))].map((transporterId) => ({ queryKey: ['users', 'publicProfile', transporterId], queryFn: () => getUserProfile(transporterId), staleTime: 5 * 60_000 })) });
  const profiles = new Map([...new Set(bids.map((bid) => bid.transporterId))].map((transporterId, index) => [transporterId, profileQueries[index]?.data]));
  const shipment = shipmentQuery.data;

  async function refresh() {
    await Promise.all([
      cache.invalidateQueries({ queryKey: ['shipper'] }),
      cache.invalidateQueries({ queryKey: ['shipper', 'shipment', id] }),
      cache.invalidateQueries({ queryKey: ['shipper', 'bids', id] }),
    ]);
  }

  async function performAction() {
    if (!confirmation) return;
    setWorking(true);
    setActionError('');
    try {
      if (confirmation.type === 'bid') {
        await decideBid({ shipmentId: id, bidId: confirmation.id, action: confirmation.action, declineReason: declineReason.trim() || undefined });
      } else if (confirmation.type === 'image') {
        await removeShipmentImage({ shipmentId: id, imageId: confirmation.id });
      } else {
        await transitionShipment({ id, action: confirmation.action });
      }
      setConfirmation(null);
      setDeclineReason('');
      await refresh();
    } catch (error) {
      setActionError(error.message);
    } finally {
      setWorking(false);
    }
  }

  if (shipmentQuery.isPending) return <div className="shipper-page"><div className="shipper-loading-list"><Skeleton /><Skeleton /><Skeleton /></div></div>;
  if (shipmentQuery.isError) return <div className="shipper-page"><Alert tone="danger" title="Shipment unavailable">{shipmentQuery.error.message}</Alert><Link className="shipper-text-link" to="/shipper/shipments">← Back to shipments</Link></div>;

  const canEdit = shipment.status === 'DRAFT' || shipment.status === 'PUBLISHED';
  const dialogTitle = confirmation?.type === 'bid'
    ? `${confirmation.action === 'accept' ? 'Accept' : 'Decline'} this bid?`
    : confirmation?.type === 'image' ? 'Remove this photo?' : `Confirm ${confirmation?.action || 'shipment action'}?`;
  return (
    <div className="shipper-page">
      <div className="shipper-detail-back"><Link className="shipper-text-link" to="/shipper/shipments">← My shipments</Link></div>
      {actionError && <Alert tone="danger" title="Action could not be completed">{actionError}</Alert>}
      <div className="shipper-page__heading shipper-detail-heading"><div><p className="shipper-eyebrow">SHIPMENT OVERVIEW</p><h1>{shipment.goodsDescription}</h1><div className="shipper-detail-tags"><Badge tone={tones[shipment.status]}>{shipment.status.replace('_', ' ')}</Badge><span>{shipment.goodsType} · {shipment.weightKg} kg</span></div></div><div className="shipper-detail-actions">{canEdit && <Button variant="secondary" onClick={() => navigate(`/shipper/shipments/${id}/edit`)}>Edit shipment</Button>}{shipment.status === 'DRAFT' && <Button onClick={() => setConfirmation({ action: 'publish', type: 'shipment' })}>Publish</Button>}{shipment.status === 'IN_PROGRESS' && <Button onClick={() => setConfirmation({ action: 'complete', type: 'shipment' })}>Mark delivered</Button>}{!['CANCELLED', 'COMPLETED'].includes(shipment.status) && <Button variant="danger" onClick={() => setConfirmation({ action: 'cancel', type: 'shipment' })}>Cancel shipment</Button>}</div></div>
      <div className="shipper-detail-grid"><div className="shipper-detail-main">
        <Card className="shipper-detail-card"><div className="shipper-panel__heading"><div><h2>Route &amp; cargo</h2><p>Shipment information for transporters</p></div></div><div className="shipper-route"><div className="shipper-route__stop"><span className="shipper-route__dot shipper-route__dot--start" /><div><small>PICKUP</small><strong>{shipment.pickupLocation}</strong>{shipment.pickupLat != null && <small>{Number(shipment.pickupLat).toFixed(4)}, {Number(shipment.pickupLng).toFixed(4)}</small>}</div></div><div className="shipper-route__line" /><div className="shipper-route__stop"><span className="shipper-route__dot shipper-route__dot--end" /><div><small>DELIVERY</small><strong>{shipment.deliveryLocation}</strong>{shipment.deliveryLat != null && <small>{Number(shipment.deliveryLat).toFixed(4)}, {Number(shipment.deliveryLng).toFixed(4)}</small>}</div></div></div><div className="shipper-info-grid"><div><span>Pickup date</span><strong>{dateLabel(shipment.pickupDate)}</strong></div><div><span>Goods category</span><strong>{shipment.goodsType}</strong></div><div><span>Cargo weight</span><strong>{shipment.weightKg} kg</strong></div><div><span>Posted on</span><strong>{dateLabel(shipment.createdAt)}</strong></div></div>{shipment.specialRequirements && <div className="shipper-requirements"><h3>Special requirements</h3><p>{shipment.specialRequirements}</p></div>}</Card>
        {shipment.images?.length > 0 && <Card className="shipper-detail-card"><div className="shipper-panel__heading"><div><h2>Cargo photos</h2><p>{shipment.images.length} photo{shipment.images.length === 1 ? '' : 's'}</p></div></div><div className="shipper-gallery">{shipment.images.map((image) => <figure key={image.id}><img src={image.url} alt="Shipment cargo" />{canEdit && <button type="button" onClick={() => setConfirmation({ type: 'image', id: image.id })} aria-label="Remove photo">×</button>}</figure>)}</div></Card>}
        {bids.some((bid) => ['PENDING', 'ACCEPTED'].includes(bid.status)) && <ShipmentConversation shipmentId={id} />}
      </div><div className="shipper-detail-side"><Card className="shipper-detail-card shipper-bids-card"><div className="shipper-panel__heading"><div><h2>Transporter bids</h2><p>Offers received for this shipment</p></div><span className="shipper-bid-count">{bidsQuery.data?.length ?? '—'}</span></div>
        {bidsQuery.isPending ? <div className="shipper-loading-list"><Skeleton /><Skeleton /></div> : bidsQuery.isError ? <Alert tone="danger">{bidsQuery.error.message}</Alert> : !bids.length ? <div className="shipper-empty shipper-empty--small"><span>◇</span><h3>No bids yet</h3><p>Transporter offers will appear here.</p></div> : <div className="shipper-bid-list">{bids.map((bid) => { const profile = profiles.get(bid.transporterId); const name = profile?.name || 'Transporter'; return <article className="shipper-bid" key={bid.id}><div className="shipper-bid__top"><div className="shipper-transporter"><span className="shipper-transporter__avatar">{profile?.profilePhoto ? <img src={profile.profilePhoto} alt="" /> : name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>{profile?.averageRating ? `★ ${Number(profile.averageRating).toFixed(1)} (${profile.reviewCount} reviews)` : profile ? 'No ratings yet' : 'Loading profile…'}</small></div></div><Badge tone={tones[bid.status]}>{bid.status}</Badge></div><strong className="shipper-bid__price">{money(bid.price)}</strong><div className="shipper-bid__meta"><span>Pickup offer</span><strong>{dateLabel(bid.pickupDate)}</strong></div>{bid.message && <p className="shipper-bid__message">{bid.message}</p>}{bid.declineReason && <p className="shipper-bid__message">Reason: {bid.declineReason}</p>}{bid.status === 'PENDING' && shipment.status === 'PUBLISHED' && <div className="shipper-bid__actions"><Button size="sm" onClick={() => setConfirmation({ type: 'bid', id: bid.id, action: 'accept' })}>Accept bid</Button><Button size="sm" variant="secondary" onClick={() => { setDeclineReason(''); setConfirmation({ type: 'bid', id: bid.id, action: 'decline' }); }}>Decline</Button></div>}</article>; })}</div>}
      </Card></div></div>
      <Modal open={Boolean(confirmation)} onClose={() => !working && setConfirmation(null)} title={dialogTitle}><p className="shipper-confirm-copy">{confirmation?.type === 'bid' ? confirmation.action === 'accept' ? 'Accepting this offer starts the shipment and closes the other pending bids.' : 'Decline this transporter’s offer.' : confirmation?.type === 'image' ? 'This photo will be removed from the shipment.' : confirmation?.action === 'publish' ? 'Publishing makes this shipment visible to transporters.' : confirmation?.action === 'complete' ? 'Confirm that this shipment has been delivered.' : 'This shipment will be cancelled and pending bids declined.'}</p>{confirmation?.type === 'bid' && confirmation.action === 'decline' && <label className="shipper-field"><span>Reason (optional)</span><Textarea maxLength={2000} value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} placeholder="Add a note for the transporter" /></label>}<div className="shipper-modal-actions"><Button variant="secondary" disabled={working} onClick={() => setConfirmation(null)}>Keep as is</Button><Button variant={confirmation?.action === 'cancel' || confirmation?.action === 'decline' || confirmation?.type === 'image' ? 'danger' : 'primary'} disabled={working} onClick={performAction}>{working ? <Spinner /> : confirmation?.action === 'accept' ? 'Accept bid' : confirmation?.action === 'decline' ? 'Decline bid' : confirmation?.type === 'image' ? 'Remove photo' : confirmation?.action === 'complete' ? 'Mark delivered' : confirmation?.action === 'publish' ? 'Publish shipment' : 'Cancel shipment'}</Button></div></Modal>
    </div>
  );
}
