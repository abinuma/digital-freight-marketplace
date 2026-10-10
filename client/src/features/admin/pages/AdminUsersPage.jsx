import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Badge, Button, Card, Input, Modal, Pagination, Select, Spinner, Textarea } from '../../../shared/components/index.js'
import { listAdminUsers, updateAdminUserStatus } from '../admin.api.js'

const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))

export function AdminUsersPage() {
  const cache = useQueryClient()
  const [filters, setFilters] = useState({ q: '', role: '', status: '' })
  const [applied, setApplied] = useState(filters)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const query = useQuery({
    queryKey: ['admin', 'users', applied, page],
    queryFn: () => listAdminUsers({ ...applied, page, limit: 20 }),
  })

  async function submitFilters(event) {
    event.preventDefault()
    setPage(1)
    setApplied({ ...filters, q: filters.q.trim() })
  }

  async function confirmAction() {
    if (!action) return
    setWorking(true)
    setError('')
    try {
      await updateAdminUserStatus({ id: action.user.id, action: action.type, reason: reason.trim() })
      setAction(null)
      setReason('')
      await cache.invalidateQueries({ queryKey: ['admin', 'users'] })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setWorking(false)
    }
  }

  const users = query.data?.users || []
  const title = action?.type === 'suspend' ? 'Suspend this account?' : 'Restore this account?'

  return (
    <div className="shipper-page admin-page">
      <div className="shipper-page__heading"><div><p className="shipper-eyebrow">ACCOUNT OVERSIGHT</p><h1>User management</h1><p>Search accounts and manage access to the marketplace.</p></div></div>
      {error && <Alert tone="danger" title="Account action failed">{error}</Alert>}
      <Card className="shipper-panel admin-user-panel">
        <form className="admin-user-filters" onSubmit={submitFilters}>
          <label className="shipper-field"><span>Search users</span><Input type="search" placeholder="Name or email" value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} /></label>
          <label className="shipper-field"><span>Role</span><Select value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}><option value="">All roles</option><option value="SHIPPER">Shipper</option><option value="TRANSPORTER">Transporter</option><option value="ADMIN">Admin</option></Select></label>
          <label className="shipper-field"><span>Account status</span><Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></Select></label>
          <Button type="submit">Apply filters</Button>
        </form>
        {query.isError && <Alert tone="danger" title="Users could not be loaded">{query.error.message}</Alert>}
        {query.isPending ? <div className="shipper-loading-list"><Spinner /></div> : users.length === 0 ? <div className="shipper-empty"><span>♙</span><h2>No users found</h2><p>Try changing the search or filters.</p></div> : <div className="shipper-table-wrap"><table className="shipper-table admin-user-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Access</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><strong>{user.name || 'Incomplete profile'}</strong><small>{user.email}</small>{user.suspensionReason && <small>Reason: {user.suspensionReason}</small>}</td><td>{user.role || 'Unassigned'}</td><td><Badge tone={user.status === 'SUSPENDED' ? 'danger' : 'success'}>{user.status}</Badge></td><td>{formatDate(user.createdAt)}</td><td><Button size="sm" variant={user.status === 'SUSPENDED' ? 'primary' : 'danger'} onClick={() => { setAction({ user, type: user.status === 'SUSPENDED' ? 'activate' : 'suspend' }); setReason('') }}>{user.status === 'SUSPENDED' ? 'Restore access' : 'Suspend'}</Button></td></tr>)}</tbody></table></div>}
        <Pagination page={page} pageCount={query.data?.pagination?.totalPages || 1} onPageChange={setPage} />
      </Card>
      <Modal open={Boolean(action)} onClose={() => !working && setAction(null)} title={title}>
        <p className="admin-confirm-copy">{action?.type === 'suspend' ? `Suspend ${action.user.name || action.user.email}? They will no longer be able to use the marketplace.` : `Restore marketplace access for ${action?.user.name || action?.user.email}?`}</p>
        {action?.type === 'suspend' && <label className="shipper-field"><span>Reason for suspension <i>*</i></span><Textarea maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this account is being suspended" required /></label>}
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="shipper-modal-actions"><Button variant="secondary" onClick={() => setAction(null)} disabled={working}>Cancel</Button><Button variant={action?.type === 'suspend' ? 'danger' : 'primary'} onClick={confirmAction} disabled={working || (action?.type === 'suspend' && !reason.trim())}>{working ? <Spinner /> : action?.type === 'suspend' ? 'Suspend account' : 'Restore access'}</Button></div>
      </Modal>
    </div>
  )
}
