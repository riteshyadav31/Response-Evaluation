import { ArrowRight, Eye, PencilLine } from 'lucide-react'
import { StatusBadge } from './StatusBadge.jsx'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function RecentEvaluationTable({ items, onOpen, onContinue }) {
  if (!items.length) {
    return null
  }

  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            <th>Evaluation title</th>
            <th>Created date</th>
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
                  <button type="button" className="link-button" onClick={() => onOpen(evaluation.id)}>
                    <Eye size={14} />View
                  </button>
                  {evaluation.status === 'draft' ? (
                    <button type="button" className="link-button" onClick={() => onContinue(evaluation.id)}>
                      <PencilLine size={14} />Continue
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
