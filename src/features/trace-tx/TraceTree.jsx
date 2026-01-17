import { useState } from 'react'
import { shortenAddress, formatEther, formatGas } from '../../utils/formatters'
import { CopyButton } from '../../components/CopyButton'

const ChevronIcon = ({ expanded }) => (
  <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

function TraceNode({ call, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const [showInput, setShowInput] = useState(false)
  const [showOutput, setShowOutput] = useState(false)

  const hasChildren = call.calls && call.calls.length > 0
  const callType = call.type?.toLowerCase() || 'call'

  const getTypeColor = () => {
    switch (callType) {
      case 'call': return 'text-blue-400'
      case 'staticcall': return 'text-purple-400'
      case 'delegatecall': return 'text-yellow-400'
      case 'create': return 'text-green-400'
      case 'create2': return 'text-green-400'
      default: return 'text-muted'
    }
  }

  const isError = call.error || call.revertReason

  return (
    <div className={`trace-node ${callType}`}>
      <div
        className={`flex items-start gap-2 py-2 cursor-pointer hover:bg-[var(--bg)] rounded transition-colors ${
          isError ? 'text-[var(--error)]' : ''
        }`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <ChevronIcon expanded={expanded} />
        ) : (
          <span className="w-4"></span>
        )}

        <div className="flex-1 flex flex-wrap items-center gap-2 text-sm">
          {/* Call type badge */}
          <span className={`font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg)] ${getTypeColor()}`}>
            {call.type || 'CALL'}
          </span>

          {/* To address */}
          <span className="font-mono">
            {call.to ? shortenAddress(call.to, 6) : '(contract creation)'}
          </span>
          {call.to && <CopyButton value={call.to} />}

          {/* Value if non-zero */}
          {call.value && call.value !== '0x0' && BigInt(call.value) > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
              {formatEther(call.value)} ETH
            </span>
          )}

          {/* Gas */}
          {call.gas && (
            <span className="text-xs text-muted">
              gas: {formatGas(call.gas)}
            </span>
          )}

          {/* Error */}
          {isError && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
              {call.error || call.revertReason}
            </span>
          )}
        </div>
      </div>

      {/* Input/Output toggles */}
      <div className="ml-6 flex gap-2 mb-2">
        {call.input && call.input !== '0x' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowInput(!showInput)
            }}
            className="text-xs text-muted hover:text-[var(--text)] transition-colors"
          >
            {showInput ? 'Hide' : 'Show'} Input ({call.input.length / 2 - 1} bytes)
          </button>
        )}
        {call.output && call.output !== '0x' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowOutput(!showOutput)
            }}
            className="text-xs text-muted hover:text-[var(--text)] transition-colors"
          >
            {showOutput ? 'Hide' : 'Show'} Output
          </button>
        )}
      </div>

      {/* Input data */}
      {showInput && call.input && (
        <div className="ml-6 mb-2 p-2 rounded bg-[var(--bg)] font-mono text-xs break-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted">Input:</span>
            <CopyButton value={call.input} />
          </div>
          {call.input}
        </div>
      )}

      {/* Output data */}
      {showOutput && call.output && (
        <div className="ml-6 mb-2 p-2 rounded bg-[var(--bg)] font-mono text-xs break-all">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted">Output:</span>
            <CopyButton value={call.output} />
          </div>
          {call.output}
        </div>
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div className="ml-2">
          {call.calls.map((childCall, index) => (
            <TraceNode key={index} call={childCall} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TraceTree({ trace }) {
  if (!trace) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Call Tree</h3>
        {trace.gasUsed && (
          <span className="text-xs text-muted">
            Total Gas Used: {formatGas(trace.gasUsed)}
          </span>
        )}
      </div>
      <TraceNode call={trace} />
    </div>
  )
}
