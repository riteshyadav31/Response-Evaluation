import { BarChart3 } from 'lucide-react'
import { EmptyState } from '../components/EmptyState.jsx'
import { PageHeading } from '../components/PageHeading.jsx'

export function ReportsPage() {
  return <>
    <PageHeading eyebrow="INSIGHTS" title="Reports" description="A home for evaluation summaries and exports." />
    <div className="content-surface page-placeholder"><EmptyState icon={BarChart3} title="Reports will appear here" description="Reporting is intentionally not part of this project setup module." /></div>
  </>
}