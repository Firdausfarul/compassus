export function ParameterInput({ input, index, value, onChange }) {
  const name = input.name || `arg${index}`
  const type = input.type
  const components = input.components // For tuple/struct types

  const getPlaceholder = () => {
    switch (type) {
      case 'address':
        return '0x...'
      case 'uint256':
      case 'uint':
        return '0'
      case 'int256':
      case 'int':
        return '0'
      case 'bool':
        return 'true or false'
      case 'bytes32':
        return '0x...'
      case 'bytes':
        return '0x...'
      case 'string':
        return 'text'
      case 'tuple':
        if (components && components.length > 0) {
          const example = {}
          components.forEach(c => {
            example[c.name || 'field'] = c.type.includes('int') ? '0' : c.type === 'bool' ? 'true' : c.type === 'address' ? '0x...' : 'value'
          })
          return JSON.stringify(example, null, 2)
        }
        return '{"field1": value1, "field2": value2}'
      default:
        if (type.endsWith('[]')) {
          const baseType = type.replace(/\[\d*\]$/, '')
          if (baseType === 'tuple') {
            return '[{...}, {...}]'
          }
          return '[value1, value2, ...]'
        }
        return ''
    }
  }

  const isComplexType = type === 'tuple' || type.endsWith('[]') || type.startsWith('tuple')

  // Show struct fields hint if available
  const getStructHint = () => {
    if (type === 'tuple' && components && components.length > 0) {
      return (
        <div className="text-xs text-muted mt-1 p-2 bg-[var(--bg)] rounded">
          <span className="font-medium">Struct fields:</span>
          <ul className="mt-1 space-y-0.5">
            {components.map((c, i) => (
              <li key={i} className="font-mono">
                {c.name || `[${i}]`}: <span className="opacity-75">{c.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    if (type.endsWith('[]') && type.startsWith('tuple') && components) {
      return (
        <div className="text-xs text-muted mt-1 p-2 bg-[var(--bg)] rounded">
          <span className="font-medium">Array of structs. Each element:</span>
          <ul className="mt-1 space-y-0.5">
            {components.map((c, i) => (
              <li key={i} className="font-mono">
                {c.name || `[${i}]`}: <span className="opacity-75">{c.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm">
        <span className="text-muted">{name}</span>
        <span className="text-xs ml-2 font-mono text-muted opacity-75">({type})</span>
      </label>
      {type === 'bool' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-2 rounded-lg"
        >
          <option value="">Select...</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      ) : isComplexType ? (
        <>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={getPlaceholder()}
            className="px-3 py-2 rounded-lg font-mono text-sm h-24 resize-y"
          />
          {getStructHint()}
        </>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={getPlaceholder()}
          className="px-3 py-2 rounded-lg font-mono text-sm"
        />
      )}
    </div>
  )
}
