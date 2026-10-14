import { Link, useLocation } from 'react-router-dom'

/**
 * Shared sidebar navigation — role-based menu items.
 *
 * @param {Object} props - Component props
 * @param {Array} props.items - Navigation items: [{path, label, icon}]
 */
function Sidebar({ items }) {
  const location = useLocation()

  return (
    <aside className="sidebar w-64 bg-white border-r border-slate-200 min-h-screen p-4">
      <nav className="space-y-1">
        {items.map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar