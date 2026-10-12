import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Badge, Card, Skeleton } from '../../../shared/components/index.js';
import { getDashboardSummary } from '../shipper.api.js';

const metricCards = [
  ['activePostings', 'Active postings', 'Currently open to bids', 'blue'],
  ['bidsReceived', 'Bids received', 'Offers from transporters', 'gold'],
  ['inTransit', 'In transit', 'Shipments underway', 'purple'],
  ['completed', 'Completed deliveries', 'Successfully delivered', 'green'],
];
const statusTone = { DRAFT: 'neutral', PUBLISHED: 'brand', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'danger' };
const shortDate = (date) => date ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date)) : '—';

export function ShipperDashboardPage() {
  const query = useQuery({ queryKey: ['shipper', 'dashboard'], queryFn: getDashboardSummary, refetchInterval: 15_000 });
  const summary = query.data;

  return (
    <div className="shipper-page">
      <div className="shipper-page__heading"><div><p className="shipper-eyebrow">OVERVIEW</p><h1>Good to see you</h1><p>Here’s what’s happening with your freight today.</p></div><Link className="ui-button ui-button--primary" to="/shipper/shipments/new">＋ Post a shipment</Link></div>
      {query.isError && <Alert tone="danger" title="Dashboard unavailable">{query.error.message}</Alert>}
      <section className="shipper-metrics" aria-label="Shipment summary">
        {metricCards.map(([key, title, caption, tone]) => <Card className={`shipper-metric shipper-metric--${tone}`} key={key}><span className="shipper-metric__icon" aria-hidden="true">{key === 'activePostings' ? '↗' : key === 'bidsReceived' ? '◇' : key === 'inTransit' ? '⇢' : '✓'}</span><div><p>{title}</p>{query.isPending ? <Skeleton className="shipper-metric__skeleton" /> : <strong>{summary?.counts?.[key] ?? 0}</strong>}<small>{caption}</small></div></Card>)}
      </section>
      <div className="shipper-submetrics"><span><strong>{summary?.counts?.drafts ?? 0}</strong> drafts</span><span><strong>{summary?.counts?.messages ?? 0}</strong> shipment messages</span><span><strong>{summary?.counts?.cancelled ?? 0}</strong> cancelled</span></div>
      <Card className="shipper-panel">
        <div className="shipper-panel__heading"><div><h2>Recent shipments</h2><p>Your latest freight activity</p></div><Link className="ui-button ui-button--secondary ui-button--sm" to="/shipper/shipments">View all shipments</Link></div>
        {query.isPending ? <div className="shipper-loading-list"><Skeleton /><Skeleton /><Skeleton /></div> : summary?.recentShipments?.length ? <div className="shipper-table-wrap"><table className="shipper-table"><thead><tr><th>Shipment</th><th>Route</th><th>Pickup date</th><th>Bids</th><th>Status</th></tr></thead><tbody>{summary.recentShipments.map((shipment) => <tr key={shipment.id}><td><Link to={`/shipper/shipments/${shipment.id}`} className="shipper-table__title">{shipment.goodsDescription}</Link><small>{shipment.goodsType} · {shipment.weightKg} kg</small></td><td>{shipment.pickupLocation} <span className="shipper-route-arrow">→</span> {shipment.deliveryLocation}</td><td>{shortDate(shipment.pickupDate)}</td><td>{shipment.bidCount}</td><td><Badge tone={statusTone[shipment.status]}>{shipment.status.replace('_', ' ')}</Badge></td></tr>)}</tbody></table></div> : <div className="shipper-empty"><span>▤</span><h3>Your shipment activity starts here</h3><p>Post your first shipment to receive offers from trusted transporters.</p><Link className="ui-button ui-button--primary" to="/shipper/shipments/new">Post a shipment</Link></div>}
      </Card>
    </div>
  );
}
