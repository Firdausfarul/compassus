import { useState } from 'react'
import { parseFunctionSignature } from '../../utils/abi'

export function SignatureInput({ onAdd }) {
  const [signature, setSignature] = useState('')
  const [error, setError] = useState(null)

  const handleAdd = () => {
    if (!signature.trim()) {
      setError('Please enter a function signature')
      return
    }

    try {
      const funcDef = parseFunctionSignature(signature)
      setError(null)
      onAdd(funcDef)
      setSignature('')
    } catch (err) {
      setError(err.message)
    }
  }

  const examples = [
    'balanceOf(address)',
    'transfer(address to, uint256 amount)',
    'approve(address spender, uint256 amount)',
    'name()',
    'symbol()',
    'decimals()',
    'totalSupply()',
    'ownerOf(uint256 tokenId)',
    'getReserves()',
    'swap(uint256,uint256,address,bytes)'
  ]

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">Function Signature</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={signature}
          onChange={(e) => {
            setSignature(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="transfer(address to, uint256 amount)"
          className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={!signature.trim()}
          className="btn btn-primary"
        >
          Add
        </button>
      </div>
      {error && (
        <div className="text-[var(--error)] text-sm">{error}</div>
      )}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted">Quick add:</span>
        {examples.slice(0, 6).map(ex => (
          <button
            key={ex}
            onClick={() => setSignature(ex)}
            className="text-xs px-2 py-1 rounded bg-[var(--bg)] hover:bg-[var(--border)] transition-colors font-mono"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
