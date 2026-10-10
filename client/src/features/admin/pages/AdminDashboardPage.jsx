import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Skeleton } from '../../../shared/components/index.js'
import { getAdminMetrics } from '../admin.api.js'

const cards = [
  ['totalUsers', 'Total users', 'All registered marketplace accounts'],
  ['newRegistrationsLast30Days', 'New registrations', 'Accounts created in the last 30 days'],
]

export function AdminDashboardPage() {
  const query = useQuery({ queryKey: ['admin', 'metrics'], queryFn: getAdminMetrics })
  const metrics = query.data

  return (
    <div className="shipper-page admin-page">
      <div className="shipper-page__heading"><div><p className="shipper-eyebrow">PLATFORM OVERVIEW</p><h1>Admin dashboard</h1><p>Monitor marketplace accounts and shipment activity.</p></div></div>
      {query.isError && <Alert tone="danger" title="Dashboard unavailable">{query.error.message}</Alert>}
      <section className="shipper-metrics" aria-label="Admin summary">
        {cards.map(([key, title, caption]) => <Card className="shipper-metric shipper-metric--blue" key={key}><span className="shipper-metric__icon" aria-hidden="true">◈</span><div><p>{title}</p>{query.isPending ? <Skeleton className="shipper-metric__skeleton" /> : <strong>{metrics?.[key] ?? 0}</strong>}<small>{caption}</small></div></Card>)}
        {['SHIPPER', 'TRANSPORTER', 'ADMIN'].map((role) => <Card className="shipper-metric shipper-metric--purple" key={role}><span className="shipper-metric__icon" aria-hidden="true">♙</span><div><p>{role.toLowerCase()} accounts</p>{query.isPending ? <Skeleton className="shipper-metric__skeleton" /> : <strong>{metrics?.usersByRole?.[role] ?? 0}</strong>}<small>Registered users by role</small></div></Card>)}
        <Card className="shipper-metric shipper-metric--green"><span className="shipper-metric__icon" aria-hidden="true">⇢</span><div><p>Active shipments</p>{query.isPending ? <Skeleton className="shipper-metric__skeleton" /> : <strong>{metrics?.shipments?.active ?? 0}</strong>}<small>Published or in progress</small></div></Card>
        <Card className="shipper-metric shipper-metric--gold"><span className="shipper-metric__icon" aria-hidden="true">✓</span><div><p>Completed shipments</p>{query.isPending ? <Skeleton className="shipper-metric__skeleton" /> : <strong>{metrics?.shipments?.completed ?? 0}</strong>}<small>Successfully delivered</small></div></Card>
      </section>
      <Card className="shipper-panel admin-intro"><div className="shipper-panel__heading"><div><h2>Marketplace administration</h2><p>Review accounts and help keep the freight network trustworthy.</p></div></div><p>Use user management to search accounts, suspend accounts that violate marketplace rules, or restore access when appropriate.</p></Card>
    </div>
  )
}
