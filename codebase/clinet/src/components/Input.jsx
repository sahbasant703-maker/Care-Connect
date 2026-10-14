/**
 * Reusable Input component.
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message to display
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.min - Min value (for number/date inputs)
 * @param {number} props.max - Max value
 * @param {number} props.rows - Rows (for textarea)
 */
function Input({
  label, type = 'text', name, value, onChange,
  placeholder = '', error = '', required = false,
  disabled = false, className = '', min, max, rows
}) {
  const isTextarea = type === 'textarea'

  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={name} className="form-label">{label}{required && ' *'}</label>}
      {isTextarea ? (
        <textarea
          id={name} name={name} className={`form-input ${error ? 'border-red-500' : ''}`}
          placeholder={placeholder} value={value} onChange={onChange}
          required={required} disabled={disabled} rows={rows || 3}
        />
      ) : (
        <input
          type={type} id={name} name={name} className={`form-input ${error ? 'border-red-500' : ''}`}
          placeholder={placeholder} value={value} onChange={onChange}
          required={required} disabled={disabled} min={min} max={max}
        />
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

export default Input