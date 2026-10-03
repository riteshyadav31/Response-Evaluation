import { useEffect, useState } from 'react'
import { ArrowLeft, PencilLine } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
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
  const location = useLocation()
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
        description="Review the saved prompt, responses, and any supporting context."
        action={
          evaluation.status === 'draft' ? (
            <button type="button" className="button button-primary" onClick={() => navigate(`/evaluations/${evaluation.id}/edit`)}>
              <PencilLine size={16} />Continue draft
            </button>
          ) : null
        }
      />
      {location.state?.notice ? <div className="save-confirmation" role="status">{location.state.notice}</div> : null}
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
        {evaluation.input ? (
          <section className="evaluation-detail-inputs" aria-label="Saved evaluation input">
            <div><h2>Original Prompt</h2><p>{evaluation.input.original_prompt}</p></div>
            <div className="evaluation-detail-responses">
              <div><h2>Response A</h2><p>{evaluation.input.response_a}</p></div>
              <div><h2>Response B</h2><p>{evaluation.input.response_b}</p></div>
            </div>
            {Object.values(evaluation.context || {}).some(Boolean) ? (
              <details className="evaluation-detail-context">
                <summary>Advanced Context</summary>
                <dl>
                  {Object.entries({
                    'User Context': evaluation.context.user_context,
                    'Previous Conversation': evaluation.context.previous_conversation,
                    'Reference Evidence': evaluation.context.reference_evidence,
                    'Evaluation Notes': evaluation.context.evaluation_notes,
                  }).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                </dl>
              </details>
            ) : null}
          </section>
        ) : <p className="muted-copy">No response input was saved for this evaluation.</p>}
        <div className="detail-callout">
          <p>AI analysis is not part of this workspace yet. Your original inputs remain available for the next review step.</p>
          <Link className="button button-secondary" to="/evaluations"><ArrowLeft size={16} />Back to evaluation history</Link>
        </div>
      </div>
    </>
  )
}
