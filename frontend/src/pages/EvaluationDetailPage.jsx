import { useEffect, useState } from 'react'
import { ArrowLeft, PencilLine } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api.js'
import { LoadingState } from '../components/LoadingState.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { PageHeading } from '../components/PageHeading.jsx'
import { StatusBadge } from '../components/StatusBadge.jsx'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function EvaluationDetailPage() {
  const { evaluationId } = useParams()
  const navigate = useNavigate()
  const [evaluation, setEvaluation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    api.get(`/evaluations/${evaluationId}`)
      .then(({ data }) => {
        if (isMounted) setEvaluation(data)
      })
      .catch((err) => {
        if (isMounted) setError(err.response?.data?.detail || 'Unable to load this evaluation.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [evaluationId])

  if (isLoading) {
    return <LoadingState message="Loading evaluation…" />
  }

  if (error) {
    return (
      <div className="content-surface dialog-box error-panel">
        <strong>Evaluation not available</strong>
        <p>{error}</p>
        <Link className="button button-secondary" to="/evaluations"><ArrowLeft size={16} />Back to history</Link>
      </div>
    )
  }

  if (!evaluation) {
    return (
      <EmptyState
        title="Evaluation not found"
        description="This evaluation may have been removed or you may not have access to it."
        action={<button type="button" className="button button-secondary" onClick={() => navigate('/evaluations')}>Return to history</button>}
      />
    )
  }

  return (
    <>
      <PageHeading
        eyebrow="EVALUATION WORKSPACE"
        title={evaluation.title}
        description="This placeholder keeps the draft ready for the next evaluation module."
        action={
          evaluation.status === 'draft' ? (
            <button type="button" className="button button-primary" onClick={() => navigate(`/evaluations/${evaluation.id}`)}>
              <PencilLine size={16} />Continue draft
            </button>
          ) : null
        }
      />
      <div className="content-surface detail-panel">
        <dl className="detail-list">
          <div>
            <dt>Status</dt>
            <dd><StatusBadge status={evaluation.status} /></dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDate(evaluation.created_at)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatDate(evaluation.updated_at)}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{evaluation.category || 'Unassigned'}</dd>
          </div>
        </dl>
        <div className="detail-callout">
          <p>This draft is intentionally lightweight and will be expanded in Module 4 with the response workspace and scoring flow.</p>
          <Link className="button button-secondary" to="/evaluations"><ArrowLeft size={16} />Back to evaluation history</Link>
        </div>
      </div>
    </>
  )
}
