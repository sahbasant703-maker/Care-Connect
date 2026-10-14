/**
 * Reusable Badge component for status indicators.
 *
 * @param {Object} props - Component props
 * @param {string} props.text - Badge text
 * @param {string} props.variant - Badge color variant
 * @param {string} props.className - Additional CSS classes
 */
function Badge({ text, variant = 'secondary', className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {text}
    </span>
  )
}

export default Badge