import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { PageHeading } from '../components/PageHeading.jsx'

export function NewEvaluationPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const { data } = await api.post('/evaluations/', { title })
      navigate(`/evaluations/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to create a new evaluation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeading eyebrow="EVALUATIONS" title="New evaluation" description="Create a draft review record for a future evaluation workspace." />
      <div className="content-surface form-panel">
        <div className="panel-icon"><ClipboardCheck size={18} /></div>
        <h2>Create a draft evaluation</h2>
        <form className="evaluation-form" onSubmit={handleSubmit}>
          <label className="field-stack">
            <span>Evaluation title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Response Quality Evaluation"
              maxLength={200}
              aria-label="Evaluation title"
            />
          </label>
          <p className="muted-copy">Optional. If left blank, the platform will create a default evaluation title.</p>
          {error ? <div className="feedback-panel error-panel"><div className="loading-indicator" aria-hidden="true" /><div><strong>Could not create evaluation</strong><p>{error}</p></div></div> : null}
          <button type="submit" className="button button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating draft…' : 'Create draft'}
          </button>
        </form>
      </div>
    </>
  )
}