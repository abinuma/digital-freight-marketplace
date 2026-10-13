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
    <div className={`grid w-full gap-5 m-auto pt-8 px-0 pb-14 max-md:w-full max-md:gap-4 max-md:pt-5 px-0 pb-8 shipper-page     admin-page`}>
      <div className={`flex items-end justify-between gap-4 mb-1          max-md:items-start    max-md:flex-col  shipper-page__heading`}><div><p className={`mt-0 mx-0 mb-1.5 text-blue-700 text-xs font-extrabold tracking-widest shipper-eyebrow`}>PLATFORM OVERVIEW</p><h1>Admin dashboard</h1><p>Monitor marketplace accounts and shipment activity.</p></div></div>
      {query.isError && <Alert tone="danger" title="Dashboard unavailable">{query.error.message}</Alert>}
      <section className={`grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-md:gap-2 shipper-metrics`} aria-label="Admin summary">
        {cards.map(([key, title, caption]) => <Card className={`flex min-h-32 items-start gap-4 p-5             max-md:min-h-24 max-md:gap-2 max-md:p-3   shipper-metric   shipper-metric--blue`} key={key}><span className={`grid w-10 h-10 shrink-0 place-items-center rounded-xl text-lg font-extrabold max-md:w-8 max-md:h-8 shipper-metric__icon`} aria-hidden="true">◈</span><div><p>{title}</p>{query.isPending ? <Skeleton className={`w-12 h-6 shipper-metric__skeleton`} /> : <strong>{metrics?.[key] ?? 0}</strong>}<small>{caption}</small></div></Card>)}
        {['SHIPPER', 'TRANSPORTER', 'ADMIN'].map((role) => <Card className={`flex min-h-32 items-start gap-4 p-5             max-md:min-h-24 max-md:gap-2 max-md:p-3   shipper-metric   shipper-metric--purple`} key={role}><span className={`grid w-10 h-10 shrink-0 place-items-center rounded-xl text-lg font-extrabold max-md:w-8 max-md:h-8 shipper-metric__icon`} aria-hidden="true">♙</span><div><p>{role.toLowerCase()} accounts</p>{query.isPending ? <Skeleton className={`w-12 h-6 shipper-metric__skeleton`} /> : <strong>{metrics?.usersByRole?.[role] ?? 0}</strong>}<small>Registered users by role</small></div></Card>)}
        <Card className={`flex min-h-32 items-start gap-4 p-5             max-md:min-h-24 max-md:gap-2 max-md:p-3   shipper-metric   shipper-metric--green`}><span className={`grid w-10 h-10 shrink-0 place-items-center rounded-xl text-lg font-extrabold max-md:w-8 max-md:h-8 shipper-metric__icon`} aria-hidden="true">⇢</span><div><p>Active shipments</p>{query.isPending ? <Skeleton className={`w-12 h-6 shipper-metric__skeleton`} /> : <strong>{metrics?.shipments?.active ?? 0}</strong>}<small>Published or in progress</small></div></Card>
        <Card className={`flex min-h-32 items-start gap-4 p-5             max-md:min-h-24 max-md:gap-2 max-md:p-3   shipper-metric   shipper-metric--gold`}><span className={`grid w-10 h-10 shrink-0 place-items-center rounded-xl text-lg font-extrabold max-md:w-8 max-md:h-8 shipper-metric__icon`} aria-hidden="true">✓</span><div><p>Completed shipments</p>{query.isPending ? <Skeleton className={`w-12 h-6 shipper-metric__skeleton`} /> : <strong>{metrics?.shipments?.completed ?? 0}</strong>}<small>Successfully delivered</small></div></Card>
      </section>
      <Card className={`grid gap-5 p-5 max-md:p-4 shipper-panel     admin-intro`}><div className={`flex items-center justify-between gap-4         max-md:items-start max-md:flex-col shipper-panel__heading`}><div><h2>Marketplace administration</h2><p>Review accounts and help keep the freight network trustworthy.</p></div></div><p>Use user management to search accounts, suspend accounts that violate marketplace rules, or restore access when appropriate.</p></Card>
    </div>
  )
}
