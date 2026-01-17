import { useState } from 'react'
import { ResultDisplay } from '../../components/ResultDisplay'
import { CopyButton } from '../../components/CopyButton'
import { getMappingSlot, getNestedMappingSlot } from '../../utils/storage'

const KEY_TYPES = ['address', 'uint256', 'bytes32', 'string']

export function MappingHelper({ contractAddress, wallet }) {
  const [baseSlot, setBaseSlot] = useState('')
  const [keys, setKeys] = useState([{ value: '', type: 'address' }])
  const [result, setResult] = useState(null)
  const [calculatedSlot, setCalculatedSlot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const addKey = () => {
    setKeys(prev => [...prev, { value: '', type: 'address' }])
  }

  const removeKey = (index) => {
    if (keys.length > 1) {
      setKeys(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateKey = (index, field, value) => {
    setKeys(prev => prev.map((key, i) =>
      i === index ? { ...key, [field]: value } : key
    ))
  }

  const handleQuery = async () => {
    if (!wallet.publicClient) {
      setError('Please connect to a network first')
      return
    }

    if (!contractAddress) {
      setError('Please enter a contract address')
      return
    }

    if (!baseSlot.trim()) {
      setError('Please enter the mapping base slot')
      return
    }

    const emptyKey = keys.find(k => !k.value.trim())
    if (emptyKey) {
      setError('Please fill in all key values')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setCalculatedSlot(null)

    try {
      let slot
      if (keys.length === 1) {
        slot = getMappingSlot(baseSlot, keys[0].value, keys[0].type)
      } else {
        slot = getNestedMappingSlot(baseSlot, keys)
      }

      setCalculatedSlot(slot)

      const value = await wallet.publicClient.getStorageAt({
        address: contractAddress,
        slot
      })
      setResult({ slot, value })
    } catch (err) {
      setError(err.message || 'Failed to query storage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted">
        Mapping values are stored at keccak256(key || slot). For nested mappings, apply recursively.
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm text-muted block mb-1">Mapping Base Slot</label>
          <input
            type="text"
            value={baseSlot}
            onChange={(e) => setBaseSlot(e.target.value)}
            placeholder="0 or 0x0"
            className="w-full px-3 py-2 rounded-lg font-mono text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted">Keys</label>
            <button
              onClick={addKey}
              className="btn btn-secondary text-xs py-1"
            >
              + Add Nested Key
            </button>
          </div>

          {keys.map((key, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-xs text-muted">
                {keys.length > 1 ? `K${index + 1}` : 'Key'}
              </div>
              <select
                value={key.type}
                onChange={(e) => updateKey(index, 'type', e.target.value)}
                className="px-3 py-2 rounded-lg text-sm"
              >
                {KEY_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="text"
                value={key.value}
                onChange={(e) => updateKey(index, 'value', e.target.value)}
                placeholder={key.type === 'address' ? '0x...' : key.type === 'uint256' ? '123' : '...'}
                className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
              />
              {keys.length > 1 && (
                <button
                  onClick={() => removeKey(index)}
                  className="btn btn-secondary text-xs py-2 px-3"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleQuery}
          disabled={loading || !wallet.publicClient}
          className="btn btn-primary self-start"
        >
          {loading ? 'Loading...' : 'Query Mapping Value'}
        </button>

        {calculatedSlot && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Calculated slot:</span>
            <span className="font-mono break-all">{calculatedSlot}</span>
            <CopyButton value={calculatedSlot} />
          </div>
        )}

        {result && (
          <ResultDisplay value={result.value} label="Mapping Value" showFormatSelector={true} />
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-[var(--error)] text-sm">
          {error}
        </div>
      )}

      {/* Example */}
      <div className="text-xs text-muted border-t border-[var(--border)] pt-3">
        <strong>Example:</strong> For <code className="bg-[var(--bg)] px-1 rounded">mapping(address =&gt; mapping(uint256 =&gt; value))</code>,
        add two keys: first the address, then the uint256.
      </div>
    </div>
  )
}
