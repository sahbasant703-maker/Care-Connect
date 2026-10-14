import { useAuth } from '../services/authContext'

/**
 * Shared page header — used across all dashboards.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Subtitle text (welcome message)
 * @param {React.ReactNode} props.actions - Action buttons on the right side
 */
function Header({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div className="container flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex gap-3 items-center">
          {actions}
        </div>
      </div>
    </header>
  )
}

export default Header