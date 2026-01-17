import { useState } from 'react'
import { ResultDisplay } from '../../components/ResultDisplay'
import { CopyButton } from '../../components/CopyButton'
import { normalizeSlot, getArrayElementSlot } from '../../utils/storage'

export function ArrayHelper({ contractAddress, wallet }) {
  const [baseSlot, setBaseSlot] = useState('')
  const [index, setIndex] = useState('')
  const [fromIndex, setFromIndex] = useState('')
  const [toIndex, setToIndex] = useState('')
  const [lengthResult, setLengthResult] = useState(null)
  const [elementResult, setElementResult] = useState(null)
  const [rangeResults, setRangeResults] = useState(null)
  const [calculatedSlot, setCalculatedSlot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [queryMode, setQueryMode] = useState('single') // 'single' or 'range'

  const handleQueryLength = async () => {
    if (!wallet.publicClient) {
      setError('Please connect to a network first')
      return
    }

    if (!contractAddress) {
      setError('Please enter a contract address')
      return
    }

    if (!baseSlot.trim()) {
      setError('Please enter the array base slot')
      return
    }

    setLoading(true)
    setError(null)
    setLengthResult(null)

    try {
      const slot = normalizeSlot(baseSlot)
      const value = await wallet.publicClient.getStorageAt({
        address: contractAddress,
        slot
      })
      setLengthResult({ slot, value })
    } catch (err) {
      setError(err.message || 'Failed to query storage')
    } finally {
      setLoading(false)
    }
  }

  const handleQueryElement = async () => {
    if (!wallet.publicClient) {
      setError('Please connect to a network first')
      return
    }

    if (!contractAddress) {
      setError('Please enter a contract address')
      return
    }

    if (!baseSlot.trim()) {
      setError('Please enter the array base slot')
      return
    }

    if (index === '') {
      setError('Please enter an index')
      return
    }

    setLoading(true)
    setError(null)
    setElementResult(null)
    setCalculatedSlot(null)

    try {
      const elementSlot = getArrayElementSlot(baseSlot, index)
      setCalculatedSlot(elementSlot)

      const value = await wallet.publicClient.getStorageAt({
        address: contractAddress,
        slot: elementSlot
      })
      setElementResult({ slot: elementSlot, value })
    } catch (err) {
      setError(err.message || 'Failed to query storage')
    } finally {
      setLoading(false)
    }
  }

  const handleQueryRange = async () => {
    if (!wallet.publicClient) {
      setError('Please connect to a network first')
      return
    }

    if (!contractAddress) {
      setError('Please enter a contract address')
      return
    }

    if (!baseSlot.trim()) {
      setError('Please enter the array base slot')
      return
    }

    const from = parseInt(fromIndex) || 0
    const to = parseInt(toIndex)

    if (isNaN(to)) {
      setError('Please enter a valid "to" index')
      return
    }

    if (from > to) {
      setError('"From" index must be less than or equal to "To" index')
      return
    }

    if (to - from > 100) {
      setError('Range too large. Maximum 100 elements at a time.')
      return
    }

    setLoading(true)
    setError(null)
    setRangeResults(null)

    try {
      const results = []
      for (let i = from; i <= to; i++) {
        const elementSlot = getArrayElementSlot(baseSlot, i)
        const value = await wallet.publicClient.getStorageAt({
          address: contractAddress,
          slot: elementSlot
        })
        results.push({ index: i, slot: elementSlot, value })
      }
      setRangeResults(results)
    } catch (err) {
      setError(err.message || 'Failed to query storage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted">
        Arrays store their length at the base slot. Array data starts at keccak256(baseSlot).
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm text-muted block mb-1">Array Base Slot (where length is stored)</label>
          <input
            type="text"
            value={baseSlot}
            onChange={(e) => setBaseSlot(e.target.value)}
            placeholder="0 or 0x0"
            className="w-full px-3 py-2 rounded-lg font-mono text-sm"
          />
        </div>

        <button
          onClick={handleQueryLength}
          disabled={loading || !wallet.publicClient}
          className="btn btn-secondary self-start"
        >
          {loading ? 'Loading...' : 'Get Array Length'}
        </button>

        {lengthResult && (
          <div className="p-3 rounded-lg bg-[var(--bg)]">
            <div className="text-xs text-muted mb-2">Array Length:</div>
            <ResultDisplay value={lengthResult.value} defaultFormat="uint" showFormatSelector={true} />
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted">Query Mode:</span>
          <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
            <button
              onClick={() => setQueryMode('single')}
              className={`px-3 py-1 text-sm transition-colors ${
                queryMode === 'single'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--card)] hover:bg-[var(--bg)]'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setQueryMode('range')}
              className={`px-3 py-1 text-sm transition-colors ${
                queryMode === 'range'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--card)] hover:bg-[var(--bg)]'
              }`}
            >
              Range
            </button>
          </div>
        </div>

        {queryMode === 'single' ? (
          <>
            <div>
              <label className="text-sm text-muted block mb-1">Element Index</label>
              <input
                type="text"
                value={index}
                onChange={(e) => setIndex(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg font-mono text-sm"
              />
            </div>

            <button
              onClick={handleQueryElement}
              disabled={loading || !wallet.publicClient}
              className="btn btn-primary self-start"
            >
              {loading ? 'Loading...' : 'Get Element at Index'}
            </button>

            {calculatedSlot && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Calculated slot:</span>
                <span className="font-mono">{calculatedSlot}</span>
                <CopyButton value={calculatedSlot} />
              </div>
            )}

            {elementResult && (
              <ResultDisplay value={elementResult.value} label="Element Value" showFormatSelector={true} />
            )}
          </>
        ) : (
          <>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm text-muted block mb-1">From Index</label>
                <input
                  type="text"
                  value={fromIndex}
                  onChange={(e) => setFromIndex(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg font-mono text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-muted block mb-1">To Index</label>
                <input
                  type="text"
                  value={toIndex}
                  onChange={(e) => setToIndex(e.target.value)}
                  placeholder="9"
                  className="w-full px-3 py-2 rounded-lg font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleQueryRange}
              disabled={loading || !wallet.publicClient}
              className="btn btn-primary self-start"
            >
              {loading ? 'Loading...' : 'Get Elements in Range'}
            </button>

            {rangeResults && rangeResults.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-muted">
                  Results ({rangeResults.length} elements):
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {rangeResults.map((result) => (
                    <div key={result.index} className="p-3 rounded-lg bg-[var(--bg)] flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="font-medium">Index {result.index}</span>
                        <span className="font-mono opacity-75">{result.slot.slice(0, 18)}...</span>
                        <CopyButton value={result.slot} />
                      </div>
                      <ResultDisplay value={result.value} showFormatSelector={true} compact={true} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-[var(--error)] text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
