import { useEffect, useState } from 'react'
import { ArrowRight, ClipboardCheck, FileText, LayoutDashboard, Plus, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { LoadingState } from '../components/LoadingState.jsx'
import { PageHeading } from '../components/PageHeading.jsx'
import { RecentEvaluationTable } from '../components/RecentEvaluationTable.jsx'
import { StatCard } from '../components/StatCard.jsx'

const defaultStats = {
  total_evaluations: 0,
  completed_evaluations: 0,
  draft_evaluations: 0,
  total_issues_found: 0,
}

export function DashboardPage() {
  const [stats, setStats] = useState(defaultStats)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [noData, setNoData] = useState(false)
  const navigate = useNavigate()

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

    Promise.all([
      api.get('/evaluations/stats'),
      api.get('/evaluations/recent'),
    ])
      .then(([statsResponse, recentResponse]) => {
        if (!isMounted) return
        didResolve = true
        setStats(statsResponse.data)
        setRecent(recentResponse.data)
        setNoData(statsResponse.data.total_evaluations === 0 && recentResponse.data.length === 0)
      })
      .catch((err) => {
        if (!isMounted) return
        didResolve = true
        setNoData(true)
        setError(err.response?.data?.detail || 'Unable to load dashboard data.')
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
  }, [])

  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE OVERVIEW"
        title="Good work starts with a closer look."
        description="A clear view of your response evaluation workspace."
        action={<Link className="button button-primary" to="/evaluations/new"><Plus size={17} />New evaluation</Link>}
      />

      {loading ? (
        <LoadingState message="Loading dashboard statistics…" />
      ) : showEmptyState ? (
        <EmptyState
          title="No data found"
          description="There is no evaluation data available in this workspace yet."
          action={<Link className="button button-secondary" to="/evaluations/new">Start an evaluation</Link>}
        />
      ) : (
        <section className="metric-grid" aria-label="Workspace summary">
          <StatCard label="Total evaluations" value={stats.total_evaluations} subtitle="Across all saved drafts and completed reviews" icon={LayoutDashboard} />
          <StatCard label="Completed evaluations" value={stats.completed_evaluations} subtitle="Reviewed and finalized" icon={ClipboardCheck} />
          <StatCard label="Draft evaluations" value={stats.draft_evaluations} subtitle="In progress and ready to continue" icon={FileText} />
          <StatCard label="Total issues found" value={stats.total_issues_found} subtitle="Current issue annotations available" icon={Sparkles} />
        </section>
      )}

      <section className="dashboard-section">
        <div className="section-heading">
          <div><h2>Recent evaluations</h2><p>Your latest evaluation work will appear here.</p></div>
          <Link className="text-link" to="/evaluations">View all <ArrowRight size={15} /></Link>
        </div>
        <div className="content-surface">
          {loading ? null : showEmptyState ? (
            <EmptyState
              title="No data found"
              description="No recent evaluations are available yet."
              action={<Link className="button button-secondary" to="/evaluations/new">Start an evaluation <ArrowRight size={16} /></Link>}
            />
          ) : recent.length ? (
            <RecentEvaluationTable
              items={recent}
              onOpen={(id) => navigate(`/evaluations/${id}`)}
              onContinue={(id) => navigate(`/evaluations/${id}`)}
            />
          ) : (
            <EmptyState
              title="Your evaluation history starts here"
              description="Create a draft evaluation to start collecting review records and task history."
              action={<Link className="button button-secondary" to="/evaluations/new">Start an evaluation <ArrowRight size={16} /></Link>}
            />
          )}
        </div>
      </section>

      <div className="principle-strip"><span className="principle-mark">01</span><p><strong>Human judgment stays central.</strong> Suggestions can support a review, but every final decision belongs to the evaluator.</p></div>
    </>
  )
}