/**
 * Reusable Modal component.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.size - Modal size: 'sm', 'md', 'lg'
 */
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  const widthClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className={`bg-white rounded-lg shadow-xl ${widthClass} w-full mx-4`} onClick={e => e.stopPropagation()}>
        <div className="card-header flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="card-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal