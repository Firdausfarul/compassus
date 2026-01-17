import { useState } from 'react'
import { FORMAT_TYPES, formatValue } from '../utils/formatters'

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

export function ResultDisplay({ value, label, showFormatSelector = true, defaultFormat = 'raw', compact = false }) {
  const [format, setFormat] = useState(defaultFormat)
  const [copied, setCopied] = useState(false)

  if (!value && value !== 0) {
    return null
  }

  const hexValue = typeof value === 'string' ? value : `0x${value.toString(16)}`
  const { value: formatted, error } = formatValue(hexValue, format)
  const displayValue = error ? `Error: ${error}` : formatted

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className={`font-mono text-sm flex-1 truncate ${error ? 'text-[var(--error)]' : ''}`}>
          {displayValue}
        </div>
        <div className="flex items-center gap-1">
          {showFormatSelector && FORMAT_TYPES.map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                format === f
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--border)] text-muted hover:text-[var(--text)]'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-[var(--border)] transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        {label && <span className="text-sm font-medium text-muted">{label}</span>}
        {showFormatSelector && (
          <div className="flex items-center gap-1">
            {FORMAT_TYPES.map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  format === f
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--bg)] text-muted hover:text-[var(--text)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative group">
        <div className={`value-display ${error ? 'text-[var(--error)]' : ''}`}>
          {displayValue}
        </div>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--card)] hover:bg-[var(--border)]"
          title="Copy to clipboard"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  )
}

export function MultiResultDisplay({ results, label }) {
  if (!results || results.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {label && <span className="text-sm font-medium">{label}</span>}
      {results.map((result, index) => (
        <ResultDisplay
          key={index}
          value={result.value}
          label={result.name || `Output ${index}`}
          defaultFormat={result.type?.startsWith('uint') ? 'uint' : result.type?.startsWith('int') ? 'int' : result.type === 'address' ? 'address' : 'raw'}
        />
      ))}
    </div>
  )
}
