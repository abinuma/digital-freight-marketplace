import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Badge, Button, Card, Modal, Pagination, Spinner } from '../../../shared/components/index.js'
import { listSuspensionAppeals } from '../admin.api.js'

const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export function AdminSuspensionAppealsPage() {
  const [page, setPage] = useState(1)
  const [selectedAppeal, setSelectedAppeal] = useState(null)
  const appealsQuery = useQuery({
    queryKey: ['admin', 'suspensionAppeals', page],
    queryFn: () => listSuspensionAppeals({ page, limit: 20 }),
  })
  const appeals = appealsQuery.data?.appeals || []

  return (
    <main className="admin-page">
      <header className="admin-page__heading">
        <p className="admin-page__eyebrow">ACCOUNT OVERSIGHT</p>
        <h1>Suspension appeals</h1>
        <p>Review requests sent by users asking for their account suspension to be reconsidered.</p>
      </header>

      <Card className="admin-users-panel">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="m-0 text-base font-semibold text-slate-900">Appeal inbox</h2>
            <p className="mb-0 mt-1 text-xs text-slate-500">Select a row to read the appeal message.</p>
          </div>
          {appealsQuery.data && <Badge tone="neutral">{appealsQuery.data.pagination.total} total</Badge>}
        </div>
        {appealsQuery.isError && <Alert tone="danger" title="Appeals could not be loaded">{appealsQuery.error.message}</Alert>}
        {appealsQuery.isPending ? (
          <div className="admin-users-loading"><Spinner /></div>
        ) : appeals.length ? (
          <div className="admin-user-table-wrap">
            <table className="admin-user-table">
              <thead><tr><th>Name</th><th>Email</th><th>Date sent</th></tr></thead>
              <tbody>{appeals.map((appeal) => (
                <tr
                  key={appeal.id}
                  className="cursor-pointer hover:bg-slate-50 focus-within:bg-slate-50"
                  onClick={() => setSelectedAppeal(appeal)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedAppeal(appeal)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Read appeal from ${appeal.user.name || appeal.user.email}`}
                >
                  <td><strong>{appeal.user.name || 'User'}</strong></td>
                  <td>{appeal.user.email}</td>
                  <td>{formatDate(appeal.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="admin-users-empty"><h2>No appeals yet</h2><p>Appeals submitted by suspended users will appear here.</p></div>
        )}
        <div className="admin-users-pagination">
          <Pagination page={page} pageCount={appealsQuery.data?.pagination?.totalPages || 1} onPageChange={setPage} />
        </div>
      </Card>

      <Modal
        open={Boolean(selectedAppeal)}
        onClose={() => setSelectedAppeal(null)}
        title="Suspension appeal"
      >
        {selectedAppeal && (
          <div className="grid gap-4">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold text-slate-500">Name</dt><dd className="m-0 text-slate-900">{selectedAppeal.user.name || 'User'}</dd></div>
              <div><dt className="font-semibold text-slate-500">Email</dt><dd className="m-0 text-slate-900">{selectedAppeal.user.email}</dd></div>
              <div><dt className="font-semibold text-slate-500">Date sent</dt><dd className="m-0 text-slate-900">{formatDate(selectedAppeal.createdAt)}</dd></div>
            </dl>
            <section className="grid gap-2">
              <h2 className="m-0 text-sm font-semibold text-slate-900">Appeal message</h2>
              <p className="m-0 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{selectedAppeal.message}</p>
            </section>
            <div className="flex justify-end"><Button variant="secondary" onClick={() => setSelectedAppeal(null)}>Close</Button></div>
          </div>
        )}
      </Modal>
    </main>
  )
}
