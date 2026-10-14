/**
 * Reusable Button component.
 *
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant: 'primary', 'secondary', 'success', 'danger', 'outline'
 * @param {string} props.size - Button size: 'sm', 'md'
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.disabled - Disable the button
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {string} props.type - Button type attribute
 */
function Button({
  variant = 'primary',
  size = '',
  loading = false,
  disabled = false,
  className = '',
  children,
  onClick,
  type = 'button'
}) {
  const classes = `btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`.trim()

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}

export default Button