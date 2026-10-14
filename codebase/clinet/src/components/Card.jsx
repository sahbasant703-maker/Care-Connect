/**
 * Reusable Card component.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.title - Card title (rendered in header if provided)
 * @param {React.ReactNode} props.header - Card header content (overrides title)
 * @param {React.ReactNode} props.footer - Card footer content
 * @param {string} props.className - Additional CSS classes for the card wrapper
 */
function Card({ children, title, header, footer, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || header) && (
        <div className="card-header">
          {header || <h2 className="text-xl font-semibold text-slate-900">{title}</h2>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  )
}

export default Card