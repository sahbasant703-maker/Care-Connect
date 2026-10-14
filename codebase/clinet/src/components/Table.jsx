/**
 * Reusable Table component.
 *
 * @param {Object} props - Component props
 * @param {Array} props.columns - Column definitions: [{key, label, render}]
 * @param {Array} props.data - Row data objects
 * @param {string} props.emptyMessage - Message when no data
 * @param {string} props.className - Additional CSS classes
 */
function Table({ columns, data, emptyMessage = 'No data available', className = '' }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-slate-500 py-8">{emptyMessage}</p>
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map(col => <th key={col.key}>{col.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id || idx}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table