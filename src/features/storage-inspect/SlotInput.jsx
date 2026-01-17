import { useState } from 'react'
import { ResultDisplay } from '../../components/ResultDisplay'
import { CopyButton } from '../../components/CopyButton'
import { normalizeSlot, getConsecutiveSlots } from '../../utils/storage'

export function SlotInput({ contractAddress, wallet }) {
  const [slotInput, setSlotInput] = useState('')
  const [slotCount, setSlotCount] = useState(1)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleQuery = async () => {
    if (!wallet.publicClient) {
      setError('Please connect to a network first')
      return
    }

    if (!contractAddress) {
      setError('Please enter a contract address')
      return
    }

    if (!slotInput.trim()) {
      setError('Please enter a slot number')
      return
    }

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const slots = slotCount > 1
        ? getConsecutiveSlots(slotInput, slotCount)
        : [normalizeSlot(slotInput)]

      const values = await Promise.all(
        slots.map(async (slot) => {
          const value = await wallet.publicClient.getStorageAt({
            address: contractAddress,
            slot
          })
          return { slot, value }
        })
      )

      setResults(values)
    } catch (err) {
      setError(err.message || 'Failed to query storage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-muted block mb-1">Slot Number</label>
            <input
              type="text"
              value={slotInput}
              onChange={(e) => setSlotInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              placeholder="0 or 0x0"
              className="w-full px-3 py-2 rounded-lg font-mono text-sm"
            />
          </div>
          <div className="w-24">
            <label className="text-sm text-muted block mb-1">Count</label>
            <input
              type="number"
              min="1"
              max="10"
              value={slotCount}
              onChange={(e) => setSlotCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2 rounded-lg font-mono text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleQuery}
          disabled={loading || !wallet.publicClient}
          className="btn btn-primary self-start"
        >
          {loading ? 'Loading...' : 'Query Storage'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-[var(--error)] text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">Results</span>
          {results.map(({ slot, value }, index) => (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>Slot:</span>
                <span className="font-mono">{slot}</span>
                <CopyButton value={slot} />
              </div>
              <ResultDisplay value={value} showFormatSelector={true} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
