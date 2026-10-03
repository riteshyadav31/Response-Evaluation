import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { ConfirmDialog } from './ConfirmDialog.jsx'
import { EmptyState } from './EmptyState.jsx'
import { ErrorMessage } from './ErrorMessage.jsx'
import { PageHeading } from './PageHeading.jsx'

const fieldLimits = {
  original_prompt: 12000,
  response_a: 20000,
  response_b: 20000,
  user_context: 5000,
  previous_conversation: 12000,
  reference_evidence: 12000,
  evaluation_notes: 5000,
}

function getFormValues(evaluation) {
  return {
    title: evaluation?.title || '',
    input: {
      original_prompt: evaluation?.input?.original_prompt || '',
      response_a: evaluation?.input?.response_a || '',
      response_b: evaluation?.input?.response_b || '',
    },
    context: {
      user_context: evaluation?.context?.user_context || '',
      previous_conversation: evaluation?.context?.previous_conversation || '',
      reference_evidence: evaluation?.context?.reference_evidence || '',
      evaluation_notes: evaluation?.context?.evaluation_notes || '',
    },
  }
}

function CharacterCounter({ value, limit, id }) {
  return <span id={`${id}-counter`} className="character-counter">{value.length.toLocaleString()} / {limit.toLocaleString()}</span>
}

function TextareaField({ id, label, value, limit, required = false, placeholder, error, onChange, className = '' }) {
  return (
    <div className={`evaluation-field ${className}`}>
      <div className="evaluation-field-heading">
        <label htmlFor={id}>{label}{required ? <span className="required-mark">Required</span> : <span className="optional-mark">Optional</span>}</label>
      </div>
      <textarea
        id={id}
        value={value}
        maxLength={limit}
        placeholder={placeholder}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error ${id}-counter` : `${id}-counter`}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="evaluation-field-footer">
        {error ? <span id={`${id}-error`} className="field-error" role="alert">{error}</span> : <span />}
        <CharacterCounter id={id} value={value} limit={limit} />
      </div>
    </div>
  )
}

function ContextField({ name, label, value, placeholder, onChange }) {
  return (
    <TextareaField
      id={name}
      label={label}
      value={value}
      limit={fieldLimits[name]}
      placeholder={placeholder}
      onChange={onChange}
      className="context-field"
    />
  )
}

export function EvaluationForm({ evaluation = null }) {
  const navigate = useNavigate()
  const [initialValues] = useState(() => getFormValues(evaluation))
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const isEditing = Boolean(evaluation)
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues)

  function setInputValue(name, value) {
    setValues((current) => ({ ...current, input: { ...current.input, [name]: value } }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  function setContextValue(name, value) {
    setValues((current) => ({ ...current, context: { ...current.context, [name]: value } }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    const nextErrors = {}
    for (const name of ['original_prompt', 'response_a', 'response_b']) {
      if (!values.input[name].trim()) nextErrors[name] = 'This field is required.'
    }
    setFieldErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) {
      document.getElementById(Object.keys(nextErrors)[0])?.focus()
      return
    }

    const payload = {
      title: values.title.trim() || null,
      input: Object.fromEntries(Object.entries(values.input).map(([name, value]) => [name, value.trim()])),
      context: Object.fromEntries(Object.entries(values.context).map(([name, value]) => [name, value.trim()])),
    }
    const saveMode = event.nativeEvent.submitter?.value || 'draft'
    setIsSubmitting(true)

    const saveRequest = isEditing
      ? api.put(`/evaluations/${evaluation.id}`, payload)
      : api.post('/evaluations/', payload)

    saveRequest
      .then(({ data }) => {
        const notice = saveMode === 'continue'
          ? 'Draft saved. Your input is ready for review.'
          : 'Draft saved successfully.'
        navigate(`/evaluations/${data.id}`, { state: { notice } })
      })
      .catch((error) => {
        const detail = error.response?.data?.detail
        setFormError(typeof detail === 'string' ? detail : 'Unable to save this draft. Check your connection and try again.')
      })
      .finally(() => setIsSubmitting(false))
  }

  function handleCancel() {
    if (isDirty) {
      setIsCancelDialogOpen(true)
      return
    }
    navigate('/evaluations')
  }

  if (isEditing && evaluation.status !== 'draft') {
    return (
      <EmptyState
        title="Completed evaluations cannot be edited"
        description="This evaluation is read-only. You can return to its details or start a new evaluation."
        action={<button type="button" className="button button-secondary" onClick={() => navigate(`/evaluations/${evaluation.id}`)}>View evaluation</button>}
      />
    )
  }

  return (
    <>
      <PageHeading
        eyebrow={isEditing ? 'EDIT DRAFT' : 'NEW EVALUATION'}
        title={isEditing ? 'Edit evaluation draft' : 'Response evaluation workspace'}
        description="Add the prompt and both responses. You can include supporting context when it helps the evaluator."
      />

      <form className="evaluation-form workspace-form" onSubmit={handleSubmit} noValidate>
        <section className="content-surface evaluation-input-panel" aria-label="Evaluation input">
          <div className="evaluation-title-field">
            <label htmlFor="evaluation-title">Evaluation title <span className="optional-mark">Optional</span></label>
            <input
              id="evaluation-title"
              type="text"
              value={values.title}
              maxLength={200}
              placeholder="Response Quality Evaluation"
              onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
            />
          </div>

          <TextareaField
            id="original_prompt"
            label="Original Prompt"
            value={values.input.original_prompt}
            limit={fieldLimits.original_prompt}
            required
            placeholder="Paste the prompt given to the AI model…"
            error={fieldErrors.original_prompt}
            onChange={(value) => setInputValue('original_prompt', value)}
          />

          <div className="response-fields">
            <TextareaField
              id="response_a"
              label="Response A"
              value={values.input.response_a}
              limit={fieldLimits.response_a}
              required
              placeholder="Paste the first AI-generated response…"
              error={fieldErrors.response_a}
              onChange={(value) => setInputValue('response_a', value)}
              className="response-field response-field-a"
            />
            <TextareaField
              id="response_b"
              label="Response B"
              value={values.input.response_b}
              limit={fieldLimits.response_b}
              required
              placeholder="Paste the second AI-generated response…"
              error={fieldErrors.response_b}
              onChange={(value) => setInputValue('response_b', value)}
              className="response-field response-field-b"
            />
          </div>
        </section>

        <details className="content-surface advanced-context">
          <summary><span>Advanced Context <span className="optional-mark">Optional</span></span><ChevronDown size={17} aria-hidden="true" /></summary>
          <div className="advanced-context-grid">
            <ContextField name="user_context" label="User Context" value={values.context.user_context} placeholder="Relevant information about the user…" onChange={(value) => setContextValue('user_context', value)} />
            <ContextField name="previous_conversation" label="Previous Conversation" value={values.context.previous_conversation} placeholder="Earlier turns that provide context…" onChange={(value) => setContextValue('previous_conversation', value)} />
            <ContextField name="reference_evidence" label="Reference Evidence" value={values.context.reference_evidence} placeholder="Source text or factual evidence…" onChange={(value) => setContextValue('reference_evidence', value)} />
            <ContextField name="evaluation_notes" label="Evaluation Notes" value={values.context.evaluation_notes} placeholder="Additional notes for the evaluator…" onChange={(value) => setContextValue('evaluation_notes', value)} />
          </div>
        </details>

        {formError ? <ErrorMessage title="Could not save draft" message={formError} /> : null}

        <div className="evaluation-save-bar">
          <span className="save-status" role="status">{isSubmitting ? 'Saving draft…' : isDirty ? 'Unsaved changes' : 'Draft ready to save'}</span>
          <div className="evaluation-save-actions">
            <button type="button" className="button button-secondary" onClick={handleCancel} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="button button-secondary" value="draft" disabled={isSubmitting}>Save as Draft</button>
            <button type="submit" className="button button-primary" value="continue" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save and Continue'}</button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        title="Discard unsaved changes?"
        description="Your changes have not been saved. Leave this page and discard them?"
        confirmText="Discard changes"
        cancelText="Keep editing"
        onConfirm={() => navigate('/evaluations')}
        onClose={() => setIsCancelDialogOpen(false)}
      />
    </>
  )
}