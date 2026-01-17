import { useState, useEffect } from 'react'
import { isAddress, getAddress } from 'viem'

export function AddressInput({ value, onChange, label = 'Contract Address', placeholder = '0x...' }) {
  const [error, setError] = useState(null)
  const [inputValue, setInputValue] = useState(value || '')

  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  const handleChange = (e) => {
    const val = e.target.value.trim()
    setInputValue(val)

    if (!val) {
      setError(null)
      onChange('')
      return
    }

    if (!val.startsWith('0x')) {
      setError('Address must start with 0x')
      onChange('')
      return
    }

    if (val.length !== 42) {
      setError('Address must be 42 characters')
      onChange('')
      return
    }

    if (!isAddress(val)) {
      setError('Invalid address format')
      onChange('')
      return
    }

    try {
      const checksummed = getAddress(val)
      setError(null)
      onChange(checksummed)
    } catch {
      setError('Invalid address checksum')
      onChange('')
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-muted">{label}</label>
      )}
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg font-mono text-sm ${error ? 'border-[var(--error)]' : ''}`}
      />
      {error && (
        <span className="text-xs text-[var(--error)]">{error}</span>
      )}
    </div>
  )
}
