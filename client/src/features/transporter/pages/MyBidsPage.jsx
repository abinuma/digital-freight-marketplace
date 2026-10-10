import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, Card, Modal, Pagination, Select, Skeleton, Spinner } from '../../../shared/components/index.js';
import { getShipment, listMyBids, withdrawBid } from '../transporter.api.js';

const statuses = ['PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'];
const tones = { PENDING: 'warning', ACCEPTED: 'success', DECLINED: 'danger', WITHDRAWN: 'neutral' };
const money = (amount) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(amount);
const dateLabel = (date) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));

export function MyBidsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedBid, setSelectedBid] = useState(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['transporter', 'myBids', status, page], queryFn: () => listMyBids({ status: status || undefined, page, limit: 10 }) });
  const bids = query.data?.bids || [];
  const shipmentQueries = useQueries({ queries: bids.map((bid) => ({ queryKey: ['transporter', 'bidShipment', bid.shipmentId], queryFn: () => getShipment(bid.shipmentId), staleTime: 60_000 })) });

  async function confirmWithdraw() {
    if (!selectedBid) return;
    setWorking(true);
    setError('');
    try {
      await withdrawBid({ shipmentId: selectedBid.shipmentId, bidId: selectedBid.id });
      setSelectedBid(null);
      await cache.invalidateQueries({ queryKey: ['transporter'] });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
    }
  }

  function changeStatus(event) { setStatus(event.target.value); setPage(1); setError(''); }
  return (
    <div className="shipper-page transporter-page">
      <div className="shipper-page__heading"><div><p className="shipper-eyebrow">YOUR OFFERS</p><h1>My bids</h1><p>Review the offers you’ve sent to shippers.</p></div><label className="shipper-filter"><span>Bid status</span><Select value={status} onChange={changeStatus} aria-label="Filter bids by status"><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</Select></label></div>
      {error && <Alert tone="danger" title="Could not complete that action">{error}</Alert>}
      {query.isError && <Alert tone="danger" title="Could not load your bids">{query.error.message}</Alert>}
      {query.isPending ? <div className="transporter-load-list"><Skeleton /><Skeleton /><Skeleton /></div> : bids.length ? <div className="transporter-bids-list">{bids.map((bid, index) => {
        const shipment = shipmentQueries[index]?.data;
        const shipmentUnavailable = shipmentQueries[index]?.isError;
        return <Card className="transporter-my-bid" key={bid.id}><div className="transporter-my-bid__heading"><div><Badge tone={tones[bid.status]}>{bid.status}</Badge><h2>{shipment?.goodsDescription || (shipmentUnavailable ? 'Shipment unavailable' : 'Loading shipment…')}</h2></div><strong>{money(bid.price)}</strong></div><div className="transporter-route"><span>●</span><strong>{shipment?.pickupLocation || 'Pickup location'}</strong><i /><span className="transporter-route__end">●</span><strong>{shipment?.deliveryLocation || 'Delivery location'}</strong></div><div className="transporter-my-bid__footer"><span>Offer sent {dateLabel(bid.createdAt)}</span><span>Pickup offered {dateLabel(bid.pickupDate)}</span><div><Link className="ui-button ui-button--secondary ui-button--sm" to={`/transporter/shipments/${bid.shipmentId}`}>View shipment</Link>{bid.status === 'PENDING' && <Button size="sm" variant="danger" onClick={() => { setSelectedBid(bid); setError(''); }}>Withdraw</Button>}</div></div></Card>;
      })}</div> : <Card className="shipper-empty"><span>▤</span><h3>{status ? `No ${status.toLowerCase()} bids` : 'No bids yet'}</h3><p>{status ? 'Choose a different status or browse available shipments.' : 'Find a shipment that fits your route and send your first offer.'}</p><Link className="ui-button ui-button--primary" to="/transporter/shipments">Browse shipments</Link></Card>}
      <Pagination page={query.data?.pagination?.page || page} pageCount={query.data?.pagination?.totalPages || 1} onPageChange={setPage} />
      <Modal open={Boolean(selectedBid)} onClose={() => !working && setSelectedBid(null)} title="Withdraw this bid?"><p className="shipper-confirm-copy">This offer will be removed from the shipper’s active bids. You can submit another offer later if the shipment is still open.</p><div className="shipper-modal-actions"><Button variant="secondary" onClick={() => setSelectedBid(null)} disabled={working}>Keep bid</Button><Button variant="danger" onClick={confirmWithdraw} disabled={working}>{working ? <Spinner /> : 'Withdraw bid'}</Button></div></Modal>
    </div>
  );
}
