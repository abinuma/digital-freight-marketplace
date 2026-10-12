import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Badge, Card, Pagination, Select, Skeleton } from '../../../shared/components/index.js';
import { listShipments } from '../shipper.api.js';

const statuses = ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const tones = { DRAFT: 'neutral', PUBLISHED: 'brand', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'danger' };
const formatDate = (date) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));

export function ShipmentListPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['shipper', 'shipments', { status, page }], queryFn: () => listShipments({ status: status || undefined, page, limit: 10 }), refetchInterval: 15_000 });
  const shipments = query.data?.shipments || [];

  function changeStatus(event) {
    setStatus(event.target.value);
    setPage(1);
  }

  return (
    <div className="shipper-page">
      <div className="shipper-page__heading"><div><p className="shipper-eyebrow">SHIPMENTS</p><h1>My shipments</h1><p>Track and manage the freight you’ve posted.</p></div><Link className="ui-button ui-button--primary" to="/shipper/shipments/new">＋ Post a shipment</Link></div>
      {query.isError && <Alert tone="danger" title="Could not load shipments">{query.error.message}</Alert>}
      <Card className="shipper-panel shipper-list-panel">
        <div className="shipper-panel__heading"><div><h2>All shipments</h2><p>{query.data?.pagination?.total ?? '—'} shipments</p></div><label className="shipper-filter"><span>Status</span><Select value={status} onChange={changeStatus} aria-label="Filter shipments by status"><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</Select></label></div>
        {query.isPending ? <div className="shipper-loading-list"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div> : shipments.length ? <div className="shipper-table-wrap"><table className="shipper-table"><thead><tr><th>Shipment</th><th>Route</th><th>Pickup date</th><th>Status</th><th /></tr></thead><tbody>{shipments.map((shipment) => <tr key={shipment.id}><td><Link to={`/shipper/shipments/${shipment.id}`} className="shipper-table__title">{shipment.goodsDescription}</Link><small>{shipment.goodsType} · {shipment.weightKg} kg</small></td><td>{shipment.pickupLocation}<span className="shipper-route-arrow"> → </span>{shipment.deliveryLocation}</td><td>{formatDate(shipment.pickupDate)}</td><td><Badge tone={tones[shipment.status]}>{shipment.status.replace('_', ' ')}</Badge></td><td><Link className="shipper-row-link" to={`/shipper/shipments/${shipment.id}`}>View <span aria-hidden="true">→</span></Link></td></tr>)}</tbody></table></div> : <div className="shipper-empty"><span>▤</span><h3>{status ? 'No shipments match this status' : 'No shipments yet'}</h3><p>{status ? 'Choose another status filter to see more shipments.' : 'Create a shipment to begin receiving transporter bids.'}</p>{!status && <Link className="ui-button ui-button--primary" to="/shipper/shipments/new">Post a shipment</Link>}</div>}
        <Pagination page={query.data?.pagination?.page || page} pageCount={query.data?.pagination?.totalPages || 1} onPageChange={setPage} />
      </Card>
    </div>
  );
}
