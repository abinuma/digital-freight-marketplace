import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Alert, Badge, Card, Skeleton } from '../../../shared/components/index.js';
import { listAvailableShipments, listMyBids } from '../transporter.api.js';
import { listNotifications } from '../../notifications/notifications.api.js';

const metrics = [
  { key: 'PENDING', title: 'Pending bids', subtitle: 'Waiting for shipper response', tone: 'blue' },
  { key: 'ACCEPTED', title: 'Accepted bids', subtitle: 'Ready or underway', tone: 'green' },
  { key: 'DECLINED', title: 'Declined bids', subtitle: 'Closed offers', tone: 'gold' },
];

export function TransporterDashboardPage() {
  const results = useQueries({ queries: [
    ...metrics.map(({ key }) => ({ queryKey: ['transporter', 'bidCount', key], queryFn: () => listMyBids({ status: key, limit: 1 }) })),
    { queryKey: ['transporter', 'availableCount'], queryFn: () => listAvailableShipments({ limit: 1 }) },
    { queryKey: ['notifications', 'recent'], queryFn: () => listNotifications({ limit: 12 }) },
  ] });
  const error = results.find((query) => query.isError);
  const recent = (results[4].data?.notifications || []).slice(0, 6);
  const messages = recent.filter((notification) => notification.type === 'NEW_MESSAGE');

  return (
    <div className="shipper-page transporter-page">
      <div className="shipper-page__heading"><div><p className="shipper-eyebrow">OVERVIEW</p><h1>Transporter dashboard</h1><p>Keep track of your offers and find your next delivery.</p></div><Link className="ui-button ui-button--primary" to="/transporter/shipments">⌕ Browse shipments</Link></div>
      {error && <Alert tone="danger" title="Some dashboard information is unavailable">{error.error.message}</Alert>}
      <section className="shipper-metrics transporter-metrics" aria-label="Bid and shipment summary">
        {metrics.map(({ key, title, subtitle, tone }, index) => <Card className={`shipper-metric shipper-metric--${tone}`} key={key}><span className="shipper-metric__icon" aria-hidden="true">{key === 'PENDING' ? '◷' : key === 'ACCEPTED' ? '✓' : '↗'}</span><div><p>{title}</p>{results[index].isPending ? <Skeleton className="shipper-metric__skeleton" /> : <strong>{results[index].data?.pagination?.total ?? 0}</strong>}<small>{subtitle}</small></div></Card>)}
        <Card className="shipper-metric shipper-metric--purple"><span className="shipper-metric__icon" aria-hidden="true">⌕</span><div><p>Available shipments</p>{results[3].isPending ? <Skeleton className="shipper-metric__skeleton" /> : <strong>{results[3].data?.pagination?.total ?? 0}</strong>}<small>Open listings to bid on</small></div></Card>
      </section>
      <div className="transporter-dashboard-grid">
        <Card className="shipper-panel"><div className="shipper-panel__heading"><div><h2>Recent messages</h2><p>Conversation updates on your shipment bids</p></div></div>
          {results[4].isPending ? <div className="shipper-loading-list"><Skeleton /><Skeleton /><Skeleton /></div> : messages.length ? <div className="transporter-notice-list">{messages.map((message) => <Link to={`/transporter/shipments/${message.referenceId}`} className={`transporter-notice ${message.read ? '' : 'is-unread'}`} key={message.id}><span className="transporter-notice__icon">✉</span><span><strong>{message.title}</strong><small>{message.message}</small><time>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(message.createdAt))}</time></span><span aria-hidden="true">→</span></Link>)}</div> : <div className="shipper-empty shipper-empty--small"><span>✉</span><h3>No recent messages</h3><p>Messages about your bids will show up here.</p></div>}
        </Card>
        <Card className="transporter-tip"><span>ETHIOFREIGHT</span><h2>Find a load that fits your route.</h2><p>Explore current postings, send a clear offer, and keep your shipment conversations in one place.</p><Link className="ui-button ui-button--secondary" to="/transporter/shipments">Explore shipments</Link></Card>
      </div>
      <div className="shipper-submetrics"><span><Badge tone="warning">PENDING</Badge> bids need a response</span><span><Badge tone="success">ACCEPTED</Badge> bids open shipment messages</span></div>
    </div>
  );
}
