import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Skeleton } from '../../../shared/components/index.js'
import { getAdminMetrics } from '../admin.api.js'

const roleCards = [
  ['SHIPPER', 'Shipper accounts'],
  ['TRANSPORTER', 'Transporter accounts'],
  ['ADMIN', 'Admin accounts'],
]

function MetricCard({ title, value, caption, icon, tone = 'blue', isPending }) {
  return (
    <Card className={`admin-metric admin-metric--${tone}`}>
      <span className="admin-metric__icon" aria-hidden="true">{icon}</span>
      <div className="admin-metric__body">
        <p className="admin-metric__label">{title}</p>
        {isPending ? <Skeleton className="h-8 w-16" /> : <strong className="admin-metric__value">{value ?? 0}</strong>}
        <small className="admin-metric__caption">{caption}</small>
      </div>
    </Card>
  )
}

export function AdminDashboardPage() {
  const query = useQuery({ queryKey: ['admin', 'metrics'], queryFn: getAdminMetrics })
  const metrics = query.data

  return (
    <main className="admin-page">
      <header className="admin-page__heading">
        <p className="admin-page__eyebrow">PLATFORM OVERVIEW</p>
        <h1>Admin dashboard</h1>
        <p>Monitor marketplace accounts and shipment activity.</p>
      </header>

      {query.isError && <Alert tone="danger" title="Dashboard unavailable">{query.error.message}</Alert>}

      <section className="admin-metrics" aria-label="Admin summary">
        <MetricCard title="Total users" value={metrics?.totalUsers} caption="All registered marketplace accounts" icon="◈" isPending={query.isPending} />
        <MetricCard title="New registrations" value={metrics?.newRegistrationsLast30Days} caption="Accounts created in the last 30 days" icon="＋" tone="purple" isPending={query.isPending} />
        {roleCards.map(([role, title]) => (
          <MetricCard key={role} title={title} value={metrics?.usersByRole?.[role]} caption="Registered users by role" icon="♙" tone="purple" isPending={query.isPending} />
        ))}
        <MetricCard title="Active shipments" value={metrics?.shipments?.active} caption="Published or in progress" icon="⇢" tone="green" isPending={query.isPending} />
        <MetricCard title="Completed shipments" value={metrics?.shipments?.completed} caption="Successfully delivered" icon="✓" tone="gold" isPending={query.isPending} />
      </section>

      <Card className="admin-intro">
        <h2>Marketplace administration</h2>
        <p>Review accounts and help keep the freight network trustworthy.</p>
        <p>Use user management to search accounts, suspend accounts that violate marketplace rules, or restore access when appropriate.</p>
      </Card>
    </main>
  )
}
