import { PageHeading } from '../components/PageHeading.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export function ProfilePage() {
  const { user } = useAuth()
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'

  return <>
    <PageHeading eyebrow="ACCOUNT" title="Your profile" description="Account details for your evaluator workspace." />
    <section className="profile-surface" aria-label="Profile details">
      <div className="profile-large-avatar" aria-hidden="true">{user?.full_name?.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div>
      <dl className="profile-details">
        <div><dt>Full name</dt><dd>{user?.full_name}</dd></div>
        <div><dt>Email address</dt><dd>{user?.email}</dd></div>
        <div><dt>Member since</dt><dd>{createdAt}</dd></div>
      </dl>
    </section>
  </>
}