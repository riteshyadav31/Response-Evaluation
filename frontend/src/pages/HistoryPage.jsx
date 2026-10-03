import { useEffect, useMemo, useState } from 'react'
import { FileText, PencilLine, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { LoadingState } from '../components/LoadingState.jsx'
import { PageHeading } from '../components/PageHeading.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function HistoryPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [noData, setNoData] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const showEmptyState = !loading && !error && noData

  useEffect(() => {
    let isMounted = true
    let didResolve = false

    const fallbackTimeout = window.setTimeout(() => {
      if (!isMounted || didResolve) return
      setLoading(false)
      setError('')
      setNoData(true)
    }, 800)

    const params = { page, page_size: pageSize, sort: sortOrder }
    if (search.trim()) params.search = search.trim()
    if (status) params.status = status

    api.get('/evaluations/', { params })
      .then(({ data }) => {
        if (!isMounted) return
        didResolve = true
        setItems(data.items)
        setTotalPages(data.total_pages)
        setNoData(data.items.length === 0)
        if (data.items.length === 0) {
          setError('')
        }
      })
      .catch((err) => {
        if (!isMounted) return
        didResolve = true
        setNoData(true)
        setError(err.response?.data?.detail || 'Could not load the evaluation history.')
      })
      .finally(() => {
        if (!isMounted) return
        window.clearTimeout(fallbackTimeout)
        didResolve = true
        setLoading(false)
      })

    return () => {
      isMounted = false
      window.clearTimeout(fallbackTimeout)
    }
  }, [page, pageSize, search, status, sortOrder])

  const hasFilters = useMemo(() => Boolean(search.trim() || status || sortOrder === 'asc'), [search, status, sortOrder])

  async function handleDelete(id) {
    try {
      await api.delete(`/evaluations/${id}`)
      setPendingDeleteId(null)
      setItems((previous) => previous.filter((item) => item.id !== id))
      setPage((current) => Math.max(1, current))
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to delete this evaluation.')
      setPendingDeleteId(null)
    }
  }

  if (loading) {
    return <LoadingState message="Loading evaluation history…" />
  }

  return (
    <>
      <PageHeading eyebrow="EVALUATIONS" title="Evaluation history" description="Review recent drafts and completed evaluations for your workspace." />

      <div className="content-surface history-panel">
        {showEmptyState ? (
          <EmptyState
            title="No history available"
            description="There are no evaluations saved for this workspace yet."
            action={<button type="button" className="button button-secondary" onClick={() => navigate('/evaluations/new')}>Start a new evaluation</button>}
          />
        ) : null}

        {!showEmptyState ? (
          <>
            <div className="history-toolbar">
              <label className="search-field">
                <Search size={15} />
                <input type="search" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value) }} placeholder="Search by title" aria-label="Search evaluations" />
              </label>
              <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value) }} aria-label="Filter by status">
                <option value="">All status</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>
              <select value={sortOrder} onChange={(event) => { setPage(1); setSortOrder(event.target.value) }} aria-label="Sort order">
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>

            {items.length ? (
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Created</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((evaluation) => (
                      <tr key={evaluation.id}>
                        <td>{evaluation.title}</td>
                        <td>{formatDate(evaluation.created_at)}</td>
                        <td><StatusBadge status={evaluation.status} /></td>
                        <td>
                          <div className="table-actions">
                            <button type="button" className="link-button" onClick={() => navigate(`/evaluations/${evaluation.id}`)}>
                              <FileText size={14} />Open
                            </button>
                            {evaluation.status === 'draft' ? (
                              <button type="button" className="link-button" onClick={() => navigate(`/evaluations/${evaluation.id}/edit`)}>
                                <PencilLine size={14} />Continue
                              </button>
                            ) : null}
                            <button type="button" className="link-button danger-link" onClick={() => setPendingDeleteId(evaluation.id)}>
                              <Trash2 size={14} />Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title={hasFilters ? 'No evaluations match your filters' : 'No evaluations yet'}
                description={hasFilters ? 'Try a different title search or status filter.' : 'Start with a new draft evaluation and it will appear here.'}
                action={<button type="button" className="button button-secondary" onClick={() => navigate('/evaluations/new')}>Start a new evaluation</button>}
              />
            )}

            {totalPages > 1 ? (
              <div className="pagination-row">
                <button type="button" className="button button-secondary" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button type="button" className="button button-secondary" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteId)}
        title="Delete evaluation?"
        description="This action removes the selected evaluation permanently for your workspace."
        confirmText="Delete"
        onConfirm={() => handleDelete(pendingDeleteId)}
        onClose={() => setPendingDeleteId(null)}
      />
    </>
  )
}