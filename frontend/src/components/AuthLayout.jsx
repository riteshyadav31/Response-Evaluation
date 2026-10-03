import { Link } from 'react-router-dom'

export function AuthLayout({ eyebrow, title, description, children, footer }) {
  return (
    <main className="auth-page">
      <div className="auth-brand-row">
        <Link className="brand-lockup" to="/login" aria-label="Response Quality sign in">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span className="brand-name">response<span>quality</span></span>
        </Link>
        <span className="auth-brand-caption">Evaluator workspace</span>
      </div>
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-panel-heading">
          <div className="eyebrow">{eyebrow}</div>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
        </div>
        {children}
        <div className="auth-panel-footer">{footer}</div>
      </section>
      <div className="auth-assurance"><span className="human-note-dot" />Human judgment stays central</div>
    </main>
  )
}