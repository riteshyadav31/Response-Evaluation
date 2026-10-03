import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api.js'
import { EvaluationForm } from '../components/EvaluationForm.jsx'
import { ErrorMessage } from '../components/ErrorMessage.jsx'
import { LoadingState } from '../components/LoadingState.jsx'

export function EditEvaluationPage() {
  const { evaluationId } = useParams()
  const [evaluation, setEvaluation] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError('')

    api.get(`/evaluations/${evaluationId}`)
      .then(({ data }) => {
        if (isMounted) setEvaluation(data)
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.response?.data?.detail || 'Unable to load this draft.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [evaluationId])

  if (isLoading) return <LoadingState message="Loading evaluation draft…" />
  if (error) {
    return (
      <ErrorMessage
        title="Draft unavailable"
        message={<>{error} <Link to="/evaluations">Return to evaluation history.</Link></>}
      />
    )
  }
  if (!evaluation) return null

  return <EvaluationForm key={evaluation.id} evaluation={evaluation} />
}