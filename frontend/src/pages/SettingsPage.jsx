import { Settings2 } from 'lucide-react'
import { EmptyState } from '../components/EmptyState.jsx'
import { PageHeading } from '../components/PageHeading.jsx'

export function SettingsPage() {
  return <>
    <PageHeading eyebrow="WORKSPACE" title="Settings" description="Workspace preferences and configuration." />
    <div className="content-surface page-placeholder"><EmptyState icon={Settings2} title="Workspace settings" description="Configuration options will be added alongside the features they support." /></div>
  </>
}